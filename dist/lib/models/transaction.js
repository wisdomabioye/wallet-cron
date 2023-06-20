"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* This holds Wallet transaction
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var main_1 = require("../utils/main");
var type_1 = require("../type");
var Transactions = app_config_1.appCollections.Transactions, Users = app_config_1.appCollections.Users, Currencies = app_config_1.appCollections.Currencies, Authentications = app_config_1.appCollections.Authentications;
var transactionSchema = new mongoose_1.Schema({
    from: { type: String, required: function () { return this.type === 'deposit'; } },
    to: { type: String, required: true },
    amount: { type: String, required: true },
    exactAmount: { type: String, required: true },
    balanceBefore: { type: String, required: true },
    balanceAfter: { type: String, required: true },
    fee: { type: String, required: true },
    transactionHash: { type: String, index: true },
    itxHash: { type: String, index: true, default: function () { return (0, main_1.sha256)(this._id.toString()); } },
    status: { type: String, required: true, index: true, default: 'pending', enum: type_1.transactionStatus },
    processed: { type: Boolean, default: false },
    type: { type: String, required: true, index: true, enum: type_1.transactionType },
    internal: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    comment: String,
    owner: { type: mongoose_1.Types.ObjectId, ref: Users, required: true, index: true },
    currency: { type: mongoose_1.Types.ObjectId, ref: Currencies, required: true, index: true },
    authentication: { type: mongoose_1.Types.ObjectId, ref: Authentications, default: null, required: function () { return this.type === 'withdrawal'; } },
    attempts: { type: Number, default: 0 },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Transactions });
/* transactionSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_transaction', transactionSchema); will not work for nextjs 12.1.6
*/
exports.default = mongoose_1.models[Transactions] || (0, mongoose_1.model)(Transactions, transactionSchema);
