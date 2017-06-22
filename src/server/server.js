var Promise = require("bluebird");
var http = require('http');
var httpShutdown = require('http-shutdown');
var express = require('express');
var compression = require('compression');
//var logger = require('morgan');
var socketio = require('socket.io');
var db = require('./lib/db');
var config = require('./config.js');

var app = express();
//app.use(logger('combined'));
app.use(compression());

var server = http.createServer(app);
server = httpShutdown(server);
server = Promise.promisifyAll(server);

// TODO: inject path to frontend with server side rendering
var io = socketio(server, {
    path: config.get('server.path') + '/socket.io'
});

var devMiddleware;

db.connect(config.get('db.url'))
    .then(function() {
        require('./routes/sync.io').addRoutes(app, config, db, io);

        if (config.get('env') === 'development') {
            // TODO: this should not be reachable in production env, needs separate start file
            console.log('DEV');
            devMiddleware = require('./routes/webpack-dev').addRoutes(app, config);
        } else {
            require('./routes/static').addRoutes(app, config);
        }

        return server.listenAsync(config.get('server.port'));
    })
    .then(function() {
        console.log('Started ProfileManagementTool Server - listening on port: ' + config.get('server.port'));
    });

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
process.on('SIGQUIT', shutdown);

function shutdown() {
    var pr = Promise.resolve();
    if (devMiddleware) {
        pr = devMiddleware.closeAsync();
    }

    return pr
        .then(function() {
            return server.shutdownAsync();
        })
        .then(function() {
            return db.close(true);
        })
        .then(function() {
            console.log('Stopped ProfileManagementTool Server');
            process.exit(0);
        })
        .catch(function(err) {
            console.error(err);
            console.log('Stopped ProfileManagementTool Server');
            process.exit(1);
        });
}
