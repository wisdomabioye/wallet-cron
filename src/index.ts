import mongoose from 'mongoose';

/* 
* Some schemas are not directly used in this cron.
* However, they are referenced in other schemas.
* These schemas must be registered manually by importing and using them
*/

import UserModel from './lib/models/user'; // just import to register, not used in this file

import {
    processAgrichainxOnchainDeposit,
    finaliseAgrichainxOnchainDeposit
} from './agrichainx/deposit.evm';

import {
    finaliseAgrichainxInternalDeposit
} from './agrichainx/deposit.internal';

import {
    updateMarketData
} from './api/market';

mongoose.connect(process.env.DB_HOST as string).then(() => console.log('db connected')).catch(error => console.log('db connect error', error));
UserModel.init(); // registering purpose

async function handleAgxInternalDeposit() {
    finaliseAgrichainxInternalDeposit()
    .catch(error => console.log('handleAgxInternalDeposit', error))
    .finally(() => {
        setTimeout(handleAgxInternalDeposit, 15000);
    })
}

async function handleAgxOnChainDepositProcessing() {
    try {
        await processAgrichainxOnchainDeposit();
    } catch (error) {
        console.log('handleAgxOnChainDepositProcessing: ', error);
    } finally {
        setTimeout(handleAgxOnChainDepositProcessing, 30000);
    }
}

async function handleAgxOnChainDeposit() {
    try {
        await finaliseAgrichainxOnchainDeposit();
    } catch (error) {
        console.log('handleAgxOnChainDeposit: ', error);
    } finally {
        setTimeout(handleAgxOnChainDeposit, 30000);
    }
}

async function fetchMarketData() {
    try {
        await updateMarketData();
    } catch (error) {
        console.log('fetchMarketData: ', error);
    } finally {
        setTimeout(fetchMarketData, 60000);
    }
}

async function entry() {
    try {
        await updateMarketData();
        await finaliseAgrichainxInternalDeposit();
    } catch (error) {
        console.log('entry', error);
    } finally {
        // setTimeout(entry, 60000);
    }
}

setInterval(entry, 60000);
// handleAgxInternalDeposit();
// fetchMarketData();