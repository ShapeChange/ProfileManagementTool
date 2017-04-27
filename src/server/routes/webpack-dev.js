var webpack = require('webpack')
var webpackConfig = require('../../../webpack.config.development')()

webpackConfig.entry.unshift('webpack-hot-middleware/client?reload=true');
var compiler = webpack(webpackConfig);

exports.addRoutes = function(app, config) {

app.use(require("webpack-dev-middleware")(compiler, webpackConfig.devServer));

app.use(require("webpack-hot-middleware")(compiler));

};
