import { processEvmWithdrawal, confirmAndFinaliseWithdrawal } from '../evm/withdrawal';

const CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db

export function processWithdrawal() {
    return processEvmWithdrawal(CURRENCY_ID);
}

export function finaliseWithdrawal() {
    return confirmAndFinaliseWithdrawal(CURRENCY_ID);
}