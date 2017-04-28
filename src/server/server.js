var express = require('express');
var http = require('http');
var compression = require('compression');
var logger = require('morgan');
var socketio = require('socket.io');
var syncio = require('./routes/sync.io');
var config = require('./cfg/config.js');

var app = express();

//app.use(logger('combined'));
app.use(compression());

var server = http.createServer(app);
var io = socketio(server, {
    path: (config.server.path || '') + '/socket.io'
});

syncio.addRoutes(app, io, config);

if (config.devEnv) {
    // TODO: this should not be reachable in production env, needs separate start file
    console.log('DEV');
    require('./routes/webpack-dev').addRoutes(app, config);
} else {
    require('./routes/static').addRoutes(app, config);
}

server.listen(config.server.port);

console.log('ProfileManagementTool Server - listening on port: ' + config.server.port);

