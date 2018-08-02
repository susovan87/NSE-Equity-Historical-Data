const request = require('request'),
    throttledRequest = require('throttled-request')(request),
    through2 = require('through2'),
    os = require("os"),
    csv = require("fast-csv"),
    fs = require("fs");


throttledRequest.configure({
    requests: 2,
    milliseconds: function () {
        var minSeconds = .1, maxSeconds = .2;
        return Math.floor((Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000);  // in milliseconds
    }
});

const URL = 'https://www.nseindia.com/products/dynaContent/common/productsSymbolMapping.jsp';

class NSEHistorical {

    static fetchHtml(option) {
        if (!option || !option.symbol) {
            throw Error('Can\'t get NSE data without symbol.');
        }
        let query = {
            symbol: option.symbol,
            segmentLink: 3,
            symbolCount: 2,
            series: 'EQ',
            dateRange: option.dateRange || '24month',
            fromDate: '',
            toDate: '',
            dataType: 'PRICEVOLUMEDELIVERABLE'
        }
        const headers = {
            Host: 'www.nseindia.com',
            Pragma: 'no-cache',
            Referer: 'https://www.nseindia.com/products/content/equities/equities/eq_security.htm'
        };
        return throttledRequest({
            url: URL,
            qs: query,
            headers: headers
        });
    }

    static html2csv(option) {
        let buffer = '', startIndex = -1, endIndex = -1;

        const transform = function (chunk, enc, next) {

            if (startIndex === -1) {  // match not found yet
                buffer += chunk.toString();
                let matchIndex = buffer.indexOf('csvContentDiv');
                // console.log('matchIndex: ', matchIndex);
                if (matchIndex > -1) {
                    startIndex = buffer.indexOf('>', matchIndex);
                    // console.log('startIndex: ', startIndex);
                    if (startIndex > -1) {
                        endIndex = buffer.indexOf('<', startIndex);
                        if (endIndex > -1) {
                            this.push(buffer.substring(startIndex + 1, endIndex));
                        } else {
                            this.push(buffer.substr(startIndex + 1));
                        }
                    }
                }

                if (startIndex === -1) {
                    // console.log(buffer);
                    buffer = buffer.substr(buffer.length - 100);
                }
            } else if (endIndex === -1) {   // target stream started, but end not reached
                buffer = chunk.toString();
                endIndex = buffer.indexOf('<');
                if (endIndex > -1) {
                    this.push(buffer.substring(0, endIndex));
                } else {
                    this.push(buffer);
                }
            } else {
                this.push(null);
            }

            next();
        };

        return through2({ objectMode: true }, transform);
    }

    static cleanCSV(option) {
        const COLS = ['SYMBOL', 'SERIES', 'DATE', 'PREV_CLOSE', 'OPEN_PRICE', 'HIGH_PRICE', 'LOW_PRICE', 'LAST_PRICE',
            'CLOSE_PRICE', 'AVG_PRICE', 'TTL_TRD_QNTY', 'TURNOVER_LACS', 'NO_OF_TRADES', 'DELIV_QTY', 'DELIV_PER'];
        let buffer = '', firstReceived = false;
        const filterColumn = function (line) {
            let data = line.split(',');
            if (data.length > 1) {
                data.splice(0, 2);
                data.splice(9, 1);
                return data.join(',') + os.EOL;
            } else {
                return '';
            }
        };
        const transform = function (chunk, enc, next) {
            buffer += String(chunk)
                .replace(/"/g, '')
                .replace(/ /g, '');

            let lines = buffer.split(':');
            buffer = lines.pop();
            if (lines.length > 0) {
                if (!firstReceived) {
                    lines[0] = COLS.join(',');
                    firstReceived = true;
                }
                lines.forEach(line => { this.push(filterColumn(line)); });
            }
            next();
        };
        const flush = function (next) {
            this.push(filterColumn(buffer));
            next();
        }
        return through2({ objectMode: true }, transform, flush);
    }

    static getData(option) {
        const handleError = function (e) {
            e.symbol = option.symbol;
            console.error(`ERROR: ${e.symbol} (${e.code})`);
            // this.emit('end');
        };

        return this.fetchHtml(option).on('error', handleError)
            .pipe(this.html2csv()).on('error', handleError)
            .pipe(this.cleanCSV()).on('error', handleError);
    }

    static dumpInDir(dir) {
        let counter = 0;
        const startedAt = Date.now();
        const dumpData = function ({ symbol }) {
            const outDir = `./data/${symbol}`;
            const outPath = `${outDir}/${symbol}-nse-daily.csv`;
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir);
            }
            const outStream = fs.createWriteStream(outPath);
            outStream.on('finish', () => {
                console.log(`${symbol}: success (${++counter}) - ${(Date.now() - startedAt) / 1000}s`);
                // logStream.write(symbol + ': success' + os.EOL);
            });
            NSEHistorical.getData({ symbol: symbol }).pipe(outStream);
        };

        const symbolStream = fs.createReadStream('./meta/NIFTY_500_list.csv');
        csv
            .fromStream(symbolStream, { objectMode: true, ignoreEmpty: true, headers: true })
            .on("data", dumpData);
    }

}

module.exports = NSEHistorical;

// NSEHistorical.fetchHtml({ symbol: 'PNB' }).pipe(NSEHistorical.html2csv()).pipe(process.stdout);