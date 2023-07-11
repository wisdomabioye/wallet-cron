"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* User data
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var type_1 = require("../type");
var Users = app_config_1.appCollections.Users;
var userSchema = new mongoose_1.Schema({
    migrated: {
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        minlength: 5,
        maxlength: 60,
        lowercase: true,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    name: String,
    image: String,
    emailVerified: Boolean,
    quoteCurrency: {
        type: String,
        required: true,
        default: 'usd',
        enum: type_1.quoteCurrency
    },
    roles: { type: [String], default: ['member'] },
    transactionNotification: {
        type: Number,
        default: 1,
        min: 0,
        max: 1
    },
    flagged: {
        type: Boolean,
        default: false
    },
    createdAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } },
    updatedAt: { type: String, get: function (v) { return v === null || v === void 0 ? void 0 : v.toString(); } }
}, { timestamps: true, collection: Users });
userSchema.post('find', function (docs) {
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
* export default mongoose.model('wallet_user', userSchema); will not work for nextjs 12.1.6
*/
exports.default = mongoose_1.models[Users] || (0, mongoose_1.model)(Users, userSchema);
