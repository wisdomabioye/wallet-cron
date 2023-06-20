import mongoose from 'mongoose';

/* 
* Some schemas are not directly used in this cron.
* However, they are referenced in other schemas.
* These schemas must be registered manually by importing them
*/

import UserModel from './lib/models/user'; // just import to register, not used in this file

import {
    processAgrichainxOnchainDeposit,
    finaliseAgrichainxOnchainDeposit
} from './agrichainx/deposit.evm';

import {
    finaliseAgrichainxInternalDeposit
} from './agrichainx/deposit.internal';



mongoose.connect(process.env.DB_HOST as string).then(() => console.log('db connected')).catch(error => console.log('db connect error', error));

function handleAgxInternalDeposit() {
    try {
        finaliseAgrichainxInternalDeposit();
    } catch (error) {
        console.log('handleAgxInternalDeposit: ', error);
    } finally {
        setTimeout(handleAgxInternalDeposit, 15000)
    }
}

function handleAgxOnChainDeposit() {
    try {
        processAgrichainxOnchainDeposit();
        finaliseAgrichainxOnchainDeposit();
    } catch (error) {
        console.log('handleAgxOnChainDeposit: ', error);
    } finally {
        setTimeout(handleAgxOnChainDeposit, 15000);
    }
}

async function entry() {
    try {
        // await mongooseConnectPromise;
        handleAgxInternalDeposit();
    } catch (err) {
        
    } finally {

    }
}

entry();

/* process.on('beforeExit', async function() {
    await mongoose.connection.close();
    console.log('connection closed')
}) */