//@ts-check

const { Transform } = require('stream'),
  through2 = require('through2');

// Parse meta feed and trim meta lines from feed
const parsenTrimMeta = function (lines) {
  let meta = {}, dataIndex;
  lines.every((line, index) => {
    if (line.charAt(0) === 'a') {
      dataIndex = index;
      return false;
    }

    let data = line.split('=');
    if (data.length == 2) meta[data[0]] = data[1];
    return true;
  });

  lines.splice(0, dataIndex);
  return meta;
};

let meta, partialLine, timestamp;
const transform = function (chunk, enc, next) {
  const self = this;
  const lines = chunk.toString().split('\n');

  if (!meta) {
    meta = parsenTrimMeta(lines);
    meta.INTERVAL = parseInt(meta.INTERVAL);
    meta.COLUMNs_COUNT = meta.COLUMNS.split(',').length;
    meta.TIMEZONE_OFFSET = parseInt(meta.TIMEZONE_OFFSET) * 60;
    self.push(meta.COLUMNS + '\n');
  }

  // Handle incomplete line
  if (partialLine) {
    lines[0] = partialLine + lines[0];
  }
  partialLine = lines.pop();

  lines.forEach(line => {
    let data = line.split(',');

    if (data[0].charAt(0) === 'a') {
      timestamp = parseInt(data[0].substring(1));
      timestamp = timestamp + meta.TIMEZONE_OFFSET;
      data[0] = timestamp;
    } else {
      data[0] = timestamp + (data[0] * meta.INTERVAL);
    }

    self.push(data.join(',') + '\n');
  });

  next();
};

const flush = function (next) {
  next();
};

const options = { objectMode: true };

const GF2CSV = through2(options, transform, flush);

module.exports = GF2CSV;