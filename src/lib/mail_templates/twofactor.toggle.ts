import { appInfo } from '../app.config';

function html(otp: string, eventData: any, theme?: any) {
    const action = eventData.action;

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
            ${action} 2FA on <strong>${appInfo.name}</strong>
          </td>
        </tr>
        <tr>
            <td align="center"
            style=${commonStyle}>
            You have requested to ${action} 2FA authentication, please use the One-time password below to complete the action</td>
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

function text (otp: string, eventData: any) {
  const action = eventData.action === 'enable' ? 'nable' : 'disable';

  return `
  You have requested to ${action} 2FA authentication, please use the One-time password below to complete the action\n\n
  OTP: ${otp}\n\n
  You need to contact us immediately if you did not make this request.
  `
}

function subject(eventData: any) {
    return `${eventData.action} 2FA Auth on ${appInfo.name}`
}

export default function twoFactorAuthEmailOtp(otp: string, eventData: any, theme?: any) {
    return {
        subject: subject(eventData),
        html: html(otp, eventData, theme),
        text: text(otp, eventData),
    }
}