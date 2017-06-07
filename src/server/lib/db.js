var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;
//var dbProfile = require('./db-profile');
var profileEdit = require('./profile-edit');
var mr = require('./model-reader');
var pw = require('./profile-writer');

var MODELS = 'models';
var db;
var model;
var dbEdit;
var modelReader;
var profileWriter;

function setConnection(connection) {
    db = connection;
    model = db.collection(MODELS);
    //dbEdit = dbProfile.create(model);
    modelReader = mr.create(model, MODELS)
    profileWriter = pw.create(model)
    dbEdit = profileEdit(modelReader, profileWriter);

    model.createIndexes([{
        key: {
            'parent': 1
        }
    }, {
        key: {
            'model': 1
        }
    }, {
        key: {
            'localId': 1
        }
    }, {
        key: {
            'supertypes': 1
        }
    }, {
        key: {
            'editable': 1
        }
    }, {
        key: {
            'type': 1
        }
    }, {
        key: {
            'properties.typeId': 1
        }
    }, {
        key: {
            'properties.optional': 1
        }
    }, {
        key: {
            'name': 'text',
            'descriptors.alias': 'text',
            'descriptors.definition': 'text',
            'descriptors.description': 'text',
            'properties.name': 'text',
            'properties.descriptors.alias': 'text',
            'properties.descriptors.definition': 'text',
            'properties.descriptors.description': 'text'
        },
        name: 'textSearchIndex'
    }])
        .then(function(indexName) {
            console.log('Created indexes ', indexName)
        })
        .catch(function(error) {
            console.log('Error on creating indexes: ', error)
        })

    return db;
}

exports.getModelReader = function() {
return modelReader;
}

exports.getProfileWriter = function() {
return profileWriter;
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
            profiles: 1,
            profiles2: 1
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
            type: 1,
            editable: 1
        })
        .sort({
            name: 1
        })
);
}

exports.getClasses = function(modelId) {
return Promise.resolve(
    model
        .find({
            type: 'cls',
            model: ObjectID(modelId)
        })
        .project({
            element: 0,
            'properties.element': 0
        })
);
}

exports.getFilteredPackages = function(modelId, filter) {
/*return Promise.join(exports.getPackages(modelId), getPackagesForFilteredClasses(modelId, filter), function(pkgs, ids) {
    console.log(ids)
    return pkgs.toArray().filter(function(pkg) {
        return ids.indexOf(pkg._id.toHexString()) > -1;
    });
})*/

if (!filter || filter === '') {
    return exports.getPackages(modelId)
        .then(function(pkgs) {
            return pkgs.toArray();
        })
}

return getPackagesForFilteredClasses(modelId, filter)
    .then(function(ids) {
        return model
            .aggregate([
                {
                    $match: {
                        _id: {
                            $in: ids
                        },
                        model: ObjectID(modelId)
                    }
                },
                {
                    $graphLookup: {
                        from: MODELS,
                        startWith: "$parent",
                        connectFromField: "parent",
                        connectToField: "_id",
                        as: "items",
                        restrictSearchWithMatch: {
                            model: ObjectID(modelId),
                            type: 'pkg'
                        }
                    }
                },
                {
                    $unwind: "$items"
                },
                {
                    $replaceRoot: {
                        newRoot: "$items"
                    }
                },
                {
                    $project: {
                        parent: 1,
                        name: 1,
                        type: 1,
                        editable: 1
                    }
                }
            ])
            .toArray()
    })
    .then(function(pkgs) {
        const ids = [];
        return pkgs.filter(function(pkg) {
            if (ids.indexOf(pkg._id.toHexString()) === -1) {
                ids.push(pkg._id.toHexString())
                return true
            }
            return false
        });
    })

/*return Promise.resolve(
    model
        .find({
            type: 'pkg',
            model: ObjectID(modelId),
            $text: {
                $search: filter
            }
        })
        .project({
            parent: 1,
            name: 1,
            type: 1,
            editable: 1
        })
        .sort({
            name: 1
        })
);*/
}

function getPackagesForFilteredClasses(modelId, filter) {
    return Promise.resolve(
        model
            .find({
                type: 'cls',
                model: ObjectID(modelId),
                $or: [
                    {
                        name: {
                            $regex: '(?i)' + filter
                        }
                    },
                    {
                        'descriptors.alias': {
                            $regex: '(?i)' + filter
                        }
                    },
                    {
                        'properties.name': {
                            $regex: '(?i)' + filter
                        }
                    },
                    {
                        'properties.descriptors.alias': {
                            $regex: '(?i)' + filter
                        }
                    }
                ]
            })
            .project({
                parent: 1
            })
    ).then(function(classes) {
        return classes.toArray()
    }).then(function(classes) {
        return classes.map(function(cls) {
            return cls._id //.toHexString()
        })
    });
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

exports.getClassesForPackage = function(pkg, filter) {
const query = {
    type: 'cls',
    parent: ObjectID(pkg)
}

if (filter && filter !== '') {
    query.$or = [
        {
            name: {
                $regex: '(?i)' + filter
            }
        },
        {
            'descriptors.alias': {
                $regex: '(?i)' + filter
            }
        },
        {
            'properties.name': {
                $regex: '(?i)' + filter
            }
        },
        {
            'properties.descriptors.alias': {
                $regex: '(?i)' + filter
            }
        }
    ]
}

return Promise.resolve(
    model
        .find(query)
        .project({
            localId: 1,
            parent: 1,
            name: 1,
            type: 1,
            stereotypes: 1,
            profiles: 1,
            editable: 1
        })
        .sort({
            name: 1
        })
);
}

exports.getDetails = function(id, modelId) {
var query = id.length === 24 ? {
    _id: ObjectID(id)
} : {
    localId: id
}
if (modelId)
    query.model = ObjectID(modelId)

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

exports.updatePackageEditable = function(pkgId, modelId, editable, recursive) {


return measure(dbEdit.getEditableUpdatesForPackage(pkgId, modelId, editable, recursive));

}

exports.updateProfileParameter = function(clsId, prpId, modelId, profile, parameter) {


return measure(dbEdit.getProfileParameterUpdates(clsId, prpId, modelId, profile, parameter));

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

