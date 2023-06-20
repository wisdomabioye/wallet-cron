import { createTransport } from 'nodemailer';
import { RequestError } from '../error';

export default async function sendEmail(mailProp: {subject: string, to: string, html: string, text: string}) {
	const {subject, to, html, text} = mailProp;

	const options: any = {
		port: process.env.EMAIL_SERVER_PORT as string,
		host: process.env.EMAIL_SERVER_HOST as string,
		auth: {
			user: process.env.EMAIL_SERVER_USER as string,
			pass: process.env.EMAIL_SERVER_PASSWORD as string
		}
	}

	const transporter = createTransport(options);

	const result = await transporter.sendMail({
		from:  process.env.EMAIL_FROM,
	    subject, to, html, text,
	})
	
	const failed = result.rejected.length > 0;
	if (failed) throw new RequestError('Failed to send email', 500);
}