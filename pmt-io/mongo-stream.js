var writer = require('flush-write-stream')
var Promise = require("bluebird");

var config = {
    batchSize: 1,
    insertOptions: {
        w: 1
    }
};

module.exports = {
    create: streamToMongoDB
};

function streamToMongoDB(collection, options) {
    var params = Object.assign({
        collection: collection,
        batch: [],
        iteration: 0
    }, config, options);

    return writer({
        objectMode: true,
        highWaterMark: 1
    }, function(obj, enc, cb) {
        params.iteration++;
        addToBatch(obj, params)
            .then(cb);
    }, function(cb) {
        insertToMongo(params)
            .then(function() {
                console.log('mongo close');
                cb();
                this.emit("close");
            }.bind(this));
    });
}

function addToBatch(record, params) {
    params.batch.push(record);

    if (params.batch.length === params.batchSize) {
        return insertToMongo(params);
    }

    return Promise.resolve();
}

function insertToMongo(params) {
    if (params.batch.length) {
        return params.collection.insert(params.batch, params.insertOptions)
            .then(function() {
                console.log('WRITTEN', params.iteration)
                resetBatch(params);
            })
    }

    return Promise.resolve();
}

function resetBatch(params) {
    params.batch = [];
}
