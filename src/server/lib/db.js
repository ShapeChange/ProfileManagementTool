var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;
var dbProfile = require('./db-profile');

var MODELS = 'models';
var db;
var model;
var dbEdit;

function setConnection(connection) {
    db = connection;
    model = db.collection(MODELS);
    dbEdit = dbProfile.create(model);

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
            model: ObjectID(modelId)
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
            parent: ObjectID(parent)
        })
);
}

exports.getClassesForParent = function(parent) {
return Promise.resolve(
    model
        .find({
            type: 'cls',
            parent: ObjectID(parent)
        })
);
}

exports.getAssociationsForParent = function(parent) {
return Promise.resolve(
    model
        .find({
            type: 'asc',
            parent: ObjectID(parent)
        })
);
}

exports.getClassesForPackage = function(pkg) {
return Promise.resolve(
    model
        .find({
            type: 'cls',
            parent: ObjectID(pkg)
        })
        .project({
            localId: 1,
            parent: 1,
            name: 1,
            type: 1,
            stereotypes: 1,
            profiles: 1
        })
        .sort({
            name: 1
        })
);
}

exports.getDetails = function(id) {
var query = id.length === 24 ? {
    _id: ObjectID(id)
} : {
    localId: id
}

return model
    .findOne(query, {
        element: 0,
        'properties.element': 0
    })
    // TODO: aggregate ???
    .then(function(details) {
        var localids = [];

        if (details && details.supertypes)
            localids = localids.concat(details.supertypes);
        if (details && details.properties)
            details.properties.reduce(function(ids, prp) {
                //if (prp.typeId) ids.push(prp.typeId)
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
                    localId: {
                        $in: localids
                    }
                })
                .project({
                    name: 1,
                    localId: 1
                })
                .toArray()
                .then(function(resolvedIds) {
                    if (details.supertypes)
                        details.supertypes = details.supertypes.map(function(st) {
                            return resolvedIds.find(function(tid) {
                                return tid.localId === st;
                            });
                        });
                    if (details.properties)
                        details.properties = details.properties.map(function(prp) {
                            /*if (prp.typeId)
                                prp.typeId = resolvedIds.find(function(tid) {
                                    return tid.localid === prp.typeId;
                                });*/
                            if (prp.associationId)
                                prp.associationId = resolvedIds.find(function(tid) {
                                    return tid.localId === prp.associationId;
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
        _id: ObjectID(id)
    }, {
        element: 0
    })
}

exports.updatePackageProfile = function(clsId, modelId, profile, include, onlyMandatory, recursive) {


return measure(dbEdit.getProfileUpdatesForPackage(clsId, modelId, profile, include, onlyMandatory, recursive));

}

exports.updateClassProfile = function(clsId, modelId, profile, include, onlyMandatory, onlyChildren) {

return measure(dbEdit.getProfileUpdatesForClass(clsId, modelId, profile, include, onlyMandatory, onlyChildren));

}

exports.updatePropertyProfile = function(clsId, prpId, modelId, profile, include) {

return measure(dbEdit.getProfileUpdatesForProperty(clsId, prpId, modelId, profile, include));

}

function measure(prms) {
    var start = Date.now();

    return prms
        .then(function(results) {
            console.log('took', Date.now() - start)
            return results;
        });
}

exports.close = function(force) {
return db.close(force || false);
}

