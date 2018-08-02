const should = require('should'),
    csv = require("fast-csv"),
    fs = require("fs"),
    path = require('path'),
    os = require("os"),
    assert = require('assert');

// const symbolStream = fs.createReadStream('./meta/NIFTY_500_list.csv');

const testNSEHistoricalDataFeed = function (symbol) {
    if (symbol === '') return;
    describe(symbol + ' suite', function () {
        const outPath = `./data/${symbol}/${symbol}-nse-daily.csv`;

        it('CSV should exists in correct directory', function (done) {
            assert(fs.existsSync(outPath));
            done();
        });

        it('CSV should be correct shape & size', function (done) {
            let lineReader = require('readline').createInterface({
                input: require('fs').createReadStream(outPath),
                crlfDelay: Infinity
            });

            let lineCounter = 0, prevLine = '';
            lineReader.on('line', line => {
                if (lineCounter === 0) {  // check col headings
                    assert.equal(line, 'DATE,PREV_CLOSE,OPEN_PRICE,HIGH_PRICE,LOW_PRICE,LAST_PRICE,CLOSE_PRICE,AVG_PRICE,TTL_TRD_QNTY,NO_OF_TRADES,DELIV_QTY,DELIV_PER')
                }
                assert.equal(line.split(',').length, 12);
                lineCounter++;
                prevLine = line;
            }).on('close', () => {
                assert(lineCounter <= 499);
                const lastTradeDay = prevLine.split(',')[0];
                const currSec = secAll[symbol];
                if (currSec && (lastTradeDay === currSec.split(',')[0])) {   // Last day matching, check all data
                    assert.equal(prevLine, currSec, `${symbol}: data mismatch.`);
                } else {
                    assert.fail(`${symbol}'s last traded day ${lastTradeDay}`);
                }

                done();
            });
        });
    });
}

var data = fs.readFileSync('./meta/NIFTY_500_list.csv', 'utf8');
symbols = data.split(os.EOL).map(line => line.split(',')[0]);
symbols.shift();    // contains col heading

// collect last day's data
const syncRequest = require('sync-request');
const SEC_ALL_URL = 'https://www.nseindia.com/products/content/sec_bhavdata_full.csv';
const res = syncRequest('GET', SEC_ALL_URL);
const secAll = res.getBody('utf8')
    .replace(/"/g, '')
    .replace(/ /g, '')
    .split(os.EOL)
    .reduce(function (acc, cur, i) {
        const arr = cur.split(',');
        const symbol = arr.shift();
        const series = arr.shift();
        if (series === 'EQ') {
            arr.splice(9, 1);
            acc[symbol] = arr.join(',');
        }
        return acc;
    }, {});

// console.dir(secAll['ACC']);

describe('NSE Historical Data Test', function () {
    symbols.forEach(testNSEHistoricalDataFeed);
});

