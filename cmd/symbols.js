"use strict";

const request = require('request'),
    csv = require("fast-csv");

const NIFTY_500_SYMBOLS_URL = 'https://www.nseindia.com/content/indices/ind_nifty500list.csv',
    NIFTY_500_SYMBOLS_path = './meta/NIFTY_500_list.csv';

// TODO: Cache not working, need to be fixed
var symbolsCache = {};

class Symbols {

    static getCodes() {
        return new Promise((resolve, reject) => {
            this._getSymbols().then(data => resolve(Object.keys(data))).catch(err => reject(err));
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            this._getSymbols().then(data => resolve(data)).catch(err => reject(err));
        });
    }

    // TODO: fix it
    static refresh() {
        // csv.fromStream(request(NIFTY_500_SYMBOLS_URL))
        //     .on('data', data => {
        //         console.log(data);
        //     })
        //     .on('end', () => {
        //         console.log('End of CSV.')
        //     });
    }

    static _getSymbols() {
        return new Promise((resolve, reject) => {
            if (Object.keys(symbolsCache).length === 0) {
                this._loadFromFile().then(data => resolve(data)).catch(err => reject(err));
            } else {
                resolve(symbolsCache);
            }
        });
    }

    static _loadFromFile() {
        return new Promise((resolve, reject) => {
            csv.fromPath(NIFTY_500_SYMBOLS_path)    // {headers: true}
                .on('data', data => {
                    symbolsCache[data[0]] = {
                        name: data[1],
                        industry: data[2],
                        isinCode: data[3]
                    };
                })
                .on('end', () => {
                    delete symbolsCache.symbol  // removing header row
                    resolve(symbolsCache);
                }).on('error', err => reject(err));
        });
    }
}

module.exports = Symbols;