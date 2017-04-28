const resolve = require('path').resolve;
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common');

module.exports = function(env) {
return webpackMerge.strategy({
    entry: 'prepend'
}
)(commonConfig(), {
    entry: [
        'webpack-hot-middleware/client?reload=true',
        'react-hot-loader/patch'
    ],
    output: {
        publicPath: '/pmt/'
    },

    devtool: 'eval',

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),

        new HtmlWebpackPlugin({
            title: 'ProfileManagementTool [DEV]',
            template: 'index.html',
            faviconPath: 'assets/favicon/'
        }),
    ],

    devServer: {
        publicPath: '/pmt/',
        stats: 'normal'
    }
})
}
