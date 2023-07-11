/*
* Wallet address model
*/
import { Schema, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import type { AddressType } from '../types/model.types';

const { Addresses, Users, Blockchains } = appCollections;

const addressSchema = new Schema({
  address: {type: String, required: true, unique: true, index: true}, // we should not convert to lowercase because address may become invalid on some blockchain
  key: {type: String, require: true}, // private key encrypted with a secret key in .env file
  active: {type: Boolean, default: true}, // whether the address is can be used or not
  owner: {type: Types.ObjectId, ref: Users, required: true, index: true},
  blockchain: {type: Types.ObjectId, ref: Blockchains, required: true, index: true},
  createdAt: {type: String, get: (v: Date) => v?.toString()},
  updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Addresses});

addressSchema.post('find', function(docs: any[]) {
  // normalise the date and object id
	docs.forEach(function(doc) {
		Object.entries(doc).forEach(([key, value]) => {
			let stringify = value instanceof Types.ObjectId || value instanceof Date;
			doc[key] = stringify ? (value as any).toString() : value;
		})
    delete doc.__v; 
  });
})

/* 
* This is a hack to prevent nextjs from recompiling the modeal on re-render
* export default mongoose.model('wallet_address', addressSchema); will not work for nextjs 12.1.6
*/
export default (models[Addresses] as Model<AddressType>) || model(Addresses, addressSchema);
