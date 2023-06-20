"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* User data
*/
var mongoose_1 = require("mongoose");
var app_config_1 = require("../app.config");
var type_1 = require("../type");
var Schema = mongoose_1.default.Schema;
var Users = app_config_1.appCollections.Users;
var userSchema = new Schema({
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
/* userSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_user', userSchema); will not work for nextjs 12.1.6
*/
var model = mongoose_1.default.models[Users] || mongoose_1.default.model(Users, userSchema);
exports.default = model;
