var Promise = require("bluebird");
var http = require('http');
var httpShutdown = require('http-shutdown');
var express = require('express');
var compression = require('compression');
//var logger = require('morgan');
var db = require('pmt-data-access');
var backend = require('pmt-backend');
var config = require('./config.js');

var app = express();
//app.use(logger('combined'));
app.use(compression());

var server = http.createServer(app);
server = httpShutdown(server);
server = Promise.promisifyAll(server);

db.connect(config.get('db.url'), config)
    .then(function () {
        backend.addRoutes(server, app, config, db);

        return server.listenAsync(config.get('server.port'));
    })
    .then(function () {
        console.log('Started ProfileManagementTool Server - listening on port: ' + config.get('server.port'));
    });

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
process.on('SIGQUIT', shutdown);

function shutdown() {
    return backend.onShutdown()
        .then(function () {
            return server.shutdownAsync();
        })
        .then(function () {
            return db.close(true);
        })
        .then(function () {
            console.log('Stopped ProfileManagementTool Server');
            process.exit(0);
        })
        .catch(function (err) {
            console.error(err);
            console.log('Stopped ProfileManagementTool Server');
            process.exit(1);
        });
}
