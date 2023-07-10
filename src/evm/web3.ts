import { ethers } from 'ethers';
import ERC20ABI from '../abi/erc20';

import type { BlockchainType, CurrencyType } from '../lib/types/model.types';

/* 
* State changing provider
*/
export function providerWithSigner(blockchain: BlockchainType) {
    const { distributionAddressKey, rpcUrl, chainId, name } = blockchain;
    const provider = new ethers.JsonRpcProvider(rpcUrl, {
        name,
        chainId: Number(chainId),
    });
    
    return new ethers.Wallet(distributionAddressKey, provider);
}

/* 
* Read only provider
*/
export function providerWithoutSigner(blockchain: BlockchainType) {
    const { rpcUrl, chainId, name } = blockchain;
    return new ethers.JsonRpcProvider(rpcUrl, {
        name,
        chainId: Number(chainId),
    });
}


/* 
* State changing provider
*/
export async function contractWithSigner(currency: CurrencyType & {contractAddress: string}, blockchain: BlockchainType) {
    const { contractAddress } = currency;
    const { distributionAddressKey, rpcUrl, chainId, name } = blockchain;

    const provider = new ethers.JsonRpcProvider(rpcUrl, {
        name,
        chainId: Number(chainId),
    });

    const wallet = new ethers.Wallet(distributionAddressKey, provider);
    return new ethers.Contract(contractAddress, ERC20ABI, wallet);
}

/* 
* Read only provider
*/
export function contractWithoutSigner(currency: CurrencyType & {contractAddress: string}, blockchain: BlockchainType) {
    const { contractAddress } = currency;
    const { rpcUrl, chainId, name } = blockchain;

    const provider = new ethers.JsonRpcProvider(rpcUrl, {
        name,
        chainId: Number(chainId),
    });

    return new ethers.Contract(contractAddress, ERC20ABI, provider);
}

export function toWei(amount: number | string, decimal: number) {
    return ethers.parseUnits(amount.toString(), decimal);
}

export function fromWei(amount: string, decimal: number) {
    return ethers.formatUnits(amount, decimal);
}