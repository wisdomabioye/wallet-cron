import BigNumber from 'bignumber.js';
import { Types } from 'mongoose';
import Transactions from '../lib/models/transaction';
import Currencies from '../lib/models/currency';
import Addresses from '../lib/models/address';
import Balances from '../lib/models/balance';
import { sendTransactionNotificationEmail } from '../lib/mailer/transaction';
import type { CurrencyWithContractAddress, TransactionType, AddressType, BalanceType, UserType } from '../lib/types/model.types';

const MAX_TRANSACTION_LIMIT = 100; // this is the limit of transactions we want to process at once

export async function processInternalWithdrawalTransaction(CURRENCY_ID: string) {
    /* 
    * Fetch currencies with the same ID.
    * For example, if we have a currency with id = 'usdt' on BSC and Ethereum Mainnet
    * It'll fetch the currencies for the two blockchain
    * The account 'Balance' for this currencies with the same id should be in a single document in the DB
    * And, 'Balance.currency' should hold the array of these currencies '_id' as a reference
    * Thus, Fetching account balance by currency._id of any of these matching currencies would return
    * a document containing the balance of 'currencyId'
    */
    const currencies = await Currencies.find({
        id: CURRENCY_ID, 
        depositEnabled: true, // deposit should be enabled because we are creating a corresponding deposit for each internal withdrawal
    })
    .populate('blockchain')
    .lean();
    /* 
    * This is the 'Balance.currency' referencing currencies the 'balance' is for 
    */
    const currencyIds = currencies.map(c => c._id);
    const totalDepositedObject: {[key: string]: number} = {};
    // process internal deposit for each currency variant
    for (const currency of currencies) {
        if ('disabled' in currency.blockchain && currency.blockchain.disabled) continue;
        /* 
        * Extract currency _id of currencies
        */
        const { totalDeposited } = await processInternalWithdrawal(currency as CurrencyWithContractAddress, currencyIds);
        const currencyId = currency._id.toString();
        totalDepositedObject[currencyId] = totalDeposited;
    }

    const currenciesWriteResult = Currencies.bulkWrite(
        Object.keys(totalDepositedObject).map((_id) => ({
            updateOne: {
                filter: { _id },
                update: { 
                    $inc: { totalDeposited: totalDepositedObject[_id] },
                },
            }
        })),
        {ordered: false}
    );

    return currenciesWriteResult;
}

export async function finaliseInternalWithdrawal(CURRENCY_ID: string) {
    /* 
    * 1. Get processed pending internal withdrawal transactions
    * 2. Update the status of the withdrawal transaction to 'successful'
    * 3. Send email notification to the owner of the transaction
    */
    const currencies: Array<CurrencyWithContractAddress> = await Currencies.find({ 
        id: CURRENCY_ID 
    })
    .populate('blockchain')
    .lean();

    const pendingWithdrawals: Array<TransactionType & {owner: UserType}> = await Transactions.find({
        currency: {$in: currencies.map((currency) => currency._id)},
        status: 'pending',
        type: 'withdrawal',
        processed: true, // internal transactions are processed in processInternalWithdrawal
        internal: true,
        flagged: false,
    })
    .select('amount from to type _id')
    .limit(MAX_TRANSACTION_LIMIT)
    .populate([
        {
            path: 'owner',
            select: 'email transactionNotification _id',
        }
    ])
    .lean();

    if (pendingWithdrawals.length === 0) {
        return { totalWithdrawn: 0 };
    }

    const totalWithdrawn = pendingWithdrawals.reduce(
        (acc, tx) => acc.plus(tx.amount), 
        new BigNumber(0)
    );
    
    // update the transactions state
    await Transactions.bulkWrite(
        pendingWithdrawals.map((tx) => {
            return {
                updateOne: {
                    filter: { _id: tx._id },
                    update: {
                        $set: {
                            status: 'successful',
                        }
                    }
                }
            }
        }),
        {ordered: false}
    )
    
    // Send email notification to user
    await Promise.allSettled(
        pendingWithdrawals
        .filter(tx => tx.owner.transactionNotification === 1)
        .map((tx) => (
            sendTransactionNotificationEmail(
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
        ))
    )

    return {
        totalWithdrawn: totalWithdrawn.toNumber(),
    }
}

export async function processInternalWithdrawal(currency: CurrencyWithContractAddress, replicaCurrencyIds: Types.ObjectId[]) {
    /* 
    * 1. Fetch pending internal withdrawal transactions not processed
    * 2. Fetch the 'to' address for each transaction
    * 3. Fetch the balance of each address owner
    * 4. Create new deposit transaction for each pending internal withdrawal transactions
    * 5. Update each pending internal withdrawal transactions to 'processed'
    */
    const pendingWithdrawals: Array<TransactionType & {owner: UserType}> = await Transactions.find({
        type: 'withdrawal',
        status: 'pending',
        currency: currency._id,
        processed: false,
        internal: true,
        flagged: false,
    })
    .select('amount from to exactAmount currency _id')
    .limit(MAX_TRANSACTION_LIMIT)
    .lean();

    if (pendingWithdrawals.length === 0) {
        return { totalDeposited: 0 };
    }

    const receivers: Array<AddressType> = await Addresses.find({ 
        blockchain: currency.blockchain._id, 
        address: { 
            $in: Array.from(new Set(pendingWithdrawals.map(tx => tx.to))) // remove duplicate addresses
        }
    })
    .select('address owner -_id')
    .lean()
    
    const currencyBalances: Array<BalanceType> = await Balances.find({ 
        currency: {$in: replicaCurrencyIds}, 
        owner: {
            $in: receivers.map((receiver) => receiver.owner)
        }
    })
    .lean();

    const newDepositRecords = pendingWithdrawals.reduce((acc: Array<Omit<TransactionType, '_id'>>, tx) => {
        const userAddress = receivers.find((receiver) => receiver.address === tx.to) as AddressType;
        const userBalance = currencyBalances.find(
            (balance) => balance.owner.toString() === userAddress.owner.toString()
        );
        
        const readableAmount = new BigNumber(tx.exactAmount).toString();
        const newBalance = new BigNumber(userBalance?.available ?? 0).plus(readableAmount).toString();

        const depositTx = {
            to: userAddress.address,
            from: tx.from,
            amount: readableAmount,
            exactAmount: readableAmount,
            balanceBefore: userBalance?.available.toString() ?? '0',
            balanceAfter: newBalance,
            fee: '0',
            transactionHash: '',
            status: 'pending',
            type: 'deposit',
            processed: true,
            internal: true,
            flagged: false,
            attempts: 0,
            owner: userAddress.owner,
            currency: tx.currency,
        }
        acc.push(depositTx);
        return acc;
    }, []);


    await Transactions.bulkWrite(
        // insert new deposit transactions
        [
        ...newDepositRecords.map((tx) => (
            {
                insertOne: {
                    document: tx,
                }
            }
        )),
        // update pending internal withdrawal transactions to 'processed'
        ...pendingWithdrawals.map((tx) => (
            {
                updateOne: {
                    filter: { _id: tx._id },
                    update: { $set: { processed: true } },
                }
            }
        ))
        ],
        { ordered: false }
    )
    const totalDeposited = newDepositRecords.reduce((acc: BigNumber, tx) => acc.plus(tx.amount), new BigNumber(0));

    return { 
        totalDeposited: new BigNumber(currency.totalDeposited).plus(totalDeposited).toNumber(),
        depositCount: newDepositRecords.length,
    };
}