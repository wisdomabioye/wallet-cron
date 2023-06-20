"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Wallet address model
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var Schema = mongoose_1.default.Schema;
var Addresses = app_config_1.appCollections.Addresses, Users = app_config_1.appCollections.Users, Blockchains = app_config_1.appCollections.Blockchains;
var addressSchema = new Schema({
    address: { type: String, required: true, unique: true, index: true },
    key: { type: String, require: true },
    active: { type: Boolean, default: true },
    owner: { type: String, ref: Users, required: true, index: true, get: function (v) { return v.toString(); } },
    blockchain: { type: String, ref: Blockchains, required: true, index: true, get: function (v) { return v.toString(); } },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Addresses });
/* addressSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_address', addressSchema); will not work for nextjs 12.1.6
*/
var model = mongoose_1.default.models[Addresses] || mongoose_1.default.model(Addresses, addressSchema);
exports.default = model;
