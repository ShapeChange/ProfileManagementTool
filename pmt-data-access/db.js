var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;
//var dbProfile = require('./db-profile');
var profileEdit = require('./profile-edit');
var mr = require('./model-reader');
var pw = require('./profile-writer');
var urw = require('./user-rw');

var MODELS = 'models';
var USERS = 'users';
var db;
var model;
var users;
var dbEdit;
var modelReader;
var profileWriter;
var userReaderWriter;

function setConnection(connection) {
    db = connection;
    model = db.collection(MODELS);
    users = db.collection(USERS);

    modelReader = mr.create(model, MODELS)
    profileWriter = pw.create(model)
    userReaderWriter = urw.create(users)

    dbEdit = profileEdit(modelReader, profileWriter);

    return model.createIndexes([{
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
            'name': 1
        }
    }, {
        key: {
            'descriptors.alias': 1
        }
    }, {
        key: {
            'profiles': 1
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
            'properties.name': 1
        }
    }, {
        key: {
            'properties.descriptors.alias': 1
        }
    } /*, {
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
    }*/ ])
        .then(function(indexName) {
            console.log('Created indexes ', indexName)

            return users.createIndexes([{
                key: {
                    'name': 1
                },
                unique: true
            }])
                .then(function(indexName) {
                    console.log('Created indexes ', indexName)
                })
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

exports.getUserReaderWriter = function() {
return userReaderWriter;
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

exports.getUserCollection = function() {
return users;
}

exports.getModels = function(owner) {
return Promise.resolve(
    model
        .find({
            owner: owner,
            type: 'mdl'
        })
        .project({
            name: 1,
            created: 1,
            profilesInfo: 1
        })
        .sort({
            created: -1
        })
)
}

exports.getPackages = function(modelId, filter) {
const query = {
    type: 'pkg',
    model: ObjectID(modelId)
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
        }
    ]
}

return Promise.resolve(
    model
        .find(query)
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

if (!filter || filter === '') {
    return exports.getPackages(modelId)
        .then(function(pkgs) {
            return pkgs.toArray();
        })
}

var filteredPackageTree = exports.getPackages(modelId, filter)
    .then(function(pkgs) {
        return pkgs.toArray();
    })
    .then(function(pkgs) {
        return pkgs.map(function(pkg) {
            return pkg._id
        })
    })
    .then(function(pkgIds) {
        return getParentsForPackages(modelId, pkgIds)
    })


var packagesForFilteredClasses = getFilteredClasses(modelId, filter)
    .then(function(classIds) {
        return getPackagesForClasses(modelId, classIds)
    })


return Promise.join(filteredPackageTree, packagesForFilteredClasses, function(pkgs, pkgs2) {
    return pkgs.concat(pkgs2);
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
}

function getPackagesForClasses(modelId, classIds) {

    return model
        .aggregate([
            {
                $match: {
                    _id: {
                        $in: classIds
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

}

function getParentsForPackages(modelId, pkgIds) {
    return model
        .aggregate([
            {
                $match: {
                    _id: {
                        $in: pkgIds
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
                    as: "inheritanceTree",
                    restrictSearchWithMatch: {
                        model: ObjectID(modelId),
                        type: 'pkg'
                    }
                }
            },
            {
                $project: {
                    items: {
                        $concatArrays: [["$$ROOT"], "$inheritanceTree"]
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
}

function getFilteredClasses(modelId, filter) {
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
                        'descriptors.description': {
                            $regex: '(?i)' + filter
                        }
                    },
                    {
                        'descriptors.definition': {
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
                    },
                    {
                        'properties.descriptors.description': {
                            $regex: '(?i)' + filter
                        }
                    },
                    {
                        'properties.descriptors.definition': {
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
            'descriptors.description': {
                $regex: '(?i)' + filter
            }
        },
        {
            'descriptors.definition': {
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
        },
        {
            'properties.descriptors.description': {
                $regex: '(?i)' + filter
            }
        },
        {
            'properties.descriptors.definition': {
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
            editable: 1,
            isAbstract: 1,
            isMeta: 1,
            isReason: 1
        })
        .sort({
            name: 1
        })
        .toArray()
        .then(function(classes) {
            if (filter && filter !== '') {
                return classes.map(function(cls) {
                    cls.filterMatch = true;
                    return cls;
                })
            }
            return classes;
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
    .then(resolveIds)
}

// TODO: aggregate ???
function resolveIds(details, flattenOninas) {
    var localids = [];

    if (details && details.supertypes)
        localids = localids.concat(details.supertypes);
    if (details && details.subtypes)
        localids = localids.concat(details.subtypes);
    if (details && details.associationId)
        localids.push(details.associationId)
    if (details && details.properties)
        details.properties.reduce(function(ids, prp) {
            if (prp.typeId) ids.push(prp.typeId)
            if (prp.associationId) ids.push(prp.associationId)
            return ids;
        }, localids);
    if (flattenOninas && details.metaReasonClasses)
        details.metaReasonClasses.reduce(function(ids, cls) {
            return cls.properties.reduce(function(ids, prp) {
                if (prp.typeId) ids.push(prp.typeId)
                return ids;
            }, ids);
        }, localids);
    if (details && details.end1 && details.end1.ref)
        localids.push(details.end1.ref)
    if (details && details.end2 && details.end2.ref)
        localids.push(details.end2.ref)

    if (localids.length) {
        return model
            .find({
                type: {
                    $in: ["cls", "asc"]
                },
                model: details.model,
                $or: [
                    {
                        localId: {
                            $in: localids
                        }
                    },
                    {
                        'properties.localId': {
                            $in: localids
                        }
                    }
                ]
            })
            .project({
                name: 1,
                localId: 1,
                isAbstract: 1,
                isMeta: 1,
                isReason: 1,
                'properties.localId': 1,
                'properties.name': 1
            })
            .toArray()
            .then(function(resolvedIds) {

                if (details.supertypes)
                    details.supertypes = details.supertypes.map(function(st) {
                        return resolvedIds.find(function(tid) {
                            return tid.localId === st;
                        });
                    });
                if (details.subtypes)
                    details.subtypes = details.subtypes.map(function(st) {
                        return resolvedIds.find(function(tid) {
                            return tid.localId === st;
                        });
                    });
                if (details.associationId)
                    details.associationId = resolvedIds.find(function(tid) {
                        return tid.localId === details.associationId;
                    });
                if (details && details.end1 && details.end1.ref) {
                    var eid = details.end1.ref;

                    details.end1 = resolvedIds.find(function(tid) {
                        return tid.properties.some(prp => prp.localId === eid);
                    });
                    details.end1.properties = details.end1.properties.filter(prp => prp.localId === eid);
                }
                if (details && details.end2 && details.end2.ref) {
                    var eid = details.end2.ref;
                    details.end2 = resolvedIds.find(function(tid) {
                        return tid.properties.some(prp => prp.localId === eid);
                    });
                    details.end2.properties = details.end2.properties.filter(prp => prp.localId === eid);
                }
                if (details.properties) {
                    if (flattenOninas && details.metaReasonClasses) {
                        resolvedIds = resolvedIds.concat(details.metaReasonClasses.map(function(t) {
                            return {
                                name: t.name,
                                localId: t.localId,
                                isAbstract: t.isAbstract,
                                isMeta: t.isMeta,
                                isReason: t.isReason
                            }
                        }))

                        details.properties = details.properties.map(function(prp) {
                            var metaReason = details.metaReasonClasses.find(function(t) {
                                return t.localId === prp.typeId
                            })

                            if (metaReason && metaReason.isMeta) {
                                metaReason = details.metaReasonClasses.find(function(t) {
                                    return metaReason.properties && t.localId === metaReason.properties[0].typeId
                                })
                            }

                            if (metaReason && metaReason.isReason && metaReason.properties) {
                                var value = metaReason.properties.find(function(p) {
                                    return !p.isNilReason
                                })

                                if (value) {
                                    prp.typeId = value.typeId
                                    prp.cardinality = _mergeCardinalities(prp.cardinality, value.cardinality)
                                }
                            }

                            return prp;
                        });

                        delete details.metaReasonClasses
                    }

                    details.properties = details.properties.map(function(prp) {
                        if (prp.typeId)
                            prp.typeId = resolvedIds.find(function(tid) {
                                return tid.localId === prp.typeId;
                            });
                        if (prp.associationId)
                            prp.associationId = resolvedIds.find(function(tid) {
                                return tid.localId === prp.associationId;
                            });
                        return prp;
                    });
                }

                return details
            })
    } else
        return details;
}

function _mergeCardinalities(cardinality1, cardinality2) {
    var bounds1 = cardinality1.split('..')
    var bounds2 = cardinality2.split('..')
    var newMin = parseInt(bounds1[0]) * parseInt(bounds2[0])
    var newMax = bounds1[1] === '*' || bounds2[1] === '*' ? '*' : parseInt(bounds1[1]) * parseInt(bounds2[1])

    return newMin + '..' + newMax
}

exports.getFlattenedClass = function(id, modelId, flattenInheritance, flattenOninas) {
var aggregate = [
    {
        $match: {
            localId: id,
            model: ObjectID(modelId)
        }
    }
]

if (flattenInheritance) {
    aggregate = aggregate.concat([{
        $graphLookup: {
            from: MODELS,
            startWith: '$supertypes',
            connectFromField: 'supertypes',
            connectToField: 'localId',
            as: "inheritanceTree",
            restrictSearchWithMatch: {
                model: ObjectID(modelId)
            }
        }
    },
        {
            $addFields: {
                properties: {
                    $reduce: {
                        input: "$inheritanceTree.properties",
                        initialValue: "$$ROOT.properties",
                        in: {
                            $concatArrays: ["$$value", "$$this"]
                        }
                    }
                }
            }
        }, {
            $addFields: {
                superEditable: {
                    $map: {
                        input: "$inheritanceTree",
                        as: "row",
                        in: {
                            _id: "$$row.localId",
                            editable: "$$row.editable"
                        }
                    }
                }
            }
        }])
}

if (flattenOninas) {
    aggregate = aggregate.concat([{
        $graphLookup: {
            from: MODELS,
            startWith: '$properties.typeId',
            connectFromField: 'properties.typeId',
            connectToField: 'localId',
            as: "metaReasonClasses",
            restrictSearchWithMatch: {
                model: ObjectID(modelId),
                $or: [{
                    isMeta: true
                }, {
                    isReason: true
                }]
            }
        }
    }])
}

aggregate.push({
    $project: {
        element: 0,
        'properties.element': 0,
        'metaReasonClasses.element': 0,
        'metaReasonClasses.properties.element': 0,
        inheritanceTree: 0
    }
})

return model
    .aggregate(aggregate)
    .toArray()
    .then(function(details) {
        return resolveIds(details[0], flattenOninas)
    })
}

exports.getModel = function(id, owner) {
return model
    .findOne({
        _id: ObjectID(id),
        owner: owner
    }, {
        element: 0
    })
}

exports.getFullModel = function(id) {
return model
    .findOne({
        _id: ObjectID(id)
    })
}

exports.updatePackageProfile = function(clsId, modelId, profile, include, onlyMandatory, recursive) {


return measure(dbEdit.getProfileUpdatesForPackage(clsId, modelId, profile, include, onlyMandatory, recursive));

}

exports.updateClassProfile = function(clsId, modelId, profile, include, onlyMandatory, onlyChildren, ascendInheritanceTree) {

return measure(dbEdit.getProfileUpdatesForClass(clsId, modelId, profile, include, onlyMandatory, onlyChildren, ascendInheritanceTree));

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

exports.deleteModel = function(id) {
return model
    .deleteOne({
        _id: ObjectID(id)
    })
    .then(function(ret) {
        console.log('DELETE', ret.result)
        // do not wait for this, should happen async in the background
        model
            .deleteMany({
                model: ObjectID(id)
            })
            .then(function(ret2) {
                console.log('DELETE2', ret2.result)
            })
    })
}

exports.deleteProfile = function(id, modelId) {
var update = {
    $unset: {
        ['profilesInfo.' + id]: ''
    }
}

return updateModel(modelId, update)
    .then(function(ret) {
        console.log('DELETE', ret)
        return ret.value;
    })
}

exports.addProfile = function(id, modelId) {
var update = {
    $set: {
        ['profilesInfo.' + id]: {
            _id: id,
            name: id,
            errors: []
        }
    }
}

return updateModel(modelId, update)
    .then(function(ret) {
        console.log('ADD', ret)
        return ret.value;
    })
}

exports.renameProfile = function(id, name, modelId) {
var update = {
    $set: {
        ['profilesInfo.' + id + '.name']: name
    }
}

return updateModel(modelId, update)
    .then(function(ret) {
        console.log('RENAME', ret)
        return ret.value;
    })
}

function updateModel(id, update) {
    return model
        .findAndModify({
            _id: ObjectID(id)
        },
            [],
            update,
            {
                new: true
            }
    )
}