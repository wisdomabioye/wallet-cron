"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finaliseAgrichainxOnchainDeposit = exports.processAgrichainxOnchainDeposit = void 0;
var deposit_1 = require("../evm/deposit");
var CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db
function processAgrichainxOnchainDeposit() {
    return (0, deposit_1.processEvmDeposit)(CURRENCY_ID);
}
exports.processAgrichainxOnchainDeposit = processAgrichainxOnchainDeposit;
function finaliseAgrichainxOnchainDeposit() {
    return (0, deposit_1.finaliseEvmDepositTransaction)(CURRENCY_ID);
}
exports.finaliseAgrichainxOnchainDeposit = finaliseAgrichainxOnchainDeposit;
