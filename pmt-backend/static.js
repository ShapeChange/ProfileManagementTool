var express = require('express');
var historyApiFallback = require('connect-history-api-fallback');
var trailingSlash = require('trailing-slash');
var favicon = require('serve-favicon');
var path = require('path');

exports.addRoutes = function(app, config) {

var distFolder = config.get('server.distFolder')
var appPath = config.get('server.path') || '/'

console.log('Serving static files from "' + distFolder + '" at "' + (appPath) + '"');

// serve up the default implicit favicon
app.use(favicon(distFolder + '/assets/favicon/favicon.ico'));

// cache assets forever, filenames will change when content changes
app.use(appPath, express.static(path.join(distFolder, 'assets'), {
    maxage: '1y'
}));

// only use ETag caching for index.html
app.use(appPath, express.static(distFolder));

// if no asset, always append trailing slash to enable usage of relative links
app.use(trailingSlash({
    slash: true
}))

// if we get to this, it is a javascript history api url, so rewrite to index.html
app.use(historyApiFallback({
    index: appPath + 'index.html'
}));

// serve index.html once more
app.use(appPath, express.static(distFolder));

};
