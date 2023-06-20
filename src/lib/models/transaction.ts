/*
* This holds Wallet transaction
*/
import { Schema, Document, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import { sha256 } from '../utils/main';
import { transactionType, transactionStatus } from '../type';
import type { TransactionType } from '../types/model.types';

const { Transactions, Users, Currencies, Authentications } = appCollections;

const transactionSchema = new Schema({
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
	owner: {type: Types.ObjectId, ref: Users, required: true, index: true},
    currency: {type: Types.ObjectId, ref: Currencies, required: true, index: true},
	authentication: {type: Types.ObjectId, ref: Authentications, default: null, required: function() { return (this as any).type === 'withdrawal'}},
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
export default (models[Transactions] as Model<TransactionType>) || model(Transactions, transactionSchema);