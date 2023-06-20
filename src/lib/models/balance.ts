/*
* balance model
*/
import mongoose from 'mongoose';
import { appCollections } from '../app.config';
import type { BalanceType } from '../types/model.types';

const Schema = mongoose.Schema;
const { Balances, Currencies, Users } = appCollections;

const balanceSchema = new Schema<BalanceType>({
    available: {type: Number, required: true, default: 0},
    pending: {type: Number, required: true, default: 0},
    owner: {type: String, ref: Users, required: true, index: true, get: (v: mongoose.Types.ObjectId) => v.toString()},
    currency: {type: [String], ref: Currencies, required: true, index: true, get: (v: mongoose.Types.ObjectId[]) => v.map(v => v.toString())},
    isWithhold: {type: Boolean, default: false},
    createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Balances});

/* balanceSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_balance', balanceSchema); will not work for nextjs 12.1.6
*/
const model = mongoose.models[Balances] as mongoose.Model<BalanceType> ||  mongoose.model(Balances, balanceSchema);
export default model;