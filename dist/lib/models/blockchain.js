"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Blockchain model
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var type_1 = require("../type");
var Blockchains = app_config_1.appCollections.Blockchains;
var blockchainSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true, enum: type_1.blockchain, index: true },
    category: { type: String, required: true, enum: type_1.blockchainCategory },
    chainId: { type: String, required: true },
    rpcUrl: { type: String, required: true },
    // distribution address
    distributionAddress: { type: String, required: true },
    distributionAddressKey: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Blockchains });
blockchainSchema.post('find', function (docs) {
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
* export default mongoose.model('wallet_blockchain', blockchainSchema); will not work for nextjs 12.1.6
*/
exports.default = mongoose_1.models[Blockchains] || (0, mongoose_1.model)(Blockchains, blockchainSchema);
