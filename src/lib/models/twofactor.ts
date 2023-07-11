/*
* two factor authenticate model
* For storing user's withdrawal and otp enable/disable authentication details 
*/
import { Schema, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import type { TwoFactorType } from '../types/model.types';

const { Authentications, TwoFactorAuthentications, Users } = appCollections;

const twoFactorAuthSchema = new Schema({
    owner: {type: Types.ObjectId, ref: Users, required: true, index: true},
    enabled: {type: Boolean, default: false},
    algorithm: {type: String, default: 'sha1'}, // sha256, sha512, sha1
    digits: {type: Number, default: 6}, // otp digits
    period: {type: Number, default: 30}, // otp period
    secret: {type: String, default: ''}, // base32 secret
    authentication: {type: String, ref: Authentications, default: null}, // authentication id used to enable/disable two factor
    createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: TwoFactorAuthentications});

/* 
* This is a hack to prevent nextjs from recompiling the modeal on re-render
* export default mongoose.model('wallet_two_factor_auth', twoFactorAuthSchema); will not work for nextjs 12.1.6
*/
export default (models[TwoFactorAuthentications] as Model<TwoFactorType>) || model(TwoFactorAuthentications, twoFactorAuthSchema);