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

/**
 * Serialize data
 * @param data - An Array or Object
 * @returns 
 */
export function serializeData(data: any[] | {[key: string]: any}): any[] | {[key: string]: any} {
	// Check if the data is an array
	if (Array.isArray(data)) {
	  // Serialize each item in the array
	  return data.map((item) => serializeData(item));
	}
  
	// Check if the data is an object
	if (typeof data === 'object' && data !== null) {
	  const serializedData: {[key: string]: any} = {};
  
	  // Iterate over each key-value pair
	  for (const key in data) {
		// Check if the key is "_id"
		if (key === '_id') {
		  // Serialize "_id"
		  serializedData._id = data[key].toString();
		} else if (data[key] instanceof Date) {
		  // Serialize Date objects to ISO strings
		  serializedData[key] = data[key].toISOString();
		} else {
		  // Serialize other fields recursively
		  serializedData[key] = serializeData(data[key]);
		}
	  }
  
	  return serializedData;
	}
  
	// Return the data as is for other types
	return data;
}