"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* marketdata model
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var MarketData = app_config_1.appCollections.MarketData;
var priceSchema = new mongoose_1.Schema({
    usd: { type: Number, default: 0 },
    gbp: { type: Number, default: 0 },
    eur: { type: Number, default: 0 },
    zar: { type: Number, default: 0 },
    ngn: { type: Number, default: 0 },
}, { _id: false });
var marketDataSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    id: { type: String, required: true },
    price: priceSchema,
    oneHourChangePercent: String,
    oneDayChangePercent: String,
    sevenDaysChangePercent: String,
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: MarketData });
marketDataSchema.post('find', function (docs) {
    // normalise the date and object id
    docs.forEach(function (doc) {
        Object.entries(doc).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            var stringify = value instanceof mongoose_1.Types.ObjectId || value instanceof Date;
            doc[key] = stringify ? value.toString() : value;
        });
        delete doc.__v;
    });
});
/*
* This is a hack to prevent nextjs from recompiling the modeal on re-render
* export default mongoose.model('wallet_market_data', marketDataSchema); will not work for nextjs 12.1.6
*/
exports.default = mongoose_1.models[MarketData] || (0, mongoose_1.model)(MarketData, marketDataSchema);
