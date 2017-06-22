const resolve = require('path').resolve;
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const commonConfig = require('./webpack.config.common');

module.exports = function(env) {
return webpackMerge(commonConfig(), {
    output: {
        filename: '[name].[chunkhash].js',
        publicPath: '/pmt/'
    },

    devtool: 'eval',

    plugins: [
        new CleanWebpackPlugin([resolve(__dirname, 'dist')]),

        new webpack.HashedModuleIdsPlugin(),

        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),

        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),

        //new webpack.optimize.UglifyJsPlugin({
        //}),

        new HtmlWebpackPlugin({
            title: 'ProfileManagementTool',
            filename: '../index.html',
            template: 'index.html',
            faviconPath: 'favicon/'
        }),

        new CopyWebpackPlugin([
            {
                from: 'assets/favicon',
                to: '../../app/assets/favicon'
            },
            {
                from: '../cfg',
                to: '../../cfg'
            },
            {
                from: '../server.js',
                to: '../../'
            },
            {
                from: '../config.js',
                to: '../../'
            },
            {
                from: '../package.json',
                to: '../../'
            }
        ])

    ]
})
}

