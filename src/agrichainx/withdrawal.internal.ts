import { processInternalWithdrawalTransaction, finaliseInternalWithdrawal } from '../internal/withdrawal';

const CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db

export function processAgrichainxInternalWithdrawal() {
    return processInternalWithdrawalTransaction(CURRENCY_ID);
}

export function finaliseAgrichainxInternalDeposit() {
    return finaliseInternalWithdrawal(CURRENCY_ID);
}
