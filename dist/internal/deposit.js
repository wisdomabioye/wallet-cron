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
exports.finaliseAndUpdateInternalDeposit = void 0;
var bignumber_js_1 = require("bignumber.js");
var transaction_1 = require("../lib/models/transaction");
var balance_1 = require("../lib/models/balance");
var currency_1 = require("../lib/models/currency");
var transaction_2 = require("../lib/mailer/transaction");
var MAX_TRANSACTION_LIMIT = 100;
/*
* Complete pending internal deposit
* Internal deposits are created from /internal/withdrawal.ts for every internal withdrawal request
*/
function finaliseAndUpdateInternalDeposit(CURRENCY_ID) {
    return __awaiter(this, void 0, void 0, function () {
        var currencies, replicaCurrencyIds, pendingTransactions, balanceWriteResult, depositWriteResult, depositNotificationWrite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, currency_1.default.find({ id: CURRENCY_ID }).lean()];
                case 1:
                    currencies = _a.sent();
                    replicaCurrencyIds = currencies.map(function (c) { return c._id; });
                    return [4 /*yield*/, transaction_1.default.find({
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
                case 2:
                    pendingTransactions = _a.sent();
                    console.log('pendingTransactions', pendingTransactions.length);
                    return [4 /*yield*/, balance_1.default.bulkWrite(pendingTransactions.map(function (tx) {
                            return {
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
                            };
                        }), { ordered: false })];
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
                            .filter(function (tx) {
                            var _a;
                            return (((_a = tx.owner) === null || _a === void 0 ? void 0 : _a.transactionNotification) ? tx.owner.transactionNotification === 1 : true);
                        })
                            .map(function (tx) {
                            return (0, transaction_2.sendTransactionNotificationEmail)(tx.owner.email, {
                                amount: tx.amount,
                                type: tx.type,
                                from: tx.from,
                                to: tx.to,
                                symbol: currencies[0].symbol,
                                name: currencies[0].name
                            });
                        }))];
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
exports.finaliseAndUpdateInternalDeposit = finaliseAndUpdateInternalDeposit;
