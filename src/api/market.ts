import Markets from '../lib/models/market';
import { makeApiRequest } from '../lib/utils/network';
import { coinList } from '../lib/app.config';


export async function fetchCmcMarketData() {
    try {
        const CMC_API_KEY = (process as any).env.CMC_API_KEY;
        const cmcIds = coinList.map(coin => coin.cmcId).join(',');
        const reqOption = {
            url: `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcIds}&convert=usd&skip_invalid=true`,
            method: 'get',
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY
            }
        }

        const cmcMarketData = await makeApiRequest(reqOption);
        return cmcMarketData;
    } catch (e) {
        // do nothing
    }
    
}

export async function updateMarketData() {
    const cmcMarketData = await fetchCmcMarketData();
    
    if (cmcMarketData && cmcMarketData.data) {
        const marketData = [];

        for (let coin of coinList) {
            const coinData = cmcMarketData.data[coin.cmcId];
            const { name, symbol, id } = coin;

            marketData.push({
                name, symbol, id,
                price: {usd: coinData.quote.USD.price},
                oneHourChangePercent: coinData.quote.USD.percent_change_1h,
                oneDayChangePercent: coinData.quote.USD.percent_change_24h,
                sevenDaysChangePercent: coinData.quote.USD.percent_change_7d,
            });
         }

         // create many or update many

         await Markets.bulkWrite(marketData.map(market => {
                return {
                    updateOne: {
                        filter: {id: market.id},
                        update: {$set: market},
                        upsert: true
                    }
                }
         }));
         console.log('updateMarketData >>> done')
    }
}

export async function getMarketData() {
    const ids = coinList.map(coin => coin.id);
    const markets = await Markets.find().where('id').in(ids).lean().exec();
    return coinList.map(coin => {
        const market = markets.find(market => market.id === coin.id);
        return {
            ...coin,
            ...market
        }
    })
}