var Promise = require("bluebird");
var socketio = require('socket.io');

var devMiddleware;

exports.addRoutes = function(server, app, config, db) {

// TODO: inject path to frontend with server side rendering
var io = socketio(server, {
    path: config.get('server.path') + '/socket.io'
});

require('./sync.io').addRoutes(app, config, db, io);

if (config.get('env') === 'development') {
    // TODO: this should not be reachable in production env, needs separate start file
    console.log('DEV');
    devMiddleware = require('./webpack-dev').addRoutes(app, config);
} else {
    require('./static').addRoutes(app, config);
}
}

exports.onShutdown = function() {

if (devMiddleware) {
    return devMiddleware.closeAsync();
}

return Promise.resolve();
}