const text = `EXCHANGE%3DNSE
MARKET_OPEN_MINUTE=555
MARKET_CLOSE_MINUTE=930
INTERVAL=60
COLUMNS=DATE,CLOSE,HIGH,LOW,OPEN,VOLUME
DATA=
TIMEZONE_OFFSET=330
a1531453560,76,76.25,76,76.25,146655
1,75.8,75.95,75.75,75.95,108985
2,75.95,76,75.8,75.8,86282
3,75.7,75.9,75.65,75.85,144337
4,75.55,75.75,75.5,75.75,147881
5,75.5,75.55,75.5,75.55,93834
6,75.5,75.55,75.35,75.55,118508
7,75.35,75.45,75.2,75.4,95007
8,75.4,75.45,75.3,75.3,89960
9,74.9,75.4,74.9,75.4,240102
10,75,75.1,74.9,74.9,145224
11,75.15,75.2,75,75.1,72153
12,75.1,75.2,75.1,75.2,34303
13,74.9,75.1,74.9,75.05,101276
`

let array = text.split('\n');
const parsenTrimMeta = function (lines) {
    let meta = {}, dataIndex;
    lines.every((line, index) => {
        if (line.charAt(0) === 'a') {
            dataIndex = index;
            return false;
        }

        let data = line.split('=');
        if (data.length == 2) {
            meta[data[0]] = data[1];
        }
        return true;
    });
    lines.splice(0, dataIndex);
    return meta;
}

console.log(parsenTrimMeta(array));
console.log(array);

Math.floor((new Date()-1)/10000000)*10000

var date = new Date();
date.setDate(date.getDate() - 1);
date;

//=((((A2)/60)/60)/24)+DATE(1970,1,1)

// const request = require('request');
// const URL = 'https://www.nseindia.com/products/content/sec_bhavdata_full.csv';

// request({
//     url: URL,
//     timeout: 5000,
//     headers: {
//         "Accept": "application/json, text/plain, */*",
//         "User-Agent": "axios/0.18.0",
//         "Cache-Control": "no-cache",
//         "Connection": "keep-alive"
//     }
// }, function (err, res, body) {
//     if (err) { console.error(err); return; }

//     console.log(body);
// });

