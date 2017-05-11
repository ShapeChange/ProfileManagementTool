//var fs = require('fs');
//var inFile = fs.createReadStream("./test/res/DGIF_IV_2016-2_Stand_Stewardbearbeitung.zip");
//var inFile = fs.createReadStream("./test/res/PMT_UnitTest_Model.zip");
var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var unzip = require('./unzip');
var fromXml = require('./import');
var mongoStream = require('./mongo-stream')

// 1: 94s, 185MB
// 5: 77s, 167MB
// 10: 71s, 235MB
// 25: 65s, 197MB
// 50: 62s, 230MB
// 100: 59s, 317MB
// 1000: 56s, 567MB

/*
packages:  749
classes:  19314
associations:  2171

packages:  13
classes:  41
associations:  6
*/

var batchSize = 32;

exports.importFile = function(db, stream, metadata) {
return new Promise(function(resolve, reject) {
    var stats;

    var toUnzip = unzip.createStream();

    var toJson = fromXml.createStream(metadata.name, {
        batchSize: batchSize,
        generateId: function() {
            return new ObjectID();
        },
        resolveId: function(id) {
            return id.toHexString();
        },
        setStats: function(stat) {
            stats = stat;
        }
    });

    var toMongo = mongoStream.create(db, {
        batchSize: batchSize
    });

    var pl = metadata.zipped
        ? stream.pipe(toUnzip)
        : stream

    pl = pl
        .pipe(toJson)
        .pipe(toMongo)

    pl.on('error', function(err) {
        reject(err);
    })

    pl.on('close', function() {
        resolve(stats);
    })
});
}
