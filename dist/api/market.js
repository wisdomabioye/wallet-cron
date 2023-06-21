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
exports.getMarketData = exports.updateMarketData = exports.fetchCmcMarketData = void 0;
var market_1 = require("../lib/models/market");
var network_1 = require("../lib/utils/network");
var app_config_1 = require("../lib/app.config");
function fetchCmcMarketData() {
    return __awaiter(this, void 0, void 0, function () {
        var CMC_API_KEY, cmcIds, reqOption, cmcMarketData, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    CMC_API_KEY = process.env.CMC_API_KEY;
                    cmcIds = app_config_1.coinList.map(function (coin) { return coin.cmcId; }).join(',');
                    reqOption = {
                        url: "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=".concat(cmcIds, "&convert=usd&skip_invalid=true"),
                        method: 'get',
                        headers: {
                            'X-CMC_PRO_API_KEY': CMC_API_KEY
                        }
                    };
                    return [4 /*yield*/, (0, network_1.makeApiRequest)(reqOption)];
                case 1:
                    cmcMarketData = _a.sent();
                    return [2 /*return*/, cmcMarketData];
                case 2:
                    e_1 = _a.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.fetchCmcMarketData = fetchCmcMarketData;
function updateMarketData() {
    return __awaiter(this, void 0, void 0, function () {
        var cmcMarketData, marketData, _i, coinList_1, coin, coinData, name_1, symbol, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchCmcMarketData()];
                case 1:
                    cmcMarketData = _a.sent();
                    if (!(cmcMarketData && cmcMarketData.data)) return [3 /*break*/, 3];
                    marketData = [];
                    for (_i = 0, coinList_1 = app_config_1.coinList; _i < coinList_1.length; _i++) {
                        coin = coinList_1[_i];
                        coinData = cmcMarketData.data[coin.cmcId];
                        name_1 = coin.name, symbol = coin.symbol, id = coin.id;
                        marketData.push({
                            name: name_1,
                            symbol: symbol,
                            id: id,
                            price: { usd: coinData.quote.USD.price },
                            oneHourChangePercent: coinData.quote.USD.percent_change_1h,
                            oneDayChangePercent: coinData.quote.USD.percent_change_24h,
                            sevenDaysChangePercent: coinData.quote.USD.percent_change_7d,
                        });
                    }
                    // create many or update many
                    return [4 /*yield*/, market_1.default.bulkWrite(marketData.map(function (market) {
                            return {
                                updateOne: {
                                    filter: { id: market.id },
                                    update: { $set: market },
                                    upsert: true
                                }
                            };
                        }))];
                case 2:
                    // create many or update many
                    _a.sent();
                    console.log('updateMarketData >>> done');
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.updateMarketData = updateMarketData;
function getMarketData() {
    return __awaiter(this, void 0, void 0, function () {
        var ids, markets;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ids = app_config_1.coinList.map(function (coin) { return coin.id; });
                    return [4 /*yield*/, market_1.default.find().where('id').in(ids).lean().exec()];
                case 1:
                    markets = _a.sent();
                    return [2 /*return*/, app_config_1.coinList.map(function (coin) {
                            var market = markets.find(function (market) { return market.id === coin.id; });
                            return __assign(__assign({}, coin), market);
                        })];
            }
        });
    });
}
exports.getMarketData = getMarketData;
