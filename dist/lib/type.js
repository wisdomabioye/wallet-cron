"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authEvent = exports.transactionStatus = exports.transactionType = exports.quoteCurrency = exports.blockchainCategory = exports.blockchain = exports.chainIds = exports.ChainId = void 0;
var ChainId;
(function (ChainId) {
    ChainId[ChainId["ETH_MAINNET"] = 1] = "ETH_MAINNET";
    ChainId[ChainId["BSC_MAINNET"] = 56] = "BSC_MAINNET";
    ChainId[ChainId["BSC_TESTNET"] = 97] = "BSC_TESTNET";
})(ChainId || (exports.ChainId = ChainId = {}));
exports.chainIds = Object.values(ChainId).filter(function (v) { return typeof v === 'number'; });
exports.blockchain = [
    'ethereum',
    'binance_smart_chain',
    'polygon',
    'fantom_opera',
    'solana',
    'bitcoin',
    'algorand',
    'tron'
];
exports.blockchainCategory = [
    'evm',
    'solana',
    'bitcoin',
    'algorand',
    'tron'
];
exports.quoteCurrency = [
    'usd',
    'eur',
    'gbp',
    'ngn',
    'zar',
];
exports.transactionType = [
    'deposit',
    'withdrawal',
];
exports.transactionStatus = [
    'pending',
    'failed',
    'successful'
];
exports.authEvent = ['withdrawal', 'twofactorauth'];
