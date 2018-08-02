const request = require('request'),
    GF2CSV = require('./google-finance-csv-transform'),
    CSV2Files = require('./csv-split-files');

// http://www.google.com/finance/getprices?q=PNB&x=NSE&i=60&p=1d&f=d,o,h,l,c,v&df=cpct&auto=1&ts=1266701290218

// q = stock symbol on Google finance
// x = exchange symbol
// i = interval (here 60 means 60 sec (1 minute interval))
// p = no of period(here 5d denotes 5 days of data)
// f = parameters (day, close, open, high and low)
// df= difference (cpct is may be in % change )
// auto=1,
// ts= time start… if you cut the last 4 digits…the rest gives the start day in seconds


class GoogleFinance {
    static getData(option) {
        if (!option || !option.symbol) {
            throw Error('Can\'t get NSE data without symbol.');
        }
        let query = {
            q: option.symbol,
            x: option.exchange || 'NSE',
            i: option.interval || 60,
            p: option.period || '1d',
            f: option.parameters || 'd,o,h,l,c,v',
        }

        if (option.timeStart) {
            query.ts = option.timeStart;
        }

        return request({
            url: 'http://www.google.com/finance/getprices',
            qs: query
        });
    }
}


module.exports = GoogleFinance;

const fs = require("fs");
    // myFile = fs.createWriteStream("pnb.csv");

// GF2CSV.on('data', (chunk) => { console.log('<chunk>' + chunk.toString().trim() + '</chunk>') });

GoogleFinance.getData({
    symbol: 'PNB',
    period: '3d',
    interval: 600
}).pipe(GF2CSV).pipe(new CSV2Files({symbol:'PNB'}));