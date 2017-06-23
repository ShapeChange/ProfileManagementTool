const resolve = require('path').resolve;
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const appConfig = require('./pmt-app/webpack.config.production');

module.exports = function(env) {
return webpackMerge(appConfig(env), {
    output: {
        path: resolve(__dirname, 'dist/app/assets')
    },
    plugins: [
        new CleanWebpackPlugin([resolve(__dirname, 'dist')]),

        new CopyWebpackPlugin([
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
            },
            {
                from: '../npm-shrinkwrap.json',
                to: '../../'
            }
        ])

    ]
})
}

