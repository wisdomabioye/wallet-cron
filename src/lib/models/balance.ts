/*
* balance model
*/
import { Schema, Document, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import type { BalanceType } from '../types/model.types';

const { Balances, Currencies, Users } = appCollections;

const balanceSchema = new Schema({
    available: {type: Number, required: true, default: 0},
    pending: {type: Number, required: true, default: 0},
    owner: {type: Types.ObjectId, ref: Users, required: true, index: true},
    currency: {type: [Types.ObjectId], ref: Currencies, required: true, index: true},
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
export default (models[Balances] as Model<BalanceType>) ||  model(Balances, balanceSchema);