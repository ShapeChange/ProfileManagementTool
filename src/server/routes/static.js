var express = require('express');
var router = express.Router();
var fallback = require('express-history-api-fallback')
var trailingSlash = require('trailing-slash')
var path = require('path');
var production = process.env.NODE_ENV === 'production';
var distFolder = !production ? path.resolve(__dirname, '../../../dist/app') : path.resolve(__dirname, '../app')

exports.addRoutes = function(app, config) {
// Serve up the favicon
//app.use(express.favicon(config.server.distFolder + '/favicon.ico'));

// First looks for a static file: index.html, css, images, etc.
//app.use(config.server.staticUrl, express.compress());
console.log('Serving static files from "' + distFolder + '" at "' + (config.server.path || '/') + '"');

app.use(config.server.path || '/', express.static(distFolder));

app.use(trailingSlash({
    slash: true
}))

app.use(fallback('index.html', {
    root: distFolder
}));

//app.use(config.server.path || '/', router);

/*app.use('/', function(req, res, next) {
    res.sendStatus(404); // If we get here then the request for a static file is invalid
});*/
};
