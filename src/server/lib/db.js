var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;
//var dbStream = require('./db-stream')

var db;
var model;

function setConnection(connection) {
    db = connection;
    model = db.collection('models');

    return db;
}

exports.connect = function(url) {
if (db) {
    return Promise.resolve();
}

return MongoClient
    .connect(url, {
        promiseLibrary: Promise,
        poolSize: 5,
        loggerLevel: 'error'
    })
    .then(setConnection);
}

exports.getModelCollection = function() {
return model;
}

exports.getModels = function(owner) {
return Promise.resolve(
    model
        .find({
            owner: owner
        })
        .project({
            name: 1,
            created: 1,
            profiles: 1
        })
        .sort({
            created: -1
        })
)
}

exports.getPackages = function(modelId) {
return Promise.resolve(
    model
        .find({
            type: 'pkg',
            model: modelId
        })
        .project({
            parent: 1,
            name: 1,
            type: 1
        })
        .sort({
            name: 1
        })
);
}

exports.getPackagesForParent = function(parent) {
return Promise.resolve(
    model
        .find({
            type: 'pkg',
            parent: parent
        })
);
}

exports.getClassesForParent = function(parent) {
return Promise.resolve(
    model
        .find({
            type: 'cls',
            parent: parent
        })
);
}

exports.getAssociationsForParent = function(parent) {
return Promise.resolve(
    model
        .find({
            type: 'asc',
            parent: parent
        })
);
}

exports.getClassesForPackage = function(pkg) {
return Promise.resolve(
    model
        .find({
            type: 'cls',
            parent: pkg
        })
        .project({
            parent: 1,
            name: 1,
            type: 1,
            stereotypes: 1
        })
        .sort({
            name: 1
        })
);
}

exports.getDetails = function(id) {
return model
    .findOne({
        _id: new ObjectID(id)
    })
    .then(function(details) {
        var localids = [];

        if (details && details.supertypes)
            localids = localids.concat(details.supertypes);
        if (details && details.properties)
            details.properties.reduce(function(ids, prp) {
                if (prp.typeId) ids.push(prp.typeId)
                if (prp.associationId) ids.push(prp.associationId)
                return ids;
            }, localids);

        if (localids.length) {
            return model
                .find({
                    type: {
                        $in: ["cls", "asc"]
                    },
                    model: details.model,
                    localid: {
                        $in: localids
                    }
                })
                .project({
                    name: 1,
                    localid: 1
                })
                .toArray()
                .then(function(resolvedIds) {
                    if (details.supertypes)
                        details.supertypes = details.supertypes.map(function(st) {
                            return resolvedIds.find(function(tid) {
                                return tid.localid === st;
                            });
                        });
                    if (details.properties)
                        details.properties = details.properties.map(function(prp) {
                            if (prp.typeId)
                                prp.typeId = resolvedIds.find(function(tid) {
                                    return tid.localid === prp.typeId;
                                });
                            if (prp.associationId)
                                prp.associationId = resolvedIds.find(function(tid) {
                                    return tid.localid === prp.associationId;
                                });
                            return prp;
                        });

                    return details
                })
        } else
            return details;
    })
}

exports.getModel = function(id) {
return model
    .findOne({
        _id: id
    })
}

/*exports.createStream = function(options) {
return dbStream.create(model, options);
}*/

exports.close = function(force) {
return db.close(force || false);
}

