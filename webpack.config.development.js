const resolve = require('path').resolve;
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const appConfig = require('./pmt-app/webpack.config.development');

module.exports = function(env) {
return webpackMerge.strategy({
    entry: 'prepend'
}
)(appConfig(env), {
})
}
