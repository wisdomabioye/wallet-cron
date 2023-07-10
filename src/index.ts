import mongoose from 'mongoose';
import AgrichainxHandler from './agrichainx';
/* 
* Some schemas are not directly used in this cron.
* However, they are referenced in other schemas.
* These schemas must be registered manually by importing and using them
*/
import UserModel from './lib/models/user'; // just import to register, not used in this file
import TransactionModel from './lib/models/transaction';
import BalanceModel from './lib/models/balance';
import BlockchainModel from './lib/models/blockchain';
import CurrencyModel from './lib/models/currency';
import { updateMarketData } from './api/market';

mongoose.connect(process.env.DB_HOST as string).then(() => console.log('db connected')).catch(error => console.log('db connect error', error));
UserModel.init(); // registering purpose
TransactionModel.init();
BalanceModel.init();
BlockchainModel.init();
CurrencyModel.init();


function marketDataHandler() {
    return {
        start: async function() {
            try {
                console.log('marketDataHandler>start>>>');
                await updateMarketData();
            } catch(e) {
                console.error(e);
            } finally {
                setTimeout(this.start.bind(this), 60000);
            }
        }
    }
}

const agrichainxHandler = AgrichainxHandler(mongoose);
const internalDeposit = agrichainxHandler.internalDeposit();
const evmWithdrawal = agrichainxHandler.evmWithdrawal()

internalDeposit.finalise();
evmWithdrawal.start(5);
evmWithdrawal.finalise();

// CONSTANTLY FETCH AND UPDATE MARKET DATA
const marketData = marketDataHandler();
marketData.start();