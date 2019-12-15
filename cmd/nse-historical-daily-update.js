const request = require('request'),
    through2 = require('through2'),
    os = require("os"),
    Symbols = require('./symbols'),
    fs = require('fs');

const URL = 'https://www.nseindia.com/products/content/sec_bhavdata_full.csv';
let _lastrun = '';
class NSEHistoricalDailyUpdate {
    static get lastrun() {
        if (!_lastrun) {
            _lastrun = fs.readFileSync('.lastrun', 'utf8');
        }
        return _lastrun;
    }

    static set lastrun(val) {
        if (_lastrun != val) {
            fs.writeFileSync('.lastrun', val);
            _lastrun = val;
        }
    }

    static getRequestStream(option) {
        return request({
            url: URL, 
            timeout: 5000,
            headers: {
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "axios/0.18.0",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    }

    static appendFeed(symbol, feed) {
        const outPath = `./data/${symbol}/${symbol}-nse-daily.csv`;
        return new Promise((resolve, reject) => {
            fs.appendFile(outPath, feed, (err) => {
                if (err) reject(err);

                console.log(`${symbol}: updated`);
                resolve();
            });
        });

    }

    static run() {
        Symbols.getCodes().then(symbols => {
            console.log(symbols);
            let inCount = 0, outCount = 0, endFlag, noUpdate = false;
            NSEHistoricalDailyUpdate.getRequestStream()
                .pipe(NSEHistoricalDailyUpdate.wrangle(symbols))
                .on('data', function (data) {
                    let arr = data.split(',');
                    if (arr.length === 13) {
                        let symbol = arr.shift();
                        let date = arr[0];
                        if (date == NSEHistoricalDailyUpdate.lastrun) {
                            noUpdate = true;
                            return;
                        } else {
                            inCount++;
                            NSEHistoricalDailyUpdate.appendFeed(symbol, arr.join(',')).then(() => {
                                outCount++;
                                if (inCount === outCount && endFlag) {
                                    NSEHistoricalDailyUpdate.lastrun = date;
                                    console.log(`Completed! Data updated for ${inCount} symbols`);
                                };
                            });
                        }
                    }
                })
                .on('end', () => {
                    endFlag = true;
                    if (noUpdate) {
                        console.log(`No update available!!! Last updated on ${NSEHistoricalDailyUpdate.lastrun}.`);
                    }
                });
        });
    }

    static wrangle(symbols) {
        if (symbols.constructor != Array || symbols.length == 0) {
            throw Error('Array of symbols is required.');
        }

        let buffer = '';
        const filterNClean = (line) => {
            let data = line.split(',');
            const symbol = data[0];
            const series = data.splice(1, 1)[0];
            if (series === 'EQ' && symbols.indexOf(symbol) > -1) {
                data.splice(10, 1);
                return data.join(',') + os.EOL;
            } else {
                return '';
            }
        };
        const transform = function (chunk, enc, next) {
            buffer += String(chunk)
                .replace(/"/g, '')
                .replace(/ /g, '');

            let lines = buffer.split(os.EOL);
            buffer = lines.pop();
            if (lines.length > 0) {
                lines.forEach(line => this.push(filterNClean(line)));
            }
            next();
        };
        const flush = function (next) {
            this.push(filterNClean(buffer));
            next();
        };
        return through2({ objectMode: true }, transform, flush);
    }
}

module.exports = NSEHistoricalDailyUpdate;
