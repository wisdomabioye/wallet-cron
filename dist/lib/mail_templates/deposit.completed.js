"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_config_1 = require("../app.config");
function html(transaction, theme) {
    var brandColor = (theme === null || theme === void 0 ? void 0 : theme.brandColor) || "#346df1";
    var color = {
        background: "#f9f9f9",
        text: "#444",
        mainBackground: "#fff",
        buttonBackground: brandColor,
        buttonBorder: brandColor,
        buttonText: (theme === null || theme === void 0 ? void 0 : theme.buttonText) || "#fff",
    };
    var commonStyle = "padding: 10px 0px; font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: ".concat(color.text, ";");
    return "\n    <body style=\"background: ".concat(color.background, ";\">\n      <table width=\"100%\" border=\"0\" cellspacing=\"20\" cellpadding=\"0\"\n        style=\"background: ").concat(color.mainBackground, "; max-width: 600px; margin: auto; border-radius: 10px;\">\n        <tr>\n          <td align=\"center\"\n            style=\"padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ").concat(color.text, ";\">\n            Deposit completed on <strong>").concat(app_config_1.appInfo.name, "</strong>\n          </td>\n        </tr>\n        <tr>\n            <td align=\"center\"\n            style=").concat(commonStyle, ">\n            You have received a deposit. Please find the details below</td>\n        </tr>\n        <tr>\n            <td align=\"center\"\n            style=").concat(commonStyle, ">\n                Asset: ").concat(transaction.name, " ").concat(transaction.symbol, "</td>\n        </tr>\n        <tr>\n            <td align=\"center\"\n            style=").concat(commonStyle, ">\n                Amount: ").concat(transaction.amount, " ").concat(transaction.symbol, "</td>\n        </tr>\n        <tr>\n            <td align=\"center\"\n            style=").concat(commonStyle, ">\n                From: ").concat(transaction.from, "</td>\n        </tr>\n        <tr>\n            <td align=\"center\"\n            style=").concat(commonStyle, ">\n                To: ").concat(transaction.to, "</td>\n        </tr>\n      </table>\n    </body>\n    ");
}
function text(transaction) {
    return "\n    Deposit completed on ".concat(app_config_1.appInfo.name, "\n\n    You have received a deposit. Please find the details below\n\n\n    Name: ").concat(transaction.name, " ").concat(transaction.symbol, "\n\n    Amount: ").concat(transaction.amount, " ").concat(transaction.symbol, "\n\n    From: ").concat(transaction.from, "\n\n    To: ").concat(transaction.to, "\n\n    You need to contact us immediately if you did not make initiate this request.\n   ");
}
function subject() {
    return "Deposit completed on ".concat(app_config_1.appInfo.name);
}
function withdrawalEmailOtp(transaction, theme) {
    return {
        subject: subject(),
        html: html(transaction, theme),
        text: text(transaction),
    };
}
exports.default = withdrawalEmailOtp;
