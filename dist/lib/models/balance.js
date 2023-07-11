"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* balance model
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var Balances = app_config_1.appCollections.Balances, Currencies = app_config_1.appCollections.Currencies, Users = app_config_1.appCollections.Users;
var balanceSchema = new mongoose_1.Schema({
    available: { type: Number, required: true, default: 0 },
    pending: { type: Number, required: true, default: 0 },
    owner: { type: mongoose_1.Types.ObjectId, ref: Users, required: true, index: true },
    currency: { type: [mongoose_1.Types.ObjectId], ref: Currencies, required: true, index: true },
    isWithhold: { type: Boolean, default: false },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Balances });
balanceSchema.post('find', function (docs) {
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
* export default mongoose.model('wallet_balance', balanceSchema); will not work for nextjs 12.1.6
*/
exports.default = mongoose_1.models[Balances] || (0, mongoose_1.model)(Balances, balanceSchema);
