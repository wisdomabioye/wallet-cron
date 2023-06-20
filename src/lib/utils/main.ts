import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt';
import { createHash, createHmac } from 'crypto';
import * as AES from 'crypto-js/aes';
import * as UTF8 from 'crypto-js/enc-utf8';
import ShortUniqueId from 'short-unique-id';

export function md5(str: string) {
	/*
	* Calculate md5 of a str in hex
	* returns md5 string
	*/
	return createHash('md5').update(str.toString()).digest('hex');
}

export function sha256(str: string) {
	/*
	* Calculate sha256 of a str in hex
	* returns sha256 string
	*/
	return createHash('sha256').update(str.toString()).digest('hex');
}

export function chunkObjectToArray(obj: any) {
	let newObject = [];

	for (let field in obj) {
		let temp = {[field]: obj[field]}
		newObject.push(temp);
	}

	return newObject;
}

export function hashPassword(password: string, saltRounds = 8) {
	return bcryptHash(password, saltRounds);
}

export function compareHash(str: string, hash: string): Promise<boolean> {
	return bcryptCompare(str, hash);
}

export function verifyHmacSignature(data: any, secret: string, signature: string, algorithm = 'sha1') {
	return createHmacSignature(data, secret, algorithm) === signature;
}

export function createHmacSignature(data: any, secret: string, algorithm = 'sha1') {
    const qs = JSON.stringify(data);
	return createHmac(algorithm, secret).update(qs).digest('hex');
}

export function AEScipherEncrypt(text: string, secret: string) {
    return AES.encrypt(text, secret).toString();
}

export function AEScipherDecrypt(cipherText: string, secret: string) {
    return AES.decrypt(cipherText, secret).toString(UTF8);
}

export function generateBase32SecretTwoFactorString() {
	const dictionary = [
		'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
		'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
		'U', 'V', 'W', 'X', 'Y', 'Z', '2', '3', '4', '5',
		'6', '7'
	]; // only base32 characters
    return new ShortUniqueId({dictionary, length: 16})();
}