"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* balance model
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var Schema = mongoose_1.default.Schema;
var Balances = app_config_1.appCollections.Balances, Currencies = app_config_1.appCollections.Currencies, Users = app_config_1.appCollections.Users;
var balanceSchema = new Schema({
    available: { type: Number, required: true, default: 0 },
    pending: { type: Number, required: true, default: 0 },
    owner: { type: String, ref: Users, required: true, index: true, get: function (v) { return v.toString(); } },
    currency: { type: [String], ref: Currencies, required: true, index: true, get: function (v) { return v.map(function (v) { return v.toString(); }); } },
    isWithhold: { type: Boolean, default: false },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Balances });
/* balanceSchema.post('find', function(docs: any[]) {
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
* This is a hack to prevent nextjs from recompiling the model on re-render
* export default mongoose.model('wallet_balance', balanceSchema); will not work for nextjs 12.1.6
*/
var model = mongoose_1.default.models[Balances] || mongoose_1.default.model(Balances, balanceSchema);
exports.default = model;
