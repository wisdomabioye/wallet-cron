/*
* This holds Wallet transaction
*/
import mongoose from 'mongoose';
import { appCollections } from '../app.config';
import { sha256 } from '../utils/main';
import { transactionType, transactionStatus } from '../type';
import type { TransactionType } from '../types/model.types';

const Schema = mongoose.Schema;
const { Transactions, Users, Currencies, Authentications } = appCollections;

const transactionSchema = new Schema<TransactionType>({
	from: {type: String, required: function() { return (this as any).type === 'deposit'}}, // the address that the transaction is from
	to: {type: String, required: true}, // the address that the transaction is sent to
	amount: {type: String, required: true}, // the amount inlcudes the fee
    exactAmount: {type: String, required: true}, // the amount without the fee
	balanceBefore: {type: String, required: true},
	balanceAfter: {type: String, required: true},
	fee: {type: String, required: true},
	transactionHash: {type: String, index: true}, // onchain transaction hash
	itxHash: {type: String, index: true, default: function() { return sha256((this as any)._id.toString())} }, // internal transaction hash
	status: {type: String, required: true, index: true, default: 'pending', enum: transactionStatus},
	processed: {type: Boolean, default: false},
	type: {type: String, required: true, index: true, enum: transactionType},
    internal: {type: Boolean, default: false},
	flagged: {type: Boolean, default: false},
	comment: String,
	owner: {type: String, ref: Users, required: true, index: true, get: (v: mongoose.Types.ObjectId) => v.toString()},
    currency: {type: String, ref: Currencies, required: true, index: true, get: (v: mongoose.Types.ObjectId) => v.toString()},
	authentication: {type: String, ref: Authentications, default: null, required: function() { return (this as any).type === 'withdrawal'}, get: (v: mongoose.Types.ObjectId) => v.toString()},
	attempts: {type: Number, default: 0},
	createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Transactions});

/* transactionSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_transaction', transactionSchema); will not work for nextjs 12.1.6
*/
const model = mongoose.models[Transactions] as mongoose.Model<TransactionType> ||  mongoose.model(Transactions, transactionSchema);
export default model;