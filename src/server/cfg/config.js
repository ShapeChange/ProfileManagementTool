var path = require('path');

module.exports = {
    server: {
        port: 8000,
        path: "/pmt",
        distFolder: path.resolve(__dirname, '../../../dist/app')
    },
    db: {
        url: "mongodb://localhost:27017/pmt01"
    },
    devEnv: process.env.NODE_ENV !== 'production'
};
