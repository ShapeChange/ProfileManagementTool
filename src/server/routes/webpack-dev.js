var Promise = require("bluebird");
var path = require('path');
var express = require('express');
var webpack = require('webpack');
var devMiddleware = require("webpack-dev-middleware");
var hotMiddleware = require("webpack-hot-middleware");
var historyApiFallback = require('connect-history-api-fallback');
var webpackConfig = require('../../../webpack.config.development')();
var compiler = webpack(webpackConfig);

exports.addRoutes = function(app, config) {

// rewrite urls without a dot to index.html
app.use(historyApiFallback({
    index: (config.server.path || '') + '/index.html'
}));

// serve webpack compiled assets
var devMid = devMiddleware(compiler, webpackConfig.devServer)
app.use(devMid);

app.use(hotMiddleware(compiler));

// serve static assets
app.use((config.server.path || '') + '/assets', express.static(path.resolve(__dirname, '../../app/assets')));

return Promise.promisifyAll(devMid);
};
