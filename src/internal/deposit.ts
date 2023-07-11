import BigNumber from 'bignumber.js';
import { sendTransactionNotificationEmail } from '../lib/mailer/transaction';
import { appCollections } from '../lib/app.config';
import type { CurrencyWithContractAddress, TransactionType, UserType } from '../lib/types/model.types';
import type { MongooseContext } from '../mongooseContext';

export default class InternalDepositHandler {
     /**
     * The maximum number of database transaction to process at once
     */
     MAX_TRANSACTION_LIMIT = 100
     /**
      * A connected mongoose context 
      */
     mongooseContext: MongooseContext
     /**
      * 
      * @param mongooseContext - A valid connected mongoose context
      */
     constructor(mongooseContext: MongooseContext, MAX_TRANSACTION_LIMIT?: number) {
         if (MAX_TRANSACTION_LIMIT) this.MAX_TRANSACTION_LIMIT
         this.mongooseContext = mongooseContext
     }

    /**
     * Ensure that the database is connected before attempting database operation
     */ 
    async ensureDBConnection() {
        if (this.mongooseContext.connection.readyState !== 1) {
            await this.mongooseContext.connection.asPromise();
        };
    }

     /**
     * Fetch currency for a given (internal) Id string (not objectId)
     * @param CURRENCY_ID - Internal ID of the currency 
    */
    async getCurrencies(CURRENCY_ID: string): Promise<CurrencyWithContractAddress[]> {
        return this.mongooseContext.models[appCollections.Currencies].find({ 
            id: CURRENCY_ID, 
            depositEnabled: true
        })
        .populate('blockchain')
        .lean();
    }

    /**
     * Find pending processed internal deposit transaction, increase receiver's balance and update transaction 'status' to 'successful'
     * @param CURRENCY_ID - Internal ID of the currency 
     * @returns 
     */
    async finaliseInternalDeposit(CURRENCY_ID: string, MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT) {
        await this.ensureDBConnection();
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
    
        const currencies: Array<CurrencyWithContractAddress> = await this.mongooseContext.models[appCollections.Currencies].find({id: CURRENCY_ID}).lean();
        const replicaCurrencyIds = currencies.map(c => c._id);
        
        const pendingTransactions: Array<TransactionType & {owner: UserType}> = await this.mongooseContext.models[appCollections.Transactions].find({
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

        if (pendingTransactions.length === 0) {
            return {
                balanceWriteResult: 0,
                depositWriteResult: 0,
                depositNotificationWrite: 0,
                pendingTransaction: 0
            }
        }

        const { balanceWrite, depositWrite } = pendingTransactions.reduce((prev, current) => {
            return {
                balanceWrite: [
                    ...prev.balanceWrite, 
                    {
                        updateOne: {
                            filter: { 
                                owner: current.owner._id, 
                                currency: {$in: replicaCurrencyIds} 
                            },
                            update: { 
                                $inc: { available: new BigNumber(current.exactAmount).toNumber() } ,
                                $set: {currency: replicaCurrencyIds }
                            },
                            upsert: true,
                        }
                    }
                ],
                depositWrite: [
                    ...prev.depositWrite,
                    {
                        updateOne: {
                            filter: { _id: current._id },
                            update: { $set: { status: 'successful' } },
                        }
                    }
                ]
            }
            
        }, {balanceWrite: [], depositWrite: []} as {balanceWrite: any[], depositWrite: any[]})

        const balanceWriteResult =  await this.mongooseContext.models[appCollections.Balances].bulkWrite(
            balanceWrite,
            { ordered: false }
        )
        
        const depositWriteResult = await this.mongooseContext.models[appCollections.Transactions].bulkWrite(
            depositWrite,
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
            depositNotificationWrite,
            pendingTransaction: pendingTransactions.length
        }
    }
}