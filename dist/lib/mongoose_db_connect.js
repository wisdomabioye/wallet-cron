"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NODE_ENV = process.env.NODE_ENV;
var DB_HOST = process.env.DB_HOST;
var mongodbConnectionPromise;
if (NODE_ENV === 'development') {
    // preserve database connection
    if (!global._mongooseDbConnection) {
        global._mongooseDbConnection = (0, mongoose_1.connect)(DB_HOST);
    }
    mongodbConnectionPromise = global._mongooseDbConnection;
}
else {
    mongodbConnectionPromise = (0, mongoose_1.connect)(DB_HOST);
}
exports.default = mongodbConnectionPromise;
