var express = require('express');
var fallback = require('express-history-api-fallback')
var trailingSlash = require('trailing-slash')
var path = require('path');

exports.addRoutes = function(app, config) {

var distFolder = config.server.distFolder || path.resolve(__dirname, '../app')

console.log('Serving static files from "' + distFolder + '" at "' + (config.server.path || '/') + '"');

// Serve up the favicon
//app.use(express.favicon(distFolder + '/favicon.ico'));

// cache js and css forever, filenames will change when content changes
app.use(config.server.path || '/', express.static(path.join(distFolder, 'assets'), {
    maxage: '1y'
}));
// only use ETag caching for index.html
app.use(config.server.path || '/', express.static(distFolder));

app.use(trailingSlash({
    slash: true
}))

app.use(fallback('index.html', {
    root: distFolder
}));

};
