
export type UserType = {
    _id: string;
    migrated: boolean;
    email: string;
    name: string;
    image: string;
    emailVerified: boolean;
    quoteCurrency: string;
    roles: string[];
    transactionNotification: number;
    flagged: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type BlockchainType = {
    _id: string;
    name: string;
    id: string;
    category: string;
    chainId: string;
    distributionAddress: string;
    distributionAddressKey: string;
    rpcUrl: string;
    disabled: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type CurrencyType = {
    _id: string;
    name: string;
    id: string;
    symbol: string;
    decimal: number;
    contractAddress?: string;
    withdrawalFee: number;
    depositFee: number;
    minWithdrawalAmount: number;
    minDepositAmount: number;
    withdrawalEnabled: boolean;
    depositEnabled: boolean;
    depositInstruction: string[];
    withdrawalInstruction: string[];
    blockchain: string | BlockchainType;
    lastBlockScanned: string;
    totalDeposited: number;
    totalWithdrawn: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type TransactionType = {
    _id: string;
    from: string;
    to: string;
    amount: string;
    exactAmount: string;
    balanceBefore: string;
    balanceAfter: string;
    fee: string;
    transactionHash: string;
    itxHash?: string;
    status: 'pending' | 'failed' | 'successful' | string;
    processed: boolean;
    type: 'deposit' | 'withdrawal' | string;
    internal: boolean;
    flagged: boolean;
    comment?: string;
    owner: string;
    currency: string;
    authentication?: string;
    attempts: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type AddressType = {
    _id: string;
    address: string;
    key: string;
    active: boolean;
    owner: string;
    blockchain: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type BalanceType = {
    _id: string;
    available: number;
    pending: number;
    owner: string;
    currency: Array<string>;
    isWithhold: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type TwoFactorType = {
    _id: string;
    owner: string;
    enabled: boolean;
    algorithm: string;
    period: number;
    digits: number;
    secret: string;
    authentication: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type MarketType = {
    _id: string;
    name: string;
    symbol: string;
    id: string;
    price: {usd: number, gbp: number, eur: number, zar: number, ngn: number};
    oneHourChangePercent: string;
    oneDayChangePercent: string;
    sevenDaysChangePercent: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type AuthenticateType = {
    _id: string;
    twoFactorAuth: string;
    twoFactorOtp: string;
    emailOtp: string;
    emailOtpSentAt: Date;
    emailOtpVerifiedAt: Date;
    emailOtpVerified: boolean;
    authenticationPassed: boolean;
    eventSignature: string;
    event: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}


export type CurrencyWithContractAddress = CurrencyType & {
    contractAddress: string;
    blockchain: BlockchainType;
}

export type TransactionMailData = Pick<TransactionType, 'amount' | 'type' | 'from' | 'to'> & Pick<CurrencyType, 'name' | 'symbol'>
