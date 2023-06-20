import { appInfo } from '../app.config';
import type { TransactionMailData } from '../types/model.types';

function html(transaction: TransactionMailData, theme?: any) {

    const brandColor = theme?.brandColor || "#346df1"
    const color = {
        background: "#f9f9f9",
        text: "#444",
        mainBackground: "#fff",
        buttonBackground: brandColor,
        buttonBorder: brandColor,
        buttonText: theme?.buttonText || "#fff",
    }
    const commonStyle = `padding: 10px 0px; font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};`

    return `
    <body style="background: ${color.background};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0"
        style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center"
            style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
            Withdrawal completed on <strong>${appInfo.name}</strong>
          </td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
            Your asset withdrawal is completed. Please find the details below</td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
                Asset: ${transaction.name} ${transaction.symbol}</td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
                Amount: ${transaction.amount} ${transaction.symbol}</td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
                From: ${transaction.from}</td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
                To: ${transaction.to}</td>
        </tr>
      </table>
    </body>
    `
}

function text(transaction: TransactionMailData) {
    return `
    Withdrawal completed on ${appInfo.name}\n
    Your asset withdrawal is completed. Please find the details below\n\n
    Name: ${transaction.name} ${transaction.symbol}\n
    Amount: ${transaction.amount} ${transaction.symbol}\n
    From: ${transaction.from}\n
    To: ${transaction.to}\n
    You need to contact us immediately if you did not make initiate this request.
   `
}

function subject() {
    return `Withdrawal completed on ${appInfo.name}`
}

export default function withdrawalEmailOtp(transaction: TransactionMailData, theme?: any) {
    return {
        subject: subject(),
        html: html(transaction, theme),
        text: text(transaction),
    }
}