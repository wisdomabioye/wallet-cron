"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* marketdata model
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var Schema = mongoose_1.default.Schema;
var MarketData = app_config_1.appCollections.MarketData;
var priceSchema = new Schema({
    usd: { type: Number, default: 0 },
    gbp: { type: Number, default: 0 },
    eur: { type: Number, default: 0 },
    zar: { type: Number, default: 0 },
    ngn: { type: Number, default: 0 },
}, { _id: false });
var marketDataSchema = new Schema({
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
/* marketDataSchema.post('find', function(docs: any[]) {
    // normalise the date and object id
    docs.forEach(function(doc) {
        Object.entries(doc).forEach(([key, value]) => {
            let stringify = value instanceof mongoose.Types.ObjectId || value instanceof Date;
            doc[key] = stringify ? (value as any).toString() : value;
        })

        delete doc.__v;
    });
}) */
/*
* This is a hack to prevent nextjs from recompiling the modeal on re-render
* export default mongoose.model('wallet_market_data', marketDataSchema); will not work for nextjs 12.1.6
*/
var model = mongoose_1.default.models[MarketData] || mongoose_1.default.model(MarketData, marketDataSchema);
exports.default = model;
