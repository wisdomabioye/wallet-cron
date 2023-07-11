/*
* Blockchain model
*/
import { Schema, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import { blockchain, blockchainCategory  } from '../type';
import type { BlockchainType } from '../types/model.types';

const { Blockchains } = appCollections;

const blockchainSchema = new Schema<BlockchainType>({
    name: {type: String, required: true},
    id: {type: String, required: true, enum: blockchain, index: true, unique: true}, // our internal id for the blockcahin
    category: {type: String, required: true, enum: blockchainCategory}, // used to generate addresses
    chainId: {type: String, required: true},
    rpcUrl: {type: String, required: true},
    // distribution address
    distributionAddress: {type: String, required: true},
    distributionAddressKey: {type: String, required: true}, // private key encrypted with a secret key in env
    disabled: {type: Boolean, default: false},
    createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Blockchains});

blockchainSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_blockchain', blockchainSchema); will not work for nextjs 12.1.6
*/
export default (models[Blockchains] as Model<BlockchainType>) || model(Blockchains, blockchainSchema);