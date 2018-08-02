#!/usr/bin/env node

const program = require('commander'),
    chalk = require('chalk'),
    NSEHistoricalDailyUpdate = require('./cmd/nse-historical-daily-update'),
    NSEHistorical = require('./cmd/nse-historical');

const { version, description } = require('./package.json');

program
    .version(version)
    .description(description);

program
    .command('nse-daily-update')
    .alias('ndu')
    .description('Update NSE daily feed')
    .action(() => {
        NSEHistoricalDailyUpdate.run();
    });

program
    .command('nse-historical-dump')
    .alias('nhd')
    .description('Dump NSE historical data for last 2 years.')
    .action(() => {
        NSEHistorical.dumpInDir();
    });

program.parse(process.argv);