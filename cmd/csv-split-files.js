const { Writable } = require('stream'),
    fs = require("fs"),
    path = require("path");

class CSV2Files extends Writable {
    constructor(options) {
        super(options);

        this.symbol = options && options.symbol;
        this.columns = null;

        this._rootPath = './data';
        this._currentOutStream = null;
        this._lastDay = null;
    }

    _write(chunk, encoding, next) {
        let line = chunk.toString().trim();

        if (!this.columns) {
            this.columns = line;
        } else {
            let date = new Date(parseInt(line.split(',')[0]));
            if (!this._lastDay) {
                this._lastDay = date.getUTCDate();
                this._currentOutStream = this._outStreamCreate(date);
            }

            if (this._lastDay != date.getUTCDate()) {
                this._changeFileStream(date);
            }
            this._currentOutStream.write(chunk);
        }

        next();
    }

    _final(next) {
        this._currentOutStream.end();
        next();
    }

    _generateFilePath(date) {
        let mm = date.getUTCMonth() + 1; // getMonth() is zero-based
        let dd = date.getUTCDate();

        date = [date.getUTCFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
        ].join('');

        return [this._rootPath, this.symbol, `${this.symbol}-${date}.csv`].join(path.sep);
    };

    _outStreamCreate(date) {
        let filePath = this._generateFilePath(date);
        let outStream = fs.createWriteStream(filePath);
        outStream.write(this.columns + '\n');
        return outStream;
    };

    _changeFileStream(date) {
        this._currentOutStream.end();
        this._currentOutStream = this._outStreamCreate(date);
    };
}

module.exports = CSV2Files;