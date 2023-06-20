import BigNumber from 'bignumber.js';
import Transactions from '../lib/models/transaction';
import Currencies from '../lib/models/currency';
import { sendTransactionNotificationEmail } from '../lib/mailer/transaction';
import { contractWithSigner, contractWithoutSigner, toWei, fromWei } from '../evm/web3';
import { AEScipherDecrypt } from '../lib/utils/main';
import type { CurrencyWithContractAddress, TransactionType, UserType, BlockchainType } from '../lib/types/model.types';

/* 
* NOTE: We can remove CURRENCY_ID filter and use only BLOCKCHAIN_CATEGORY to process evm deposit...
* for all currencies compatible with evm blockchain. However, having a lot of evm compatible currencies
* in the database will make the function to be cumbersome and in this case, we should setup a different handler
* for each currency blockchain category.
*/

const BLOCKCHAIN_CATEGORY = 'evm'; // this is the blockchain category we are handling here
const MAX_TRANSACTION_LIMIT = 25; // this is the limit of transactions we want to process at once

export async function processEvmWithdrawal(CURRENCY_ID: string) {
    const currencies: CurrencyWithContractAddress[] = await Currencies.find({ 
        id: CURRENCY_ID, 
        category: BLOCKCHAIN_CATEGORY,
        withdrawalEnabled: true
    })
    .populate('blockchain')
    .lean();

    const totalWithdrawnObject: {[key: string]: number} = {};

    for (const currency of currencies) {
        if (currency.blockchain.disabled) continue;

        const { totalWithdrawn } = await dispatchAndUpdateEvmWithdrawal(currency as CurrencyWithContractAddress);
        const currencyId = currency._id as string;
        totalWithdrawnObject[currencyId] = totalWithdrawn;
    }

    const currenciesWriteResult = await Currencies.bulkWrite(
        Object.keys(totalWithdrawnObject).map((_id) => ({
            updateOne: {
                filter: { _id },
                update: { $inc: { totalWithdrawn: totalWithdrawnObject[_id] } },
            }
        })),
        {ordered: false}
    );
    
    return currenciesWriteResult;
}

export async function confirmAndFinaliseWithdrawal(CURRENCY_ID: string) {
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
    const currencies: Array<CurrencyWithContractAddress> = await Currencies.find({ id: CURRENCY_ID, category: BLOCKCHAIN_CATEGORY }).populate('blockchain').lean();
    const pendingTransactions: Array<TransactionType & {owner: UserType}> = await Transactions.find({
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

    const onchainTransactionStatus = await Promise.allSettled(
        pendingTransactions.map((tx) => {
            const currency = currencies.find((currency) => currency._id.toString() === tx.currency.toString()) as CurrencyWithContractAddress;
            const providerContract = contractWithoutSigner(currency, currency.blockchain);
            return providerContract.getTransactionReceipt(tx.transactionHash);
        })
    ) as {status: 'fulfilled' | 'rejected', value?: {transactionHash: string}, reason?: any}[]

   const withdrawalWriteResult = await Transactions.bulkWrite(
        onchainTransactionStatus.map((tx, i) => {
            const { _id, status: previousStatus } = pendingTransactions[i];
            const { status, value } = tx;
            const fulfilled = status === 'fulfilled';
            const txStatus = fulfilled && value?.transactionHash ? 'successful' : previousStatus;

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
        .filter((_, i) => onchainTransactionStatus[i].status === 'fulfilled' && onchainTransactionStatus[i]?.value?.transactionHash) // only successful transactions
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
        withdrawalNotificationWrite
    }
}

export async function dispatchAndUpdateEvmWithdrawal(currency: CurrencyWithContractAddress) {
    const pendingTransactions: Array<TransactionType> = await Transactions.find({
        currency: currency._id,
        status: 'pending',
        type: 'withdrawal',
        processed: false, // not sent to blockchain
        internal: false,
        flagged: false,
    })
    .select('exactAmount to _id')
    .limit(MAX_TRANSACTION_LIMIT)
    .lean();

    if (pendingTransactions.length === 0) {
        return { totalWithdrawn: 0 };
    }

    const { decimal, blockchain, symbol, id: currencyId } = currency;
    const { distributionAddress, distributionAddressKey, id } = blockchain;
    const decryptedKey = AEScipherDecrypt(distributionAddressKey, process.env.WALLET_SECRET as string);
    const providerContract = contractWithSigner(currency, {...blockchain as BlockchainType, distributionAddressKey: decryptedKey});
  
    /* 
    * fetch the balance of the currency we are processing
    * fetch the coin balance for gas fee,
    * Fetch the gas price from the blockchain,
    * Fetch the nonce,
    * 
    */
    const [nonce, coinBalance, assetBalance, gasPrice, gasLimit]: Array<number> = await Promise.all([
        providerContract.getTransactionCount(distributionAddress),
        providerContract.getBalance(distributionAddress),
        providerContract.balanceOf(distributionAddress),
        providerContract.getGasPrice(),
        (providerContract.estimateGas as any).transfer(distributionAddress, toWei(1, decimal)), // estimate with any value
    ]).catch((err) => {
        throw new Error(err);
    })
    
    // check if the total amount to be withdrawn is greater than the asset balance
    const totalToBeWithdrawn = pendingTransactions.reduce(
        (acc, tx) => acc.plus(toWei(tx.exactAmount, decimal).toString()), 
        new BigNumber(0)
    );
    
    if (totalToBeWithdrawn.isGreaterThan(assetBalance)) throw new Error(`Insufficient balance:${id}-${currencyId}-${symbol}:balance ${new BigNumber(assetBalance).toString()} < ${totalToBeWithdrawn.toString()}`);

    // check if the coin balance is enough to pay for the gas fee
    const totalGasFee = new BigNumber(gasPrice).multipliedBy(gasLimit).multipliedBy(pendingTransactions.length);

    if (totalGasFee.isGreaterThan(coinBalance)) throw new Error(`Insufficient gas fee:${id}-${currencyId}-${symbol}:gas fee ${totalGasFee.toString()}  > ${new BigNumber(coinBalance).toString()}`);

    // broadcast the transaction
    const onchainTransaction = await Promise.allSettled(
        pendingTransactions
        .map((tx, i) => providerContract.transfer(tx.to, toWei(tx.exactAmount, decimal), { 
            nonce: nonce + i,
            from: distributionAddress,
            gasPrice,
            gasLimit,
        }
        ))
    ) as {status: 'fulfilled' | 'rejected', value?: {hash: string}, reason?: any}[]

    // update the transaction state and transaction hash
    await Transactions.bulkWrite(
        onchainTransaction.map((tx, i) => {
            const { _id } = pendingTransactions[i];
            const { status, value, reason } = tx;
            const transactionHash = status === 'fulfilled' ? value?.hash : '' ;
            const processed = status === 'fulfilled' ? true : false;
            const error = status === 'rejected' ? reason : '';

            return {
                updateOne: {
                    filter: { _id },
                    update: {
                        $set: {
                            from: distributionAddress,
                            processed,
                            transactionHash,
                            comment: error,
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
    }
}
