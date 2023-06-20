export enum ChainId {
    ETH_MAINNET = 1,
    BSC_MAINNET = 56,
    BSC_TESTNET = 97,
}

export const chainIds = Object.values(ChainId).filter(v => typeof v === 'number') as Number[];

export const blockchain = [
    'ethereum',
    'binance_smart_chain',
    'polygon',
    'fantom_opera',
    'solana',
    'bitcoin',
    'algorand',
    'tron'
] as const;

export const blockchainCategory = [
    'evm', // covers ethereum, fantom and others evm
    'solana',
    'bitcoin',
    'algorand',
    'tron'
] as const;

export const quoteCurrency = [
    'usd',
    'eur',
    'gbp',
    'ngn',
    'zar',
]

export const transactionType = [
    'deposit',
    'withdrawal',
]

export const transactionStatus = [
    'pending', 
    'failed', 
    'successful'
]

export const authEvent = ['withdrawal', 'twofactorauth'] as const;

export type Blockchain = typeof blockchain[number];
export type BlockchainCategory = typeof blockchainCategory[number];
export type AuthEvent = typeof authEvent[number];
export type TransactionType = typeof transactionType[number];
export type TransactionStatus = typeof transactionStatus[number];

export type AvailableCoin = {
    name: string;
    id: string; 
    symbol: string; 
    decimal: number;
}

export type BlockchainInfo = {
    name: string;
    id: Blockchain;
    category: BlockchainCategory;
    chainId?: ChainId;
    rpcUrl?: string;
}

export type CurrencyInfo = {
    _id?: string;
    withdrawalFee: number;
    depositFee?: number;
    minWithdrawalAmount: number;
    withdrawalEnabled: boolean;
    depositEnabled: boolean;
    depositInstruction: string[];
    withdrawalInstruction: string[];
    contractAddress?: string;
    lastBlockScanned: string;
    blockchain: BlockchainInfo;
} & AvailableCoin;

export type CoinPrice = {
    [usd: string]: string;
    gbp: string;
    eur: string;
    zar: string;
    ngn: string;
}

export type Market = {
    name: string;
    symbol: string;
    id: string;
    price: CoinPrice;
    oneHourChangePercent?: string;
    oneDayChangePercent?: string;
    sevenDaysChangePercent?: string;
}

export type DepositAddress = {
    address: string;
    blockchain: BlockchainInfo;
}

export type CoinBalance = {
    available: string;
    pending: string;
    currency: CurrencyInfo;
}

export type CoinBalances = AvailableCoin & {
    available: string;
    pending: string;
    decimal?: number;
}

export type Transaction = {
    to: string;
    from?: string;
    type: 'deposit' | 'withdrawal';
    amount: string;
    exactAmount: string;
    balanceBefore: string;
    balanceAfter: string;
    transactionHash?: string;
    itxHash: string;
    fee: string;
    internal: boolean;
    flagged: boolean;
    comment?: string;
    createdAt: Date | string;
    status: 'pending' | 'failed' | 'successful';
    processed: boolean;
    currency: CurrencyInfo;
}

export type TwoFactorInitiateRepsonse = {
    secret: string; 
    enabled: boolean; 
    digits: number;
    period: number; 
    algorithm: string;
}

export type UserSetting = {
    quoteCurrency: string;
    transactionNotification: 1 | 0;
}

export type CoinChartData = {
    name: string;
    data: Array<number>;
    categories: Array<any>;
}

export type CoinChartDataList = {
    [key in keyof CoinBalance]: CoinChartData;
}

export type QuoteCurrency = {
    name: string,
    symbol: string,
    code: string,
}

export type V1BalanceType = {
    binancecoin: {
        total: number;
        available: number;
    },
    agrichainxagn: {
        total: number;
        available: number;
    }
}