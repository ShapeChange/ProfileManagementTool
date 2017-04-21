const resolve = require('path').resolve;
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const commonConfig = require('./webpack.config.common');

module.exports = function(env) {
return webpackMerge(commonConfig(), {
    output: {
        filename: '[name].[chunkhash].js',
	publicPath: '/'
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

        new webpack.optimize.UglifyJsPlugin({
        }),

        new CopyWebpackPlugin([
            {
                from: '../server/cfg/config.docker.js',
                to: '../cfg/config.js'
            },
            {
                from: '../server/routes',
                to: '../routes'
            },
            {
                from: '../server/server.js',
                to: '../'
            },
            {
                from: '../server/db.js',
                to: '../'
            },
            {
                from: '../../package.json',
                to: '../'
            }
        ])
    ]
})
}

