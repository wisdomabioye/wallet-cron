import { finaliseAndUpdateInternalDeposit } from '../internal/deposit';

const CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db

export function finaliseAgrichainxInternalDeposit() {
    return finaliseAndUpdateInternalDeposit(CURRENCY_ID);
}