var Writable = require('stream').Writable;
var Promise = require("bluebird");

var config = {
    batchSize: 1,
    insertOptions: {
        w: 1
    }
};
var batch = [];
var collection;

module.exports = {
    create: streamToMongoDB
};

function streamToMongoDB(coll, options) {
    config = Object.assign(config, options);

    collection = coll;

    return writableStream();
}

function writableStream() {
    var iteration = 0;
    const writable = new Writable({
        objectMode: true,
        highWaterMark: config.batchSize,
        write: function(record, enc, next) {
            addToBatch(record, iteration)
                .then(function() {
                    console.log('iteration', iteration++)
                    //if (iteration++ <= 24)

                    next();
                });
        }
    });

    writable.on("finish", function() {
        insertToMongo(batch)
            .then(function() {
                console.log('mongo close')
                writable.emit("close");
            });
    });

    return writable;
}

function addToBatch(record, iteration) {
    batch.push(record);

    if (batch.length === config.batchSize) {
        return insertToMongo(batch, iteration);
    }

    return Promise.resolve();
}

function insertToMongo(records, iteration) {
    if (records.length) {
        return collection.insert(records, config.insertOptions)
            .then(function() {
                console.log('WRITTEN', iteration)
                resetBatch();
            })
    }

    return Promise.resolve();
}

function resetBatch() {
    batch = [];
}
