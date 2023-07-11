"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* currency model
* Model to define the currency for each blockchain and chainIds
* For example:
* We can have ETH for chainId 1 and chainId 56 (bsc)
* Each supported chainId(blockchain) for a specific coin
* will have their db record and maintain
* the same name, id, symbol, symbol
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var Currencies = app_config_1.appCollections.Currencies, Blockchains = app_config_1.appCollections.Blockchains;
var currencySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true },
    symbol: { type: String, required: true },
    decimal: { type: Number, required: true },
    contractAddress: { type: String },
    withdrawalFee: { type: Number, required: true, default: 0, min: 0 },
    minWithdrawalAmount: { type: Number, required: true, default: 0, min: 0 },
    minDepositAmount: { type: Number, default: 0, min: 0 },
    withdrawalEnabled: { type: Boolean, default: true },
    withdrawalInstruction: { type: [String], required: true },
    depositFee: { type: Number, default: 0, min: 0 },
    depositEnabled: { type: Boolean, default: true },
    depositInstruction: { type: [String], required: true },
    blockchain: { type: mongoose_1.Types.ObjectId, ref: Blockchains, required: true, index: true },
    lastBlockScanned: { type: String, default: '0' },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Currencies });
currencySchema.post('find', function (docs) {
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
* This is a hack to prevent nextjs from recompiling the model on re-render
* export default mongoose.model('wallet_currency', currencySchema); will not work for nextjs 12.1.6
*/
exports.default = mongoose_1.models[Currencies] || (0, mongoose_1.model)(Currencies, currencySchema);
