#!/usr/bin/env node
var argv = require('optimist').argv,
    configLoader = require("../../app/common/ConfigProvider"),
    fixtureService = require("../../app/models/services/FixtureService");

// Clear fixtures
if(argv.purge) {
    var config = configLoader.getConfig();
    fixtureService.purgeDatabase(function(err) {
        console.log(err || "data cleared from " + config.db.database);
    })
}

// Load fixtures
var fixtureDir = argv._[0] || 'default';

fixtureService.loadFixtures("../../test/fixtures/" + fixtureDir, function(err) {
    console.log(err || fixtureDir + " fixtures loaded into " + process.env.NODE_ENV + " database");
});