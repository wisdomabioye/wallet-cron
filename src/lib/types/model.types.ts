import { Types } from 'mongoose';

export type UserType = {
    _id: Types.ObjectId;
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
    _id: Types.ObjectId;
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
    _id: Types.ObjectId;
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
    blockchain: Types.ObjectId | BlockchainType;
    lastBlockScanned: string;
    totalDeposited: number;
    totalWithdrawn: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type TransactionType = {
    _id: Types.ObjectId;
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
    owner: Types.ObjectId | UserType;
    currency: Types.ObjectId | CurrencyType;
    authentication?: Types.ObjectId | null;
    attempts: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type AddressType = {
    _id: Types.ObjectId;
    address: string;
    key: string;
    active: boolean;
    owner: Types.ObjectId | UserType;
    blockchain: Types.ObjectId;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type BalanceType = {
    _id: Types.ObjectId;
    available: number;
    pending: number;
    owner: Types.ObjectId | UserType;
    currency: Array<Types.ObjectId | CurrencyType>;
    isWithhold: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type TwoFactorType = {
    _id: Types.ObjectId;
    owner: Types.ObjectId | UserType;
    enabled: boolean;
    algorithm: string;
    period: number;
    digits: number;
    secret: string;
    authentication: Types.ObjectId;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type MarketType = {
    _id: Types.ObjectId;
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
    _id: Types.ObjectId;
    twoFactorAuth: TwoFactorType | Types.ObjectId;
    twoFactorOtp: string;
    emailOtp: string;
    emailOtpSentAt: Date;
    emailOtpVerifiedAt: Date | null;
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
