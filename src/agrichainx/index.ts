// import EvmDepositHandler from '../evm/deposit';
import EvmWithdrawalHandler from '../evm/withdrawal';
import InternalDepositHandler from '../internal/deposit';
// import InternalWithdrawalHandler from '../internal/withdrawal';
import type { MongooseContext } from '../mongooseContext';

const CURRENCY_ID = 'agrichainx'; // this is the id of the currency in the db

export default function AgrichainxHandler(ctx: MongooseContext) {
    return {
        internalDeposit: function () {
            const instance = new InternalDepositHandler(ctx);
            return { 
                finalise: async function (maxTransactions?: number) {
                    try {
                        const pendingTrx = await instance.finaliseInternalDeposit(CURRENCY_ID, maxTransactions);
                        console.log('internalDeposit.finalise:pending', pendingTrx, '\n');
                    } catch (e) {
                        console.log(e);
                    } finally {
                        setTimeout(this.finalise.bind(this, maxTransactions), 15000);
                    }
                }
            }
        },

        evmWithdrawal: function () {
            const instance = new EvmWithdrawalHandler(ctx);
            return {
                start: async function (maxTransactions?: number) {
                    try {
                        
                        const pendingTrx = await instance.processEvmWithdrawal(CURRENCY_ID, maxTransactions);
                        console.log('evmWithdrawal.start:pending', pendingTrx, '\n');
                    } catch (e) {
                        console.log(e);
                    } finally {
                        setTimeout(this.start.bind(this, maxTransactions), 15000);
                    }
                },

                finalise: async function (maxTransactions?: number) {
                    try {
                        const pendingTrx = await instance.confirmAndFinaliseWithdrawal(CURRENCY_ID, maxTransactions);
                        console.log('evmWithdrawal.finalise:pending', pendingTrx, '\n');
                    } catch (e) {
                        console.log(e);
                    } finally {
                        setTimeout(this.finalise.bind(this, maxTransactions), 15000);
                    }
                }
            }
        }
    }
}