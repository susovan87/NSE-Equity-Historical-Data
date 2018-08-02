const request = require('request'),
    through2 = require('through2'),
    csv = require("fast-csv"),
    fs = require("fs"),
    path = require('path'),
    os = require("os"),
    NSEHistorical = require('./nse-historical'),
    startedAt = Date.now();


const symbolStream = fs.createReadStream('./meta/NIFTY_500_list.csv');
// const logStream = fs.createWriteStream(`Log_${new Date().toISOString().replace(/T/, '_').replace(/\..+/, '')}.log`);

let counter = 0;
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

csv
    .fromStream(symbolStream, { objectMode: true, ignoreEmpty: true, headers: true }) // ["symbol", , , ,]
    .on("data", dumpData);


// dumpData({ symbol: 'TCS' });