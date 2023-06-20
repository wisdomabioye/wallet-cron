import sendEmail from './main';
import withdrawalEmailOtp from '../mail_templates/withdrawal.confirmation';
import twoFactorAuthEmailOtp from '../mail_templates/twofactor.toggle';
import { RequestError } from '../error';
import type { AuthEvent } from '../type';

export async function sendAuthEmailOtp(authFor: AuthEvent, otp: string, eventData: any) {
	
	let mailData: {
		subject: string, 
		html: string, 
		text: string
	};
	
	switch (authFor) {
		case 'withdrawal':
			mailData = withdrawalEmailOtp(otp, eventData);
			break;
		case 'twofactorauth':
			mailData = twoFactorAuthEmailOtp(otp, eventData);
			break;
		default:
			throw new RequestError('Invalid authentication event', 400);
	}
    // send email
	return sendEmail({...mailData, to: eventData.email});
}
