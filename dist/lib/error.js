"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestError = exports.CaptchaError = void 0;
var CaptchaError = /** @class */ (function (_super) {
    __extends(CaptchaError, _super);
    function CaptchaError(message, code) {
        var _this = _super.call(this, message) || this;
        _this.name = 'CaptchaError';
        _this.code = code;
        return _this;
    }
    return CaptchaError;
}(Error));
exports.CaptchaError = CaptchaError;
var RequestError = /** @class */ (function (_super) {
    __extends(RequestError, _super);
    function RequestError(message, code) {
        var _this = _super.call(this, message) || this;
        _this.name = 'RequestError';
        _this.code = code;
        return _this;
    }
    return RequestError;
}(Error));
exports.RequestError = RequestError;
