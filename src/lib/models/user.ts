/*
* User data
*/
import { Schema, Document, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import { quoteCurrency } from '../type';
import type { UserType } from '../types/model.types';

const { Users } = appCollections;

const userSchema = new Schema<UserType>({
	migrated: {
		type: Boolean,
		default: false,
	}, // if user has migrated from v1 to v2
	email: {
		type: String, 
		minlength: 5, 
		maxlength: 60, 
		lowercase: true, 
		required: true, 
		trim: true, 
		unique: true, 
		index: true
	},
	name: String,
	image: String,
	emailVerified: Boolean,
	quoteCurrency: {
		type: String, 
		required: true, 
		default: 'usd', 
		enum: quoteCurrency
	},
	roles: {type: [String], default: ['member']},
	transactionNotification: {
		type: Number, 
		default: 1, 
		min: 0, 
		max: 1
	},
	flagged: {
		type: Boolean,
		default: false
	},
	createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Users});

/* userSchema.post('find', function(docs: any[]) {
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
* export default mongoose.model('wallet_user', userSchema); will not work for nextjs 12.1.6
*/
export default (models[Users] as Model<UserType>) || model(Users, userSchema);