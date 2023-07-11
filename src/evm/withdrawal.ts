import BigNumber from 'bignumber.js';
import { sendTransactionNotificationEmail } from '../lib/mailer/transaction';
import { contractWithSigner, contractWithoutSigner, toWei, fromWei } from '../evm/web3';
import { AEScipherDecrypt } from '../lib/utils/main';
import type { CurrencyWithContractAddress, TransactionType, UserType, BlockchainType } from '../lib/types/model.types';
import type { MongooseContext } from '../mongooseContext';
import { appCollections } from '../lib/app.config';

/* 
* NOTE: We can remove CURRENCY_ID filter and use only BLOCKCHAIN_CATEGORY to process evm deposit...
* for all currencies compatible with evm blockchain. However, having a lot of evm compatible currencies
* in the database will make the function to be cumbersome and in this case, we should setup a different handler
* for each currency blockchain category.
*/

export default class EvmWithdrawalHandler {
    /**
     * The category of the Blockchain we are processing
     * Values could be 'evm' | 'bitcoin' | 'solana'
     */
    readonly BLOCKCHAIN_CATEGORY: string = 'evm'
     /**
     * The maximum number of database transaction to process at once
     */
    MAX_TRANSACTION_LIMIT = 25
    /**
     * A connected mongoose context 
     */
    mongooseContext: MongooseContext
    /**
     * @param mongooseContext - A valid connected mongoose context
     */
    constructor(mongooseContext: MongooseContext, MAX_TRANSACTION_LIMIT?: number) {
        if (MAX_TRANSACTION_LIMIT) this.MAX_TRANSACTION_LIMIT
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
            withdrawalEnabled: true
        })
        .populate('blockchain')
        .lean();
    }

    /**
     * Find pending unprocessed evm withdrawals for all currencies with CURRENCY_ID and send them onchain
     * @param CURRENCY_ID - Internal ID of the currency 
     * @param MAX_TRANSACTION_LIMIT - The maximum number of transaction to process
     * @returns 
     */
    async processEvmWithdrawal(CURRENCY_ID: string, MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT) {
        await this.ensureDBConnection(); 
        const currencies: CurrencyWithContractAddress[] = await this.getCurrencies(CURRENCY_ID);
    
        const totalWithdrawnObject: {[key: string]: number} = {};
        
        let pendingTransactions = 0;
        for (const currency of currencies) {
            if (currency.blockchain.disabled) continue;
    
            const { totalWithdrawn, pendingTransaction } = await this.dispatchAndUpdateEvmWithdrawal(currency as CurrencyWithContractAddress, MAX_TRANSACTION_LIMIT);
            const currencyId = currency._id.toString();
            totalWithdrawnObject[currencyId] = totalWithdrawn;
            pendingTransactions += pendingTransaction;
        }
        
        const currencyWrite = Object.keys(totalWithdrawnObject).filter(
            _id => totalWithdrawnObject[_id] > 0
        ).map((_id) => ({
            updateOne: {
                filter: { _id },
                update: { $inc: { totalWithdrawn: totalWithdrawnObject[_id] } },
            }
        }))

        if (currencyWrite.length > 0) {
            await this.mongooseContext.models[appCollections.Currencies].bulkWrite(
                currencyWrite,
                {ordered: false}
            );
        }
        
        return pendingTransactions;
    }

    /**
     * Find pending unprocessed evm withdrawals for a single currency and send them onchain
     * @param currency - Currency document from the database
     * @param MAX_TRANSACTION_LIMIT - The maximum number of transaction to process
     * @returns 
     */
    async dispatchAndUpdateEvmWithdrawal(currency: CurrencyWithContractAddress, MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT) {
        await this.ensureDBConnection(); 
        const pendingTransactions: Array<TransactionType> = await this.mongooseContext.models[appCollections.Transactions].find({
            currency: currency._id,
            status: 'pending',
            type: 'withdrawal',
            processed: false, // not yet sent to blockchain
            internal: false,
            flagged: false,
        })
        .select('exactAmount to _id')
        .limit(MAX_TRANSACTION_LIMIT)
        .lean();
        
        if (pendingTransactions.length === 0) {
            return { totalWithdrawn: 0, pendingTransaction: 0 };
        }
    
        const { decimal, blockchain, symbol, id: currencyId, contractAddress } = currency;
        const { distributionAddress, distributionAddressKey, id } = blockchain;
        const decryptedKey = AEScipherDecrypt(distributionAddressKey, process.env.WALLET_SECRET as string);
        const providerContract = await contractWithSigner(currency, {...blockchain as BlockchainType, distributionAddressKey: decryptedKey});
        const constructTransactionData = (methodName: string, ...args: any[]) => providerContract.interface.encodeFunctionData(methodName, Array.from(args));
        /* 
        * fetch the balance of our distributionAddress for the currency we are processing,
        * fetch the coin balance for gas fee,
        * Fetch the gas price from the blockchain,
        * Fetch the nonce,
        */
        
        // all call MUST resolve, otherwise we throw an error
        const [nonce, nativeCoinBalance, tokenBalance, feeData, gasLimit] = await Promise.all([
            providerContract.runner?.provider?.getTransactionCount(distributionAddress),
            providerContract.runner?.provider?.getBalance(distributionAddress),
            providerContract.balanceOf(distributionAddress),
            providerContract.runner?.provider?.getFeeData(),
            // estimate with any value
            providerContract.runner?.estimateGas?.({
                from: distributionAddress,
                to: distributionAddress,
                // get sample data using any valid values
                data: constructTransactionData('transfer', distributionAddress, toWei(1, decimal)),
            })
        ])
        .catch((err) => {
            throw new Error(err);
        })
        
        // check if the total amount to be sent onchain is greater than the available token balance
        const totalToBeWithdrawn = pendingTransactions.reduce(
            (acc, tx) => acc.plus(toWei(tx.exactAmount, decimal).toString()), 
            new BigNumber(0)
        );
        
        if (totalToBeWithdrawn.isGreaterThan(tokenBalance)) throw new Error(`Insufficient balance:${id}-${currencyId}-${symbol}:balance ${new BigNumber(tokenBalance).toString()} < ${totalToBeWithdrawn.toString()}`);
    
        // check if the coin balance is enough to pay for the gas fee
        const finalGasPrice = feeData?.gasPrice?.toString() ?? feeData?.maxFeePerGas?.toString() ?? '5';
        // Gas limit always returning '21632n' which is too low to execute the transfer. Thus, we multiply by 5. Unspent gas will be refunded
        const finalGasLimit = new BigNumber(gasLimit?.toString() ?? '100000').multipliedBy(5);
        const distributionAddressTokenBalance = nativeCoinBalance?.toString() ?? '0';
        const totalGasFeeNeeded = new BigNumber(finalGasPrice).multipliedBy(finalGasLimit).multipliedBy(pendingTransactions.length);
    
        if (totalGasFeeNeeded.isGreaterThan(distributionAddressTokenBalance)) throw new Error(`Insufficient gasFee:${id}-${currencyId}-${symbol}:need ${totalGasFeeNeeded.toString()} but balance is ${new BigNumber(distributionAddressTokenBalance).toString()}`);
        // broadcast the transaction
        
        /* const onchainTransaction = await Promise.allSettled(
            pendingTransactions
            .map((tx, i) => providerContract.transfer(tx.to, toWei(tx.exactAmount, decimal), { 
                nonce: (nonce ?? 0) + (i + 1),
                from: distributionAddress,
                gasPrice: finalGasPrice,
                gasLimit: finalGasLimit.toString(),
            }
        ))) as {status: 'fulfilled' | 'rejected', value?: {hash: string}, reason?: any}[] */
        
        const onchainTransaction: string[] = [];
        let txNonce = nonce ?? 0;

        for (const pendingTx of pendingTransactions) {
            const transferData = {
                from: distributionAddress,
                to: contractAddress,
                nonce: txNonce++,
                gasPrice: finalGasPrice,
                gasLimit: finalGasLimit.toString(),
                data: constructTransactionData('transfer', pendingTx.to, toWei(pendingTx.exactAmount, decimal)),
            }

            const transfer = await providerContract.runner?.sendTransaction?.(transferData);
            if (transfer) onchainTransaction.push(transfer.hash);
        }

        // update the transaction state and transaction hash
        await this.mongooseContext.models[appCollections.Transactions].bulkWrite(
            onchainTransaction.map((transactionHash, i) => {
                const { _id } = pendingTransactions[i];
    
                return {
                    updateOne: {
                        filter: { _id },
                        update: {
                            $set: {
                                from: distributionAddress,
                                processed: true,
                                transactionHash,
                            },
                            $inc: { attempts: 1 },
                        }
                    }
                }
            }),
            {ordered: false}
        )
    
        return {
            totalWithdrawn: new BigNumber(fromWei(totalToBeWithdrawn.toString(), decimal)).toNumber(),
            pendingTransaction: pendingTransactions.length
        }
    }

    /**
     * Find processed onchain evm withdrawal transaction, confirm the status and update their status
     * @param CURRENCY_ID - Internal ID of the currency 
     * @param MAX_TRANSACTION_LIMIT - The maximum number of transaction to process
     * @returns 
     */
    async confirmAndFinaliseWithdrawal(CURRENCY_ID: string, MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT) {
        await this.ensureDBConnection(); 
        /* 
        * THIS FUNCTION SHOULD BE CALLED IN A CRON JOB (DEFINED INTERVAL)
        * Scan the db for pending withdrawal transactions for the CURRENCY_ID
        * Finalise the transaction by:
        .....
        * 1. Fetch currencies with id CURRENCY_ID 
        * 2. Grab pending deposit transactions,
                Limit the number of transactions we process at once
        * 3. Confirm the transaction status on chain
        * 4. Update the transaction status to 'successful' if confirmed onchain
        * 5. Update the transaction status to 'failed' if not confirmed onchain and attempts > 3
        */
        const currencies: Array<CurrencyWithContractAddress> = await this.getCurrencies(CURRENCY_ID);
        const pendingTransactions: Array<TransactionType & {owner: UserType}> = await this.mongooseContext.models[appCollections.Transactions].find({
            type: 'withdrawal',
            status: 'pending',
            currency: {$in: currencies.map((currency) => currency._id)},
            processed: true,
            internal: false,
            flagged: false,
        })
        .select('owner amount type from to exactAmount transactionHash currency _id')
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
                withdrawalWriteResult: 0,
                withdrawalNotificationWrite: 0,
                pendingTransaction: 0
            }
        }

        const onchainTransactionStatus = await Promise.allSettled(
            pendingTransactions.map((tx) => {
                const currency = currencies.find((currency) => currency._id.toString() === tx.currency.toString()) as CurrencyWithContractAddress;
                const providerContract = contractWithoutSigner(currency, currency.blockchain);
                return providerContract.runner?.provider?.getTransactionReceipt(tx.transactionHash);
            })
        ) as {status: 'fulfilled' | 'rejected', value?: {hash: string}, reason?: any}[]
        
       const withdrawalWriteResult = await this.mongooseContext.models[appCollections.Transactions].bulkWrite(
            onchainTransactionStatus.map((tx, i) => {
                const { _id, status: previousStatus } = pendingTransactions[i];
                const { status, value } = tx;
                const fulfilled = status === 'fulfilled';
                const txStatus = fulfilled && value?.hash ? 'successful' : previousStatus;
    
                return {
                    updateOne: {
                        filter: { _id },
                        update: {
                            $set: { status: txStatus },
                        }
                    }
                }
            }),
            {ordered: false}
        )
    
         // Send email notification to user
       const withdrawalNotificationWrite = await Promise.allSettled(
            pendingTransactions
            .filter((_, i) => onchainTransactionStatus[i].status === 'fulfilled' && onchainTransactionStatus[i]?.value?.hash) // only successful transactions
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
            withdrawalWriteResult,
            withdrawalNotificationWrite,
            pendingTransaction: pendingTransactions.length
        }
    }
    
}