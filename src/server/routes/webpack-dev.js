var express = require('express');
var webpack = require('webpack');
var historyApiFallback = require('connect-history-api-fallback');
var path = require('path');
var webpackConfig = require('../../../webpack.config.development')();
var compiler = webpack(webpackConfig);

exports.addRoutes = function(app, config) {

// rewrite urls without a dot to index.html
app.use(historyApiFallback({
    index: (config.server.path || '') + '/index.html'
}));

// serve webpack compiled assets
app.use(require("webpack-dev-middleware")(compiler, webpackConfig.devServer));

app.use(require("webpack-hot-middleware")(compiler));

// serve static assets
app.use((config.server.path || '') + '/assets', express.static(path.resolve(__dirname, '../../app/assets')));

};
