var express = require('express');
var path = require('path');

exports.addRoutes = function(app, config) {
// Serve up the favicon
//app.use(express.favicon(config.server.distFolder + '/favicon.ico'));

// First looks for a static file: index.html, css, images, etc.
//app.use(config.server.staticUrl, express.compress());
console.log(path.resolve(__dirname, '../../../dist'));
app.use('/', express.static(path.resolve(__dirname, '../../../dist')));
app.use('/', function(req, res, next) {
    res.sendStatus(404); // If we get here then the request for a static file is invalid
});
};
