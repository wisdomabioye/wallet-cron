"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEvmTransferAndCreateDeposit = exports.createDepositTransaction = exports.finaliseEvmDepositTransaction = exports.processEvmDeposit = void 0;
var bignumber_js_1 = require("bignumber.js");
var transaction_1 = require("../lib/models/transaction");
var balance_1 = require("../lib/models/balance");
var address_1 = require("../lib/models/address");
var currency_1 = require("../lib/models/currency");
var transaction_2 = require("../lib/mailer/transaction");
var web3_1 = require("../evm/web3");
/*
* NOTE: We can remove CURRENCY_ID filter and use only BLOCKCHAIN_CATEGORY to process evm deposit...
* for all currencies compatible with evm blockchain. However, having a lot of evm compatible currencies
* in the database will make the function to be cumbersome and in this case, we should setup a different handler
* for each currency.
*/
var BLOCKCHAIN_CATEGORY = 'evm'; // this is the blockchain category we are handling here
var MAX_TRANSACTION_LIMIT = 100;
var MAX_BLOCK_LIMIT = 3000; // BSC max is 5000
function processEvmDeposit(CURRENCY_ID) {
    return __awaiter(this, void 0, void 0, function () {
        var currencies, currencyIds, fetchResult, _i, currencies_1, currency, _a, lastBlockScanned, totalDeposited, currencyId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, currency_1.default.find({
                        id: CURRENCY_ID,
                        category: BLOCKCHAIN_CATEGORY,
                        depositEnabled: true
                    })
                        .populate('blockchain')
                        .lean()];
                case 1:
                    currencies = _b.sent();
                    currencyIds = currencies.map(function (c) { return c._id; });
                    fetchResult = {};
                    _i = 0, currencies_1 = currencies;
                    _b.label = 2;
                case 2:
                    if (!(_i < currencies_1.length)) return [3 /*break*/, 5];
                    currency = currencies_1[_i];
                    if (currency.blockchain.disabled)
                        return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchEvmTransferAndCreateDeposit(currency, currencyIds)];
                case 3:
                    _a = _b.sent(), lastBlockScanned = _a.lastBlockScanned, totalDeposited = _a.totalDeposited;
                    currencyId = currency._id.toString();
                    fetchResult[currencyId] = { lastBlockScanned: lastBlockScanned, totalDeposited: totalDeposited };
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, currency_1.default.bulkWrite(Object.keys(fetchResult).map(function (_id) { return ({
                        updateOne: {
                            filter: { _id: _id },
                            update: {
                                $inc: { totalDeposited: fetchResult[_id].totalDeposited },
                                $set: { lastBlockScanned: fetchResult[_id].lastBlockScanned },
                            },
                        }
                    }); }), { ordered: false })];
            }
        });
    });
}
exports.processEvmDeposit = processEvmDeposit;
function finaliseEvmDepositTransaction(CURRENCY_ID) {
    return __awaiter(this, void 0, void 0, function () {
        var currencies, replicaCurrencyIds, pendingTransactions, balanceWriteResult, depositWriteResult, depositNotificationWrite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, currency_1.default.find({ id: CURRENCY_ID, category: BLOCKCHAIN_CATEGORY }).lean()];
                case 1:
                    currencies = _a.sent();
                    replicaCurrencyIds = currencies.map(function (c) { return c._id; });
                    return [4 /*yield*/, transaction_1.default.find({
                            type: 'deposit',
                            status: 'pending',
                            internal: false,
                            flagged: false,
                            currency: { $in: replicaCurrencyIds },
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
                            .lean()];
                case 2:
                    pendingTransactions = _a.sent();
                    return [4 /*yield*/, balance_1.default.bulkWrite(pendingTransactions.map(function (tx) { return ({
                            updateOne: {
                                filter: {
                                    owner: tx.owner._id,
                                    currency: { $in: replicaCurrencyIds }
                                },
                                update: {
                                    $inc: { available: new bignumber_js_1.default(tx.exactAmount).toNumber() },
                                    $set: { currency: replicaCurrencyIds }
                                },
                                upsert: true,
                            }
                        }); }), { ordered: false })];
                case 3:
                    balanceWriteResult = _a.sent();
                    return [4 /*yield*/, transaction_1.default.bulkWrite(pendingTransactions.map(function (tx) { return ({
                            updateOne: {
                                filter: { _id: tx._id },
                                update: { $set: { status: 'successful' } },
                            }
                        }); }), { ordered: false })
                        // Send email notification to user
                    ];
                case 4:
                    depositWriteResult = _a.sent();
                    return [4 /*yield*/, Promise.allSettled(pendingTransactions
                            .filter(function (tx) { return tx.owner.transactionNotification === 1; })
                            .map(function (tx) { return ((0, transaction_2.sendTransactionNotificationEmail)(tx.owner.email, {
                            amount: tx.amount,
                            type: tx.type,
                            from: tx.from,
                            to: tx.to,
                            symbol: currencies[0].symbol,
                            name: currencies[0].name
                        })); }))];
                case 5:
                    depositNotificationWrite = _a.sent();
                    return [2 /*return*/, {
                            balanceWriteResult: balanceWriteResult,
                            depositWriteResult: depositWriteResult,
                            depositNotificationWrite: depositNotificationWrite
                        }];
            }
        });
    });
}
exports.finaliseEvmDepositTransaction = finaliseEvmDepositTransaction;
function createDepositTransaction(currency, filteredDepositEvents, dbAddresses, replicaCurrencyIds, stopBlock) {
    return __awaiter(this, void 0, void 0, function () {
        var currencyBalances, newDepositRecords, totalDeposited;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, balance_1.default.find({
                        currency: { $in: replicaCurrencyIds },
                        owner: {
                            $in: dbAddresses.map(function (address) { return address.owner; })
                        }
                    })
                        .lean()];
                case 1:
                    currencyBalances = _a.sent();
                    newDepositRecords = filteredDepositEvents.reduce(function (acc, event) {
                        var _a, _b, _c, _d;
                        var userAddress = dbAddresses.find(function (address) { var _a; return address.address === ((_a = event === null || event === void 0 ? void 0 : event.args) === null || _a === void 0 ? void 0 : _a.to); });
                        var userBalance = currencyBalances.find(function (balance) { return balance.owner.toString() === userAddress.owner.toString(); });
                        var readableAmount = new bignumber_js_1.default((_a = event === null || event === void 0 ? void 0 : event.args) === null || _a === void 0 ? void 0 : _a.value.toString()).dividedBy(Math.pow(10, currency.decimal)).toString();
                        var newBalance = new bignumber_js_1.default((_b = userBalance === null || userBalance === void 0 ? void 0 : userBalance.available) !== null && _b !== void 0 ? _b : 0).plus(readableAmount).toString();
                        var tx = {
                            to: userAddress.address,
                            from: (_c = event === null || event === void 0 ? void 0 : event.args) === null || _c === void 0 ? void 0 : _c.from,
                            amount: readableAmount,
                            exactAmount: readableAmount,
                            balanceBefore: (_d = userBalance === null || userBalance === void 0 ? void 0 : userBalance.available.toString()) !== null && _d !== void 0 ? _d : '0',
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
                        };
                        acc.push(tx);
                        return acc;
                    }, []);
                    return [4 /*yield*/, transaction_1.default.insertMany(newDepositRecords, { ordered: false })];
                case 2:
                    _a.sent();
                    totalDeposited = newDepositRecords.reduce(function (acc, tx) { return acc.plus(tx.amount); }, new bignumber_js_1.default(0));
                    return [2 /*return*/, {
                            lastBlockScanned: stopBlock,
                            totalDeposited: totalDeposited.toNumber(),
                            depositCount: newDepositRecords.length,
                        }];
            }
        });
    });
}
exports.createDepositTransaction = createDepositTransaction;
function fetchEvmTransferAndCreateDeposit(currency, replicaCurrencyIds) {
    return __awaiter(this, void 0, void 0, function () {
        var blockchain, lastBlockScanned, provider, eventFilter, latestBlockNumber, maxBlock, stopBlock, depositEvents, dbAddresses, depositEventsToUs, excludeTransactions, depositEventsToProcess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    blockchain = currency.blockchain, lastBlockScanned = currency.lastBlockScanned;
                    provider = (0, web3_1.contractWithoutSigner)(currency, blockchain);
                    eventFilter = provider.filters.Transfer();
                    return [4 /*yield*/, provider.getBlockNumber()];
                case 1:
                    latestBlockNumber = _a.sent();
                    maxBlock = new bignumber_js_1.default(lastBlockScanned).plus(MAX_BLOCK_LIMIT);
                    stopBlock = maxBlock.gt(latestBlockNumber) ? latestBlockNumber : maxBlock.toNumber();
                    return [4 /*yield*/, provider.queryFilter(eventFilter, lastBlockScanned, stopBlock)];
                case 2:
                    depositEvents = _a.sent();
                    return [4 /*yield*/, address_1.default.find({
                            blockchain: blockchain._id,
                            address: {
                                // TODO: event should not be 'any'
                                $in: depositEvents.map(function (event) { var _a; return (_a = event === null || event === void 0 ? void 0 : event.args) === null || _a === void 0 ? void 0 : _a.to; })
                            }
                        })
                            .select('address owner -_id')
                            .lean()];
                case 3:
                    dbAddresses = _a.sent();
                    depositEventsToUs = depositEvents.filter(
                    // TODO: event should not be 'any'
                    function (event) { return !!dbAddresses.find(function (address) { var _a; return address.address === ((_a = event === null || event === void 0 ? void 0 : event.args) === null || _a === void 0 ? void 0 : _a.to); }); });
                    return [4 /*yield*/, transaction_1.default.find({
                            type: 'deposit',
                            currency: currency._id,
                            transactionHash: {
                                $in: depositEventsToUs.map(function (event) { return event.transactionHash.toLowerCase(); })
                            }
                        })
                            .select('transactionHash -_id')
                            .lean()];
                case 4:
                    excludeTransactions = _a.sent();
                    depositEventsToProcess = depositEventsToUs.filter(function (event) { return !excludeTransactions.find(function (transaction) { return transaction.transactionHash === event.transactionHash.toLowerCase(); }); });
                    return [2 /*return*/, createDepositTransaction(currency, depositEventsToProcess, dbAddresses, replicaCurrencyIds, stopBlock)];
            }
        });
    });
}
exports.fetchEvmTransferAndCreateDeposit = fetchEvmTransferAndCreateDeposit;
