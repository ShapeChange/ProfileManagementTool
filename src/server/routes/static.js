var express = require('express');
var path = require('path');
var development = process.env.NODE_ENV !== 'production';
var distFolder = development ? path.resolve(__dirname, '../../../dist/app') : path.resolve(__dirname, '../app')

exports.addRoutes = function(app, config) {
// Serve up the favicon
//app.use(express.favicon(config.server.distFolder + '/favicon.ico'));

// First looks for a static file: index.html, css, images, etc.
//app.use(config.server.staticUrl, express.compress());
console.log('Serving static files from: ' + distFolder);
app.use('/', express.static(distFolder));
app.use('/', function(req, res, next) {
    res.sendStatus(404); // If we get here then the request for a static file is invalid
});
};
