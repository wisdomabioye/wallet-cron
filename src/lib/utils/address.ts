import { ethers } from 'ethers';

const WALLET_SECRET = process.env.WALLET_SECRET as any;

export const encryptEvmWallet = (wallet: any) => {
  return wallet.encrypt(WALLET_SECRET, {
    /* 
    * The scrypt parameters to use when encrypting the private key.
    * The default values are 131072
    * @param N: The CPU/memory cost parameter, must be a power of 2.
    * NOTE: The option below should be used for testing only.
    * The defualt value of N is 131072, which consumes excessive memory and CPU thus,
    * the need to reduce it for testing purposes.
    */
    scrypt: {
      // The number must be a power of 2 (default: 131072)
      // The defaut value consumes excessive memory and CPU thus, the need to reduce it for testing purposes.
      N: 2
    }
  });
}


export const decryptEvmWallet = (json: any) => {
  return ethers.Wallet.fromEncryptedJson(json, WALLET_SECRET);
}

export const getChecksumEvmAddress = (address: string) => {
  return ethers.utils.getAddress(address);
}

export const createEvmAddress = () => {
  return ethers.Wallet.createRandom();
}


export const isValidEvmAddress = (address: string) => {
  return ethers.utils.isAddress(address);
}
