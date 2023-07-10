"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var bignumber_js_1 = require("bignumber.js");
var transaction_1 = require("../lib/mailer/transaction");
var web3_1 = require("../evm/web3");
var main_1 = require("../lib/utils/main");
var app_config_1 = require("../lib/app.config");
/*
* NOTE: We can remove CURRENCY_ID filter and use only BLOCKCHAIN_CATEGORY to process evm deposit...
* for all currencies compatible with evm blockchain. However, having a lot of evm compatible currencies
* in the database will make the function to be cumbersome and in this case, we should setup a different handler
* for each currency blockchain category.
*/
var EvmWithdrawalHandler = /** @class */ (function () {
    /**
     * @param mongooseContext - A valid connected mongoose context
     */
    function EvmWithdrawalHandler(mongooseContext, MAX_TRANSACTION_LIMIT) {
        /**
         * The category of the Blockchain we are processing
         * Values could be 'evm' | 'bitcoin' | 'solana'
         */
        this.BLOCKCHAIN_CATEGORY = 'evm';
        /**
        * The maximum number of database transaction to process at once
        */
        this.MAX_TRANSACTION_LIMIT = 25;
        if (MAX_TRANSACTION_LIMIT)
            this.MAX_TRANSACTION_LIMIT;
        this.mongooseContext = mongooseContext;
    }
    EvmWithdrawalHandler.prototype.ensureDBConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.mongooseContext.connection.readyState !== 1)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.mongooseContext.connection.asPromise()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        ;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch currency for a given (internal) Id string (not objectId)
     * @param CURRENCY_ID - Internal ID of the currency
    */
    EvmWithdrawalHandler.prototype.getCurrencies = function (CURRENCY_ID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.mongooseContext.models[app_config_1.appCollections.Currencies].find({
                        id: CURRENCY_ID,
                        category: this.BLOCKCHAIN_CATEGORY,
                        withdrawalEnabled: true
                    })
                        .populate('blockchain')
                        .lean()];
            });
        });
    };
    /**
     * Find pending unprocessed evm withdrawals for all currencies with CURRENCY_ID and send them onchain
     * @param CURRENCY_ID - Internal ID of the currency
     * @param MAX_TRANSACTION_LIMIT - The maximum number of transaction to process
     * @returns
     */
    EvmWithdrawalHandler.prototype.processEvmWithdrawal = function (CURRENCY_ID, MAX_TRANSACTION_LIMIT) {
        if (MAX_TRANSACTION_LIMIT === void 0) { MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT; }
        return __awaiter(this, void 0, void 0, function () {
            var currencies, totalWithdrawnObject, _i, currencies_1, currency, totalWithdrawn, currencyId, currencyWrite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureDBConnection()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getCurrencies(CURRENCY_ID)];
                    case 2:
                        currencies = _a.sent();
                        totalWithdrawnObject = {};
                        _i = 0, currencies_1 = currencies;
                        _a.label = 3;
                    case 3:
                        if (!(_i < currencies_1.length)) return [3 /*break*/, 6];
                        currency = currencies_1[_i];
                        if (currency.blockchain.disabled)
                            return [3 /*break*/, 5];
                        return [4 /*yield*/, this.dispatchAndUpdateEvmWithdrawal(currency, MAX_TRANSACTION_LIMIT)];
                    case 4:
                        totalWithdrawn = (_a.sent()).totalWithdrawn;
                        currencyId = currency._id.toString();
                        totalWithdrawnObject[currencyId] = totalWithdrawn;
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        currencyWrite = Object.keys(totalWithdrawnObject).filter(function (_id) { return totalWithdrawnObject[_id] > 0; }).map(function (_id) { return ({
                            updateOne: {
                                filter: { _id: _id },
                                update: { $inc: { totalWithdrawn: totalWithdrawnObject[_id] } },
                            }
                        }); });
                        if (currencyWrite.length === 0) {
                            return [2 /*return*/, 0];
                        }
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Currencies].bulkWrite(currencyWrite, { ordered: false })];
                    case 7: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find pending unprocessed evm withdrawals for a single currency and send them onchain
     * @param currency - Currency document from the database
     * @param MAX_TRANSACTION_LIMIT - The maximum number of transaction to process
     * @returns
     */
    EvmWithdrawalHandler.prototype.dispatchAndUpdateEvmWithdrawal = function (currency, MAX_TRANSACTION_LIMIT) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        if (MAX_TRANSACTION_LIMIT === void 0) { MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT; }
        return __awaiter(this, void 0, void 0, function () {
            var pendingTransactions, decimal, blockchain, symbol, currencyId, contractAddress, distributionAddress, distributionAddressKey, id, decryptedKey, providerContract, constructTransactionData, _s, nonce, nativeCoinBalance, tokenBalance, feeData, gasLimit, totalToBeWithdrawn, finalGasPrice, finalGasLimit, distributionAddressTokenBalance, totalGasFeeNeeded, onchainTransaction, txNonce, _i, pendingTransactions_1, pendingTx, transferData, transfer;
            return __generator(this, function (_t) {
                switch (_t.label) {
                    case 0: return [4 /*yield*/, this.ensureDBConnection()];
                    case 1:
                        _t.sent();
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Transactions].find({
                                currency: currency._id,
                                status: 'pending',
                                type: 'withdrawal',
                                processed: false,
                                internal: false,
                                flagged: false,
                            })
                                .select('exactAmount to _id')
                                .limit(MAX_TRANSACTION_LIMIT)
                                .lean()];
                    case 2:
                        pendingTransactions = _t.sent();
                        if (pendingTransactions.length === 0) {
                            return [2 /*return*/, { totalWithdrawn: 0 }];
                        }
                        decimal = currency.decimal, blockchain = currency.blockchain, symbol = currency.symbol, currencyId = currency.id, contractAddress = currency.contractAddress;
                        distributionAddress = blockchain.distributionAddress, distributionAddressKey = blockchain.distributionAddressKey, id = blockchain.id;
                        decryptedKey = (0, main_1.AEScipherDecrypt)(distributionAddressKey, process.env.WALLET_SECRET);
                        return [4 /*yield*/, (0, web3_1.contractWithSigner)(currency, __assign(__assign({}, blockchain), { distributionAddressKey: decryptedKey }))];
                    case 3:
                        providerContract = _t.sent();
                        constructTransactionData = function (methodName) {
                            var args = [];
                            for (var _i = 1; _i < arguments.length; _i++) {
                                args[_i - 1] = arguments[_i];
                            }
                            return providerContract.interface.encodeFunctionData(methodName, Array.from(args));
                        };
                        return [4 /*yield*/, Promise.all([
                                (_b = (_a = providerContract.runner) === null || _a === void 0 ? void 0 : _a.provider) === null || _b === void 0 ? void 0 : _b.getTransactionCount(distributionAddress),
                                (_d = (_c = providerContract.runner) === null || _c === void 0 ? void 0 : _c.provider) === null || _d === void 0 ? void 0 : _d.getBalance(distributionAddress),
                                providerContract.balanceOf(distributionAddress),
                                (_f = (_e = providerContract.runner) === null || _e === void 0 ? void 0 : _e.provider) === null || _f === void 0 ? void 0 : _f.getFeeData(),
                                // estimate with any value
                                (_h = (_g = providerContract.runner) === null || _g === void 0 ? void 0 : _g.estimateGas) === null || _h === void 0 ? void 0 : _h.call(_g, {
                                    from: distributionAddress,
                                    to: distributionAddress,
                                    // get sample data using any valid values
                                    data: constructTransactionData('transfer', distributionAddress, (0, web3_1.toWei)(1, decimal)),
                                })
                            ])
                                .catch(function (err) {
                                throw new Error(err);
                            })
                            // check if the total amount to be sent onchain is greater than the available token balance
                        ];
                    case 4:
                        _s = _t.sent(), nonce = _s[0], nativeCoinBalance = _s[1], tokenBalance = _s[2], feeData = _s[3], gasLimit = _s[4];
                        totalToBeWithdrawn = pendingTransactions.reduce(function (acc, tx) { return acc.plus((0, web3_1.toWei)(tx.exactAmount, decimal).toString()); }, new bignumber_js_1.default(0));
                        if (totalToBeWithdrawn.isGreaterThan(tokenBalance))
                            throw new Error("Insufficient balance:".concat(id, "-").concat(currencyId, "-").concat(symbol, ":balance ").concat(new bignumber_js_1.default(tokenBalance).toString(), " < ").concat(totalToBeWithdrawn.toString()));
                        finalGasPrice = (_m = (_k = (_j = feeData === null || feeData === void 0 ? void 0 : feeData.gasPrice) === null || _j === void 0 ? void 0 : _j.toString()) !== null && _k !== void 0 ? _k : (_l = feeData === null || feeData === void 0 ? void 0 : feeData.maxFeePerGas) === null || _l === void 0 ? void 0 : _l.toString()) !== null && _m !== void 0 ? _m : '5';
                        finalGasLimit = new bignumber_js_1.default((_o = gasLimit === null || gasLimit === void 0 ? void 0 : gasLimit.toString()) !== null && _o !== void 0 ? _o : '100000').multipliedBy(5);
                        distributionAddressTokenBalance = (_p = nativeCoinBalance === null || nativeCoinBalance === void 0 ? void 0 : nativeCoinBalance.toString()) !== null && _p !== void 0 ? _p : '0';
                        totalGasFeeNeeded = new bignumber_js_1.default(finalGasPrice).multipliedBy(finalGasLimit).multipliedBy(pendingTransactions.length);
                        if (totalGasFeeNeeded.isGreaterThan(distributionAddressTokenBalance))
                            throw new Error("Insufficient gasFee:".concat(id, "-").concat(currencyId, "-").concat(symbol, ":need ").concat(totalGasFeeNeeded.toString(), " but balance is ").concat(new bignumber_js_1.default(distributionAddressTokenBalance).toString()));
                        onchainTransaction = [];
                        txNonce = nonce !== null && nonce !== void 0 ? nonce : 0;
                        _i = 0, pendingTransactions_1 = pendingTransactions;
                        _t.label = 5;
                    case 5:
                        if (!(_i < pendingTransactions_1.length)) return [3 /*break*/, 8];
                        pendingTx = pendingTransactions_1[_i];
                        transferData = {
                            from: distributionAddress,
                            to: contractAddress,
                            nonce: txNonce++,
                            gasPrice: finalGasPrice,
                            gasLimit: finalGasLimit.toString(),
                            data: constructTransactionData('transfer', pendingTx.to, (0, web3_1.toWei)(pendingTx.exactAmount, decimal)),
                        };
                        return [4 /*yield*/, ((_r = (_q = providerContract.runner) === null || _q === void 0 ? void 0 : _q.sendTransaction) === null || _r === void 0 ? void 0 : _r.call(_q, transferData))];
                    case 6:
                        transfer = _t.sent();
                        if (transfer)
                            onchainTransaction.push(transfer.hash);
                        _t.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: 
                    // update the transaction state and transaction hash
                    return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Transactions].bulkWrite(onchainTransaction.map(function (transactionHash, i) {
                            var _id = pendingTransactions[i]._id;
                            return {
                                updateOne: {
                                    filter: { _id: _id },
                                    update: {
                                        $set: {
                                            from: distributionAddress,
                                            processed: true,
                                            transactionHash: transactionHash,
                                        },
                                        $inc: { attempts: 1 },
                                    }
                                }
                            };
                        }), { ordered: false })];
                    case 9:
                        // update the transaction state and transaction hash
                        _t.sent();
                        return [2 /*return*/, {
                                totalWithdrawn: new bignumber_js_1.default((0, web3_1.fromWei)(totalToBeWithdrawn.toString(), decimal)).toNumber(),
                            }];
                }
            });
        });
    };
    /**
     * Find processed onchain evm withdrawal transaction, confirm the status and update their status
     * @param CURRENCY_ID - Internal ID of the currency
     * @param MAX_TRANSACTION_LIMIT - The maximum number of transaction to process
     * @returns
     */
    EvmWithdrawalHandler.prototype.confirmAndFinaliseWithdrawal = function (CURRENCY_ID, MAX_TRANSACTION_LIMIT) {
        if (MAX_TRANSACTION_LIMIT === void 0) { MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT; }
        return __awaiter(this, void 0, void 0, function () {
            var currencies, pendingTransactions, onchainTransactionStatus, withdrawalWriteResult, withdrawalNotificationWrite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureDBConnection()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getCurrencies(CURRENCY_ID)];
                    case 2:
                        currencies = _a.sent();
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Transactions].find({
                                type: 'withdrawal',
                                status: 'pending',
                                currency: { $in: currencies.map(function (currency) { return currency._id; }) },
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
                                .lean()];
                    case 3:
                        pendingTransactions = _a.sent();
                        if (pendingTransactions.length === 0) {
                            return [2 /*return*/, {
                                    withdrawalWriteResult: 0,
                                    withdrawalNotificationWrite: 0
                                }];
                        }
                        return [4 /*yield*/, Promise.allSettled(pendingTransactions.map(function (tx) {
                                var _a, _b;
                                var currency = currencies.find(function (currency) { return currency._id.toString() === tx.currency.toString(); });
                                var providerContract = (0, web3_1.contractWithoutSigner)(currency, currency.blockchain);
                                return (_b = (_a = providerContract.runner) === null || _a === void 0 ? void 0 : _a.provider) === null || _b === void 0 ? void 0 : _b.getTransactionReceipt(tx.transactionHash);
                            }))];
                    case 4:
                        onchainTransactionStatus = _a.sent();
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Transactions].bulkWrite(onchainTransactionStatus.map(function (tx, i) {
                                var _a = pendingTransactions[i], _id = _a._id, previousStatus = _a.status;
                                var status = tx.status, value = tx.value;
                                var fulfilled = status === 'fulfilled';
                                var txStatus = fulfilled && (value === null || value === void 0 ? void 0 : value.hash) ? 'successful' : previousStatus;
                                return {
                                    updateOne: {
                                        filter: { _id: _id },
                                        update: {
                                            $set: { status: txStatus },
                                        }
                                    }
                                };
                            }), { ordered: false })
                            // Send email notification to user
                        ];
                    case 5:
                        withdrawalWriteResult = _a.sent();
                        return [4 /*yield*/, Promise.allSettled(pendingTransactions
                                .filter(function (_, i) { var _a, _b; return onchainTransactionStatus[i].status === 'fulfilled' && ((_b = (_a = onchainTransactionStatus[i]) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.hash); }) // only successful transactions
                                .filter(function (tx) { return tx.owner.transactionNotification === 1; })
                                .map(function (tx) { return ((0, transaction_1.sendTransactionNotificationEmail)(tx.owner.email, {
                                amount: tx.amount,
                                type: tx.type,
                                from: tx.from,
                                to: tx.to,
                                symbol: currencies[0].symbol,
                                name: currencies[0].name
                            })); }))];
                    case 6:
                        withdrawalNotificationWrite = _a.sent();
                        return [2 /*return*/, {
                                withdrawalWriteResult: withdrawalWriteResult,
                                withdrawalNotificationWrite: withdrawalNotificationWrite
                            }];
                }
            });
        });
    };
    return EvmWithdrawalHandler;
}());
exports.default = EvmWithdrawalHandler;
