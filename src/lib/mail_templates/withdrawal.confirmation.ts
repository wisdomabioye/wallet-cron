import { appInfo } from '../app.config';

function html(otp: string, eventData: any, theme?: any) {

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
            Confirm Withdrawal on <strong>${appInfo.name}</strong>
          </td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
            You have requested withdrawal, please see details and One-time password below</td>
        </tr>

        <tr>
            <td align="center"
            style=${commonStyle}>
                Amount: ${eventData?.amount} ${eventData?.currency?.symbol}</td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
                Asset: ${eventData?.currency?.name}</td>
        </tr>

        <tr>
            <td align="center"
            style=${commonStyle}>
                Receiver: ${eventData?.to}</td>
        </tr>

        <tr>
            <td align="center" 
            style=${commonStyle}>
                OTP: ${otp}</td>
        </tr>
        <tr>
          <td align="center"
            style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
            You need to contact us immediately if you did not make this request.
          </td>
        </tr>
      </table>
    </body>
    `
}


function text(otp: string, eventData: any) {
    return `
    Confirm Withdrawal on ${appInfo.name}\n
    You have requested withdrawal, please see details and One-time password below\n\n
    Amount: ${eventData?.amount} ${eventData?.symbol}\n
    Asset: ${eventData?.name}\n
    Receiver: ${eventData?.to}\n
    OTP: ${otp}\n\n
    You need to contact us immediately if you did not make this request.
    `
}

function subject() {
    return `Confirm Withdrawal on ${appInfo.name}`
}

export default function withdrawalEmailOtp(otp: string, eventData: any, theme?: any) {
    return {
        subject: subject(),
        html: html(otp, eventData, theme),
        text: text(otp, eventData),
    }
}