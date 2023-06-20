/*
* currency model
* Model to define the currency for each blockchain and chainIds
* For example:
* We can have ETH for chainId 1 and chainId 56 (bsc)
* Each supported chainId(blockchain) for a specific coin 
* will have their db record and maintain
* the same name, id, symbol, symbol
*/
import mongoose from 'mongoose';
import { appCollections } from '../app.config';
import type { CurrencyType } from '../types/model.types';

const Schema = mongoose.Schema;
const { Currencies, Blockchains } = appCollections;

const currencySchema = new Schema<CurrencyType>({
    name: {type: String, required: true},
    id: {type: String, required: true}, // our internal id used to map balances
    symbol: {type: String, required: true},
    decimal: {type: Number, required: true},
    contractAddress: {type: String}, // contract address for the currency if it's a token

    withdrawalFee: {type: Number, required: true, default: 0, min: 0},
    minWithdrawalAmount: {type: Number, required: true, default: 0, min: 0},
    minDepositAmount: {type: Number, default: 0, min: 0},
    withdrawalEnabled: {type: Boolean, default: true},
    withdrawalInstruction: {type: [String], required: true},
    depositFee: {type: Number, default: 0, min: 0},
    depositEnabled: {type: Boolean, default: true},
    depositInstruction: {type: [String], required: true},
   
    blockchain: {type: String, ref: Blockchains, required: true, index: true, get: (v: mongoose.Types.ObjectId) => v.toString()},
    lastBlockScanned: {type: String, default: '0'},
    totalDeposited: {type: Number, default: 0},
    totalWithdrawn: {type: Number, default: 0},
    createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Currencies});

/* currencySchema.post('find', function(docs: any[]) {
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
* This is a hack to prevent nextjs from recompiling the model on re-render
* export default mongoose.model('wallet_currency', currencySchema); will not work for nextjs 12.1.6
*/
const model = mongoose.models[Currencies] as mongoose.Model<CurrencyType> || mongoose.model(Currencies, currencySchema);
export default model;