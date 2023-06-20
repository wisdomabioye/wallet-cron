declare class Error {
	constructor(message?: string);
	name: string;
	message: string;
	stack?: string;
	code?: number;
}

export class CaptchaError extends Error {
	constructor(message: string, code?: number) {
		super(message);
		this.name = 'CaptchaError';
		this.code = code;
	}
}

export class RequestError extends Error {
	constructor(message: string, code?: number) {
		super(message);
		this.name = 'RequestError';
		this.code = code;
	}
}

