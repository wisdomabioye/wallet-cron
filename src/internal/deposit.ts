import BigNumber from 'bignumber.js';
import Transactions from '../lib/models/transaction';
import Balances from '../lib/models/balance';
import Currencies from '../lib/models/currency';
import { sendTransactionNotificationEmail } from '../lib/mailer/transaction';
import type { CurrencyWithContractAddress, TransactionType, UserType } from '../lib/types/model.types';

const MAX_TRANSACTION_LIMIT = 100;


/* 
* Complete pending internal deposit
* Internal deposits are created from /internal/withdrawal.ts for every internal withdrawal request
*/
export async function finaliseAndUpdateInternalDeposit(CURRENCY_ID: string) {
    /* 
    * THIS FUNCTION SHOULD BE CALLED IN A CRON JOB (DEFINED INTERVAL)
    * Scan the db for pending deposit transactions for the CURRENCY_ID
    * Finalise the transaction by:
    .....
    * 1. Fetch currencies with id CURRENCY_ID 
         Balance of Currencies with the same CURRENCY_ID are combined into one document.
    * 2. Grab pending deposit transactions,
            Limit the number of transactions we process at once
    * 3. Update the balance of the address that received the deposit
    * 4. Update the transaction status to 'successful'
    */

    const currencies: Array<CurrencyWithContractAddress> = await Currencies.find({id: CURRENCY_ID}).lean();
    const replicaCurrencyIds = currencies.map(c => c._id);
    
    const pendingTransactions: Array<TransactionType & {owner: UserType}> = await Transactions.find({
        type: 'deposit',
        status: 'pending',
        currency: {$in: replicaCurrencyIds.map(v => v.toString())},
        processed: true,
        internal: true,
        flagged: false,
    })
    .select('owner amount type from to exactAmount currency _id')
    .populate([
        {
            path: 'owner',
            select: 'email transactionNotification _id',
        }
    ])
    .limit(MAX_TRANSACTION_LIMIT)
    .lean();

    console.log('pendingTransactions', pendingTransactions.length);

    const balanceWriteResult =  await Balances.bulkWrite(
        pendingTransactions.map((tx) => {
            return {
                updateOne: {
                    filter: { 
                        owner: tx.owner._id, 
                        currency: {$in: replicaCurrencyIds} 
                    },
                    update: { 
                        $inc: { available: new BigNumber(tx.exactAmount).toNumber() } ,
                        $set: {currency: replicaCurrencyIds }
                    },
                    upsert: true,
                }
            }
        }),
        { ordered: false }
    )

    const depositWriteResult = await Transactions.bulkWrite(
        pendingTransactions.map((tx) => (
            {
                updateOne: {
                    filter: { _id: tx._id },
                    update: { $set: { status: 'successful' } },
                }
            }
        )),
        { ordered: false }
    )

    // Send email notification to user
   const depositNotificationWrite = await Promise.allSettled(
        pendingTransactions
        .filter(tx => (
            tx.owner?.transactionNotification ? tx.owner.transactionNotification === 1 : true
        ))
        .map((tx) => {

            return sendTransactionNotificationEmail(
                tx.owner.email,
                {
                    amount: tx.amount, 
                    type: tx.type, 
                    from: tx.from,
                    to: tx.to,
                    symbol: currencies[0].symbol, 
                    name: currencies[0].name
                }
            )
        })
    )

    return {
        balanceWriteResult,
        depositWriteResult,
        depositNotificationWrite
    }
}