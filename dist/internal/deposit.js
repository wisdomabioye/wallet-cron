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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = require("bignumber.js");
var transaction_1 = require("../lib/mailer/transaction");
var app_config_1 = require("../lib/app.config");
var InternalDepositHandler = /** @class */ (function () {
    /**
     *
     * @param mongooseContext - A valid connected mongoose context
     */
    function InternalDepositHandler(mongooseContext, MAX_TRANSACTION_LIMIT) {
        /**
        * The maximum number of database transaction to process at once
        */
        this.MAX_TRANSACTION_LIMIT = 100;
        if (MAX_TRANSACTION_LIMIT)
            this.MAX_TRANSACTION_LIMIT;
        this.mongooseContext = mongooseContext;
    }
    /**
     * Ensure that the database is connected before attempting database operation
     */
    InternalDepositHandler.prototype.ensureDBConnection = function () {
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
    InternalDepositHandler.prototype.getCurrencies = function (CURRENCY_ID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.mongooseContext.models[app_config_1.appCollections.Currencies].find({
                        id: CURRENCY_ID,
                        depositEnabled: true
                    })
                        .populate('blockchain')
                        .lean()];
            });
        });
    };
    /**
     * Find pending processed internal deposit transaction, increase receiver's balance and update transaction 'status' to 'successful'
     * @param CURRENCY_ID - Internal ID of the currency
     * @returns
     */
    InternalDepositHandler.prototype.finaliseInternalDeposit = function (CURRENCY_ID, MAX_TRANSACTION_LIMIT) {
        if (MAX_TRANSACTION_LIMIT === void 0) { MAX_TRANSACTION_LIMIT = this.MAX_TRANSACTION_LIMIT; }
        return __awaiter(this, void 0, void 0, function () {
            var currencies, replicaCurrencyIds, pendingTransactions, _a, balanceWrite, depositWrite, balanceWriteResult, depositWriteResult, depositNotificationWrite;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ensureDBConnection()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Currencies].find({ id: CURRENCY_ID }).lean()];
                    case 2:
                        currencies = _b.sent();
                        replicaCurrencyIds = currencies.map(function (c) { return c._id; });
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Transactions].find({
                                type: 'deposit',
                                status: 'pending',
                                currency: { $in: replicaCurrencyIds.map(function (v) { return v.toString(); }) },
                                processed: true,
                                internal: true,
                                flagged: false,
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
                    case 3:
                        pendingTransactions = _b.sent();
                        if (pendingTransactions.length === 0) {
                            return [2 /*return*/, {
                                    balanceWriteResult: 0,
                                    depositWriteResult: 0,
                                    depositNotificationWrite: 0,
                                    pendingTransaction: 0
                                }];
                        }
                        _a = pendingTransactions.reduce(function (prev, current) {
                            return {
                                balanceWrite: __spreadArray(__spreadArray([], prev.balanceWrite, true), [
                                    {
                                        updateOne: {
                                            filter: {
                                                owner: current.owner._id,
                                                currency: { $in: replicaCurrencyIds }
                                            },
                                            update: {
                                                $inc: { available: new bignumber_js_1.default(current.exactAmount).toNumber() },
                                                $set: { currency: replicaCurrencyIds }
                                            },
                                            upsert: true,
                                        }
                                    }
                                ], false),
                                depositWrite: __spreadArray(__spreadArray([], prev.depositWrite, true), [
                                    {
                                        updateOne: {
                                            filter: { _id: current._id },
                                            update: { $set: { status: 'successful' } },
                                        }
                                    }
                                ], false)
                            };
                        }, { balanceWrite: [], depositWrite: [] }), balanceWrite = _a.balanceWrite, depositWrite = _a.depositWrite;
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Balances].bulkWrite(balanceWrite, { ordered: false })];
                    case 4:
                        balanceWriteResult = _b.sent();
                        return [4 /*yield*/, this.mongooseContext.models[app_config_1.appCollections.Transactions].bulkWrite(depositWrite, { ordered: false })
                            // Send email notification to user
                        ];
                    case 5:
                        depositWriteResult = _b.sent();
                        return [4 /*yield*/, Promise.allSettled(pendingTransactions
                                .filter(function (tx) {
                                var _a;
                                return (((_a = tx.owner) === null || _a === void 0 ? void 0 : _a.transactionNotification) ? tx.owner.transactionNotification === 1 : true);
                            })
                                .map(function (tx) {
                                return (0, transaction_1.sendTransactionNotificationEmail)(tx.owner.email, {
                                    amount: tx.amount,
                                    type: tx.type,
                                    from: tx.from,
                                    to: tx.to,
                                    symbol: currencies[0].symbol,
                                    name: currencies[0].name
                                });
                            }))];
                    case 6:
                        depositNotificationWrite = _b.sent();
                        return [2 /*return*/, {
                                balanceWriteResult: balanceWriteResult,
                                depositWriteResult: depositWriteResult,
                                depositNotificationWrite: depositNotificationWrite,
                                pendingTransaction: pendingTransactions.length
                            }];
                }
            });
        });
    };
    return InternalDepositHandler;
}());
exports.default = InternalDepositHandler;
