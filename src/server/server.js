var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var syncio = require('./routes/sync.io');
var config = require('./cfg/config.js');

var app = express();
var server = http.createServer(app);
var io = socketio(server);

syncio.addRoutes(app, io, config);

require('./routes/static').addRoutes(app, config);

server.listen(config.server.port);

console.log('ProfileManagementTool Server - listening on port: ' + config.server.port);

