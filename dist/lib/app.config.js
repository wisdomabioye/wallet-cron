"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coinList = exports.appCollections = exports.appConfig = exports.appInfo = void 0;
exports.appInfo = {
    name: 'Agrichainx Wallet',
    website: 'https://node.agrichainxwallet.com',
    parentWebsite: 'https://agrichainxwallet.com',
    explorer: 'https://explorer.agrichainxwallet.com',
    phone1: 'Whatsapp: +2348051914161',
    phone2: 'Call: +2348068470803, +2348182000600, +2348051914488',
    support: 'contact@agrichainxwallet.com',
    author: 'Wisdom Abioye'
};
exports.appConfig = {
    version: '1.0.0',
    emailOtpValidity: 300000, // 5 mins in milliseconds
};
exports.appCollections = {
    /*
    * Declare database collections name
    * This should not be changed after deployment
    */
    Users: 'wallet_users',
    Accounts: 'wallet_accounts',
    Sessions: 'wallet_sessions',
    VerificationTokens: 'wallet_verification_tokens',
    Addresses: 'wallet_addresses',
    Authentications: 'wallet_authentications',
    Balances: 'wallet_balances',
    Blockchains: 'wallet_blockchains',
    Currencies: 'wallet_currencies',
    MarketData: 'wallet_market_data',
    Transactions: 'wallet_transactions',
    TwoFactorAuthentications: 'wallet_two_factor_authentications',
};
var defaultPrice = {
    usd: 0,
    gbp: 0,
    eur: 0,
    zar: 0,
    ngn: 0,
};
exports.coinList = [
    {
        name: 'Agrichainx',
        symbol: 'AGX',
        id: 'agrichainx',
        cmcId: '13431',
        price: defaultPrice,
    },
    {
        name: 'Binance coin',
        symbol: 'BNB',
        id: 'binancecoin',
        cmcId: '1839',
        price: defaultPrice,
    },
    {
        name: 'Ethereum',
        symbol: 'ETH',
        id: 'ethereum',
        cmcId: '1027',
        price: defaultPrice,
    },
    {
        name: 'Bitcoin',
        symbol: 'BTC',
        id: 'bitcoin',
        cmcId: '1',
        price: defaultPrice,
    }
];
