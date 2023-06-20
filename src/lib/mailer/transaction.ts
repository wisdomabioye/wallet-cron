import sendEmail from './main';
import withdrawalCompleted from '../mail_templates/withdrawal.completed';
import depositCompleted from '../mail_templates/deposit.completed';
import { RequestError } from '../error';
import type { TransactionMailData } from '../types/model.types';
import type { MailData } from '../types/email_template.types';

export async function sendTransactionNotificationEmail(
        email: string, 
        transaction:TransactionMailData
    ) {
	
	let mailData: MailData;
	
	switch (transaction.type) {
		case 'withdrawal':
			mailData = withdrawalCompleted(transaction);
			break;
		case 'deposit':
			mailData = depositCompleted(transaction);
			break;
		default:
			throw new RequestError('Invalid transaction event', 400);
	}
    // send email
	return sendEmail({...mailData, to: email});
}
