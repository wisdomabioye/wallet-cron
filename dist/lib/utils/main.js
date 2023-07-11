"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeData = exports.generateBase32SecretTwoFactorString = exports.AEScipherDecrypt = exports.AEScipherEncrypt = exports.createHmacSignature = exports.verifyHmacSignature = exports.compareHash = exports.hashPassword = exports.chunkObjectToArray = exports.sha256 = exports.md5 = void 0;
var bcrypt_1 = require("bcrypt");
var crypto_1 = require("crypto");
var AES = require("crypto-js/aes");
var UTF8 = require("crypto-js/enc-utf8");
var short_unique_id_1 = require("short-unique-id");
function md5(str) {
    /*
    * Calculate md5 of a str in hex
    * returns md5 string
    */
    return (0, crypto_1.createHash)('md5').update(str.toString()).digest('hex');
}
exports.md5 = md5;
function sha256(str) {
    /*
    * Calculate sha256 of a str in hex
    * returns sha256 string
    */
    return (0, crypto_1.createHash)('sha256').update(str.toString()).digest('hex');
}
exports.sha256 = sha256;
function chunkObjectToArray(obj) {
    var _a;
    var newObject = [];
    for (var field in obj) {
        var temp = (_a = {}, _a[field] = obj[field], _a);
        newObject.push(temp);
    }
    return newObject;
}
exports.chunkObjectToArray = chunkObjectToArray;
function hashPassword(password, saltRounds) {
    if (saltRounds === void 0) { saltRounds = 8; }
    return (0, bcrypt_1.hash)(password, saltRounds);
}
exports.hashPassword = hashPassword;
function compareHash(str, hash) {
    return (0, bcrypt_1.compare)(str, hash);
}
exports.compareHash = compareHash;
function verifyHmacSignature(data, secret, signature, algorithm) {
    if (algorithm === void 0) { algorithm = 'sha1'; }
    return createHmacSignature(data, secret, algorithm) === signature;
}
exports.verifyHmacSignature = verifyHmacSignature;
function createHmacSignature(data, secret, algorithm) {
    if (algorithm === void 0) { algorithm = 'sha1'; }
    var qs = JSON.stringify(data);
    return (0, crypto_1.createHmac)(algorithm, secret).update(qs).digest('hex');
}
exports.createHmacSignature = createHmacSignature;
function AEScipherEncrypt(text, secret) {
    return AES.encrypt(text, secret).toString();
}
exports.AEScipherEncrypt = AEScipherEncrypt;
function AEScipherDecrypt(cipherText, secret) {
    return AES.decrypt(cipherText, secret).toString(UTF8);
}
exports.AEScipherDecrypt = AEScipherDecrypt;
function generateBase32SecretTwoFactorString() {
    var dictionary = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
        'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
        'U', 'V', 'W', 'X', 'Y', 'Z', '2', '3', '4', '5',
        '6', '7'
    ]; // only base32 characters
    return new short_unique_id_1.default({ dictionary: dictionary, length: 16 })();
}
exports.generateBase32SecretTwoFactorString = generateBase32SecretTwoFactorString;
/**
 * Serialize data
 * @param data - An Array or Object
 * @returns
 */
function serializeData(data) {
    // Check if the data is an array
    if (Array.isArray(data)) {
        // Serialize each item in the array
        return data.map(function (item) { return serializeData(item); });
    }
    // Check if the data is an object
    if (typeof data === 'object' && data !== null) {
        var serializedData = {};
        // Iterate over each key-value pair
        for (var key in data) {
            // Check if the key is "_id"
            if (key === '_id') {
                // Serialize "_id"
                serializedData._id = data[key].toString();
            }
            else if (data[key] instanceof Date) {
                // Serialize Date objects to ISO strings
                serializedData[key] = data[key].toISOString();
            }
            else {
                // Serialize other fields recursively
                serializedData[key] = serializeData(data[key]);
            }
        }
        return serializedData;
    }
    // Return the data as is for other types
    return data;
}
exports.serializeData = serializeData;
