/*
* authenticate model
* For storing authentication details (like for withdrawal and otp enable/disable)) 
*/
import { Schema, Types, models, model, Model } from 'mongoose';
import { appCollections } from '../app.config';
import type { AuthenticateType } from '../types/model.types';
import { authEvent } from '../type';

const { Authentications, TwoFactorAuthentications } = appCollections;

const authenticateSchema = new Schema({
    twoFactorAuth: {type: Types.ObjectId, ref: TwoFactorAuthentications, index: true},
    twoFactorOtp: {type: String, default: ''}, // 2fa otp supplied by user
    emailOtp: {type: String, required: true},
    emailOtpSentAt: {type: Date, required: true},
    emailOtpVerifiedAt: {type: Date, default: null},
    emailOtpVerified: {type: Boolean, default: false},
    authenticationPassed: {type: Boolean, default: false}, // if auth has been passed for email otp and twoFactorAuth if enabled
    /* event signature is created for every action that requires authentication
    *  event signature is computed from event data
    *  authenticate _id are referenced in event record
    */
    eventSignature: {type: String, required: true}, // event signature for which authentication is done
    event: {type: String, enum: authEvent, required: true}, // the purpose of this authentication
    createdAt: {type: String, get: (v: Date) => v?.toString()},
    updatedAt: {type: String, get: (v: Date) => v?.toString()}
}, {timestamps: true, collection: Authentications});

/* 
* This is a hack to prevent nextjs from recompiling the modeal on re-render
* export default mongoose.model('wallet_authenticate', authenticateSchema); will not work for nextjs 12.1.6
*/
export default (models[Authentications] as Model<AuthenticateType>) || model(Authentications, authenticateSchema);
