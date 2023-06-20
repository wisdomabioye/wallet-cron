/*
* marketdata model
*/
import mongoose from 'mongoose';
import { appCollections } from '../app.config';
import type { MarketType } from '../types/model.types';

const Schema = mongoose.Schema;
const { MarketData } = appCollections;

const priceSchema = new Schema({
    usd: {type: Number, default: 0},
    gbp: {type: Number, default: 0},
    eur: {type: Number, default: 0},
    zar: {type: Number, default: 0},
    ngn: {type: Number, default: 0},
}, { _id: false });

const marketDataSchema = new Schema<MarketType>({
    name: {type: String, required: true},
    symbol: {type: String, required: true},
    id: {type: String, required: true}, // our internal id for the market
    price: priceSchema,
    oneHourChangePercent: String,
    oneDayChangePercent: String,
    sevenDaysChangePercent: String,
    createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: MarketData});

/* marketDataSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_market_data', marketDataSchema); will not work for nextjs 12.1.6
*/
const model = mongoose.models[MarketData] as mongoose.Model<MarketType> || mongoose.model(MarketData, marketDataSchema);
export default model;