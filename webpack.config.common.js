const resolve = require('path').resolve;
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function() {
return {
    context: resolve(__dirname, 'src/app'),

    entry: [
        './index.jsx'
    ],
    output: {
        filename: '[name].js',
        path: resolve(__dirname, 'dist/app')
    },

    devtool: 'eval',

    watchOptions: {
        ignored: /node_modules/,
    },

    resolve: {
        extensions: [".js", ".jsx", ".json", ".css", ".less"]
    },

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: [{
                    loader: 'babel-loader',
                }],
                exclude: /(node_modules)/
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader' /*,
                        options: {
                            modules: true
                        }*/
                    }, /*{
              loader: 'postcss-loader'
            },*/ {
                        loader: 'less-loader',
                        options: {
                            includePaths: [resolve(__dirname, 'src/app/less')]
                        }
                    }
                ],
            },
            {
                test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                use: [{
                    loader: 'base64-font-loader',
                }]
            }
        ],
    },

    plugins: [

        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function(module) {
                // this assumes your vendor imports exist in the node_modules directory
                return module.context && module.context.indexOf('node_modules') !== -1;
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest',
        }),

        new HtmlWebpackPlugin({
            title: 'ProfileManagementTool',
            //favicon: 'assets/img/favicon.png',
            //filename: 'app/index.html',
            template: 'index.html'
        }),

    ],
}
};
