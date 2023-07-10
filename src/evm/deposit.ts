import BigNumber from 'bignumber.js';
import { Types } from 'mongoose';
import { sendTransactionNotificationEmail } from '../lib/mailer/transaction';
import { contractWithoutSigner } from '../evm/web3';
import type { CurrencyWithContractAddress, TransactionType, AddressType, BalanceType, UserType } from '../lib/types/model.types';
import type { MongooseContext } from '../mongooseContext';
import { appCollections } from '../lib/app.config';

/* 
* NOTE: We can remove CURRENCY_ID filter and use only BLOCKCHAIN_CATEGORY to process evm deposit...
* for all currencies compatible with evm blockchain. However, having a lot of evm compatible currencies
* in the database will make the function to be cumbersome and in this case, we should setup a different handler
* for each currency.
*/

export default class EvmDepositHandler {
    /**
     * The category of the Blockchain we are processing
     * Values could be 'evm' | 'bitcoin' | 'solana'
     */
    readonly BLOCKCHAIN_CATEGORY: string = 'evm'
    /**
     * The maximum number of block we are scanning at once
     * @note Binance Smart chain maximum is 5000 for the public BSC RPC
     */
    MAX_BLOCK_LIMIT = 3000
    /**
     * The maximum database transaction to process at once
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
    constructor(mongooseContext: MongooseContext) {
        this.mongooseContext = mongooseContext
    }

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
            category: this.BLOCKCHAIN_CATEGORY,
            depositEnabled: true
        })
        .populate('blockchain')
        .lean();
    }

    /**
    * Capture deposits for CURRENCY_ID sent to us on the blockchain and create pending transactions for each deposit
    * @param CURRENCY_ID - Internal ID of the currency 
    */
    async processPendingDeposit(CURRENCY_ID: string) {
        await this.ensureDBConnection();
        const currencies = await this.getCurrencies(CURRENCY_ID);
        /** 
        * Extract currency _id (objectId) of currencies
        */
        const currencyIds = currencies.map((c) => c._id);
        
        type FetchedResult = {[key: string]: {lastBlockScanned: number, totalDeposited: number}}
        const fetchResult: FetchedResult = {}; 
        
        for (const currency of currencies) {
            if (currency.blockchain.disabled) continue;
            
            const { lastBlockScanned, totalDeposited } = await this.fetchEvmTransferAndPendingCreateDeposit(currency as CurrencyWithContractAddress, currencyIds);
            const currencyId = currency._id.toString();
            fetchResult[currencyId] = { lastBlockScanned, totalDeposited };
        }

        return this.mongooseContext.models[appCollections.Currencies].bulkWrite(
            Object.keys(fetchResult).map((_id) => ({
                updateOne: {
                    filter: { _id },
                    update: { 
                        $inc: { totalDeposited: fetchResult[_id].totalDeposited },
                        $set: { lastBlockScanned: fetchResult[_id].lastBlockScanned }, 
                    },
                }
            })),
            {ordered: false}
        );
    }

    /**
     * Fetch Evm Transfers on the blockchain for a currency and create a corresponding pending deposit for each transfer
     * @param currency - Currency document from the database
     * @param replicaCurrencyIds - Other currency ids for the same internal CURRENCY_ID
     */
    async fetchEvmTransferAndPendingCreateDeposit(currency: CurrencyWithContractAddress, replicaCurrencyIds: Types.ObjectId[]) {
        const { blockchain, lastBlockScanned } = currency;
        const provider = contractWithoutSigner(currency, blockchain);
        
        const eventFilter = provider.filters.Transfer();
        const latestBlockNumber: number = await provider.getBlockNumber();
        const maxBlock = new BigNumber(lastBlockScanned).plus(this.MAX_BLOCK_LIMIT);
        const stopBlock = maxBlock.gt(latestBlockNumber) ? latestBlockNumber : maxBlock.toNumber();

        const depositEvents = await provider.queryFilter(eventFilter, lastBlockScanned, stopBlock);

         /* 
        * 1. Filter out Addresses (to) that are not in our db
        * 2. Ensure we don't process the same event twice
        * We do this by scanning the db for duplicate transaction hashes
        * We filter out the duplicate transactions 
        * TODO: duplicate transactionHash could come from different blockchain, thus, implement an alternative means to save deposit without scanning for duplicate transactionHash
        * 
        * 3. We then process the remaining transactions by:
        * a. Create a new deposit transaction
        * b. TODO: We update the balance of the address that received the deposit directly from here
        * c. Balance is updated from 'finaliseDeposit' function
        * 4. We update the lastBlockScanned and totalDeposited
        */
        const dbAddresses: Array<AddressType> = await this.mongooseContext.models[appCollections.Addresses].find({ 
            blockchain: blockchain._id, 
            address: { 
                // TODO: event should not be 'any'
                $in: depositEvents.map((event: any) => event?.args?.to) 
            }
        })
        .select('address owner -_id')
        .lean();
        
        const depositEventsToUs = depositEvents.filter(
            // TODO: event should not be 'any'
            (event: any) => !!dbAddresses.find((address) => address.address === event?.args?.to)
        );

        const excludeTransactions: Array<TransactionType> = await this.mongooseContext.models[appCollections.Transactions].find({
            type: 'deposit', 
            currency: currency._id,
            transactionHash: { 
                $in: depositEventsToUs.map((event) => event.transactionHash.toLowerCase()) 
            }
        })
        .select('transactionHash -_id')
        .lean();

        const depositEventsToProcess = depositEventsToUs.filter(
            (event) => !excludeTransactions.find((transaction) => transaction.transactionHash === event.transactionHash.toLowerCase())
        )
        
        return this.createDepositPendingTransaction(
            currency,
            depositEventsToProcess,
            dbAddresses,
            replicaCurrencyIds,
            stopBlock
        )
    }

    /**
     * 
     * @param currency - Currency document from the database
     * @param filteredDepositEvents - Filtered (i.e contains no Duplicates or previously processed) deposit transfer event onchain
     * @param dbAddresses - Array of Deposit address document receiving the transfer 
     * @param replicaCurrencyIds - Other currency ids for the same internal CURRENCY_ID
     * @param stopBlock - The last block number scanned
     * @returns 
     */
    async createDepositPendingTransaction(
        currency: CurrencyWithContractAddress,
        filteredDepositEvents: any,
        dbAddresses: AddressType[],
        replicaCurrencyIds: Types.ObjectId[],
        stopBlock: number
        ) {
        await this.ensureDBConnection();
        
        const currencyBalances: Array<BalanceType> = await this.mongooseContext.models[appCollections.Balances].find({ 
            currency: {$in: replicaCurrencyIds}, 
            owner: {
                $in: dbAddresses.map((address) => address.owner)
            }
        })
        .lean();
    
        const newDepositRecords = filteredDepositEvents.reduce((acc: Array<Omit<TransactionType, '_id'>>, event: any) => {
            const userAddress = dbAddresses.find((address) => address.address === event?.args?.to) as AddressType;
            const userBalance = currencyBalances.find(
                (balance) => balance.owner.toString() === userAddress.owner.toString()
            );
            
            const readableAmount = new BigNumber(event?.args?.value.toString()).dividedBy(10 ** currency.decimal).toString();
            const newBalance = new BigNumber(userBalance?.available ?? 0).plus(readableAmount).toString();
    
            const tx = {
                to: userAddress.address as string,
                from: event?.args?.from,
                amount: readableAmount,
                exactAmount: readableAmount,
                balanceBefore: userBalance?.available.toString() ?? '0',
                balanceAfter: newBalance,
                fee: '0',
                transactionHash: event.transactionHash.toLowerCase(),
                status: 'pending',
                processed: true,
                type: 'deposit',
                internal: false,
                flagged: false,
                attempts: 1,
                owner: userAddress.owner,
                currency: currency._id,
            }
            acc.push(tx);
            return acc;
        }, []);
       
        await this.mongooseContext.models[appCollections.Transactions].insertMany(newDepositRecords, { ordered: false });
    
        const totalDeposited = newDepositRecords.reduce((acc: BigNumber, tx: TransactionType) => acc.plus(tx.amount), new BigNumber(0));
        return { 
            lastBlockScanned: stopBlock,
            totalDeposited: totalDeposited.toNumber(),
            depositCount: newDepositRecords.length,
        };
    }

    /**
     * Check deposit status, increase receiver's balance and update transaction 'status' to 'successful'
     * @param CURRENCY_ID - Internal ID of the currency 
     * @param MAX_TRANSACTION_LIMIT - The maximum number of database transaction to process at once
     * @returns 
     */
    async finaliseEvmDepositTransaction(CURRENCY_ID: string, MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT) {
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
    
        const currencies: Array<CurrencyWithContractAddress> = await this.getCurrencies(CURRENCY_ID);
        const replicaCurrencyIds = currencies.map((c) => c._id);
       
        const pendingTransactions: Array<TransactionType & {owner: UserType}> = await this.mongooseContext.models[appCollections.Transactions].find({
            type: 'deposit',
            status: 'pending',
            internal: false,
            flagged: false,
            currency: {$in: replicaCurrencyIds},
            processed: true,
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
    
        // TODO: Should we check confirmation on the blockchain ?
        // considering that we are fetching past events from the blockchain in 'fetchEvmTransferAndCreateDeposit' function
    
       const balanceWriteResult =  await this.mongooseContext.models[appCollections.Balances].bulkWrite(
            pendingTransactions.map((tx) => (
                {
                    updateOne: {
                        filter: { 
                            owner: tx.owner._id, 
                            currency: {$in: replicaCurrencyIds} 
                        },
                        update: { 
                            $inc: { available: new BigNumber(tx.exactAmount).toNumber() },
                            $set: { currency: replicaCurrencyIds }
                        },
                        upsert: true,
                    }
                }
            )),
            { ordered: false }
        )
    
        const depositWriteResult = await this.mongooseContext.models[appCollections.Transactions].bulkWrite(
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
            balanceWriteResult,
            depositWriteResult,
            depositNotificationWrite
        }
    }
    
}