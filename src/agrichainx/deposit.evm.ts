import { processEvmDeposit, finaliseEvmDepositTransaction } from '../evm/deposit';

const CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db

export function processAgrichainxOnchainDeposit() {
    return processEvmDeposit(CURRENCY_ID);
}

export function finaliseAgrichainxOnchainDeposit() {
    return finaliseEvmDepositTransaction(CURRENCY_ID);
}