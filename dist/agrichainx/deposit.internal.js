"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finaliseAgrichainxInternalDeposit = void 0;
var deposit_1 = require("../internal/deposit");
var CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db
function finaliseAgrichainxInternalDeposit() {
    return (0, deposit_1.finaliseAndUpdateInternalDeposit)(CURRENCY_ID);
}
exports.finaliseAgrichainxInternalDeposit = finaliseAgrichainxInternalDeposit;
