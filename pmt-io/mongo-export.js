//var fs = require('fs');
var yazl = require("yazl");
var intoStream = require('into-stream');
//var outFile = fs.createWriteStream("./test/res/out.zip");

var fromJson = require('./export');
//var db = require('../src/server/lib/db')


exports.exportFile = function(db, stream, modelId) {
var zipfile = new yazl.ZipFile();

return db.getFullModel(modelId)
    .then(function(model) {
        return new Promise(function(resolve, reject) {
            var stats;

            var toXml = fromJson.createStream(modelId, {
                getPackages: function(parent) {
                    return db.getPackagesForParent(parent)
                        .then(function(cursor) {
                            return cursor.toArray();
                        });
                },
                getClasses: function(parent) {
                    return db.getClassesForParent(parent)
                        .then(function(cursor) {
                            return cursor.toArray();
                        });
                },
                getAssociations: function(parent) {
                    return db.getAssociationsForParent(parent)
                        .then(function(cursor) {
                            return cursor.toArray();
                        });
                },
                setStats: function(stat) {
                    stats = stat;
                },
                pretty: true,
                selfClose: true
            });

            var fileName = {
                name: model.name + '.xml'
            };

            var pl = zipfile
                .outputStream
                .pipe(stream);

            zipfile.addReadStream(
                intoStream.obj(model.element)
                    .pipe(toXml), model.name + '.xml');

            zipfile.end();

            pl.on('error', function(err) {
                reject(err);
            })

            pl.on('finish', function() {
                resolve(stats);
            });
        });
    })
}
