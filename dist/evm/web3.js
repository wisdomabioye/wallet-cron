"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromWei = exports.toWei = exports.contractWithoutSigner = exports.contractWithSigner = exports.providerWithoutSigner = exports.providerWithSigner = void 0;
var ethers_1 = require("ethers");
var erc20_1 = require("../abi/erc20");
/*
* State changing provider
*/
function providerWithSigner(blockchain) {
    var distributionAddressKey = blockchain.distributionAddressKey, rpcUrl = blockchain.rpcUrl, chainId = blockchain.chainId;
    var provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl, chainId);
    return new ethers_1.ethers.Wallet(distributionAddressKey, provider);
}
exports.providerWithSigner = providerWithSigner;
/*
* Read only provider
*/
function providerWithoutSigner(blockchain) {
    var rpcUrl = blockchain.rpcUrl, chainId = blockchain.chainId;
    return new ethers_1.ethers.JsonRpcProvider(rpcUrl, chainId);
}
exports.providerWithoutSigner = providerWithoutSigner;
/*
* State changing provider
*/
function contractWithSigner(currency, blockchain) {
    var contractAddress = currency.contractAddress;
    var distributionAddressKey = blockchain.distributionAddressKey, rpcUrl = blockchain.rpcUrl, chainId = blockchain.chainId;
    var provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl, chainId);
    var wallet = new ethers_1.ethers.Wallet(distributionAddressKey, provider);
    return new ethers_1.ethers.Contract(contractAddress, erc20_1.default, wallet);
}
exports.contractWithSigner = contractWithSigner;
/*
* Read only provider
*/
function contractWithoutSigner(currency, blockchain) {
    var contractAddress = currency.contractAddress;
    var rpcUrl = blockchain.rpcUrl, chainId = blockchain.chainId;
    var provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl, chainId);
    return new ethers_1.ethers.Contract(contractAddress, erc20_1.default, provider);
}
exports.contractWithoutSigner = contractWithoutSigner;
function toWei(amount, decimal) {
    return ethers_1.ethers.parseUnits(amount.toString(), decimal);
}
exports.toWei = toWei;
function fromWei(amount, decimal) {
    return ethers_1.ethers.formatUnits(amount, decimal);
}
exports.fromWei = fromWei;
