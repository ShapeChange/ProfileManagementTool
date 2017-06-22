var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var model;
var MODELS;

exports.create = function(mdl, MDL) {
model = mdl;
MODELS = MDL;

return {
    getClass: getClass,
    getFlattenedClass: getFlattenedClass,
    getClassGraph: getClassGraph,
    getClassesForPackage: getClassesForPackage,
    getAllOfType: getAllOfType,
    getPackageGraph: getPackageGraph,
    getProjection: getProjection,
    getClassByProperty: getClassByProperty
}
}

var minProjection = ['localId', 'name', 'model', 'type', 'profiles', 'properties.profiles', 'editable'];

function getProjection() {
    return minProjection.concat([].slice.call(arguments)).reduce(function(prj, key) {
        prj[key] = 1;
        return prj;
    }, {})
}

function getClassGraph(id, modelId, subNotSuper, prjctn = {}, filter = {}, match = false) {
    var projection = Object.assign({
        localId: 1,
        editable: 1,
        'properties._id': 1,
        'properties.typeId': 1,
        'properties.optional': 1
    }, prjctn);

    match = match || {
        localId: id,
        model: ObjectID(modelId)
    }

    return model
        .aggregate([
            {
                $match: match
            },
            {
                $graphLookup: {
                    from: MODELS,
                    startWith: subNotSuper ? '$localId' : '$supertypes',
                    connectFromField: subNotSuper ? 'localId' : 'supertypes',
                    connectToField: subNotSuper ? 'supertypes' : 'localId',
                    as: "inheritanceTree",
                    restrictSearchWithMatch: Object.assign({
                        model: ObjectID(modelId)
                    }, filter)
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
                $project: projection
            }
        ])
        .toArray();
}

function getClassesForPackageGraph(id, modelId, projection, filter = {}) {
    return model
        .aggregate([
            {
                $match: {
                    _id: ObjectID(id),
                    model: ObjectID(modelId)
                }
            },
            {
                $graphLookup: {
                    from: MODELS,
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parent",
                    as: "elems",
                    restrictSearchWithMatch: Object.assign({
                        model: ObjectID(modelId)
                    }, filter)
                }
            },
            {
                $project: {
                    items: {
                        $filter: {
                            input: "$elems",
                            as: "elem",
                            cond: {
                                $eq: ["$$elem.type", "cls"]
                            }
                        }
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
                $project: projection
            }
        ])
        .toArray()
}

function getPackageGraph(id, modelId, projection) {
    return model
        .aggregate([
            {
                $match: {
                    _id: ObjectID(id),
                    model: ObjectID(modelId)
                }
            },
            {
                $graphLookup: {
                    from: MODELS,
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parent",
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
                $project: projection || getProjection()
            }
        ])
        .toArray()
}

function getFlattenedClass(id, modelId) {
    return model
        .aggregate([
            {
                $match: {
                    localId: id,
                    model: ObjectID(modelId)
                }
            },
            {
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
            },
            {
                $project: {
                    localId: 1,
                    'properties._id': 1,
                    "properties.typeId": 1,
                    'properties.optional': 1
                }
            }
        ])
        .toArray()
        .then(function(details) {
            return details[0]
        })
}

function getClassesForPackage(id, modelId, recursive, subNotSuper, filter = {}) {
    var query = Object.assign({
        parent: ObjectID(id),
        type: 'cls',
        model: ObjectID(modelId)
    }, filter);

    var projection = {
        localId: 1,
        'properties._id': 1,
        "properties.typeId": 1,
        'properties.optional': 1
    };

    if (recursive) {
        return getClassesForPackageGraph(id, modelId, projection, filter);
    }

    if (subNotSuper === undefined) {
        return model
            .find(query)
            .project(projection)
            .toArray();
    }

    return getClassGraph(null, modelId, subNotSuper, projection, filter, query)
        .then(function(clss) {
            const ids = [];
            return clss.filter(function(cls) {
                if (ids.indexOf(cls._id.toHexString()) === -1) {
                    ids.push(cls._id.toHexString())
                    return true
                }
                return false
            });
        })
}

function getAllOfType(typeId, modelId) {
    return model
        .find({
            type: 'cls',
            model: ObjectID(modelId),
            properties: {
                $elemMatch: {
                    typeId: typeId,
                    optional: true
                }
            }
        })
        .project({
            localId: 1,
            editable: 1,
            "properties.typeId": 1,
            "properties.optional": 1
        })
        .toArray();
}

function getClasses(ids, modelId, projection = null, filter = {}) {
    return model
        .find(Object.assign({
            type: 'cls',
            model: ObjectID(modelId),
            localId: {
                $in: ids
            }
        }, filter))
        .project(projection || getProjection())
        .toArray()
}

function getClass(id, modelId, projection = null, filter = {}) {
    return model
        .findOne(Object.assign({
            model: ObjectID(modelId),
            localId: id
        }, filter), projection || {
                localId: 1,
                'properties._id': 1,
                "properties.typeId": 1,
                'properties.optional': 1
            })
}

function getClassByProperty(id, modelId, projection = {}, filter = {}) {
    return model
        .findOne(Object.assign({
            model: ObjectID(modelId)
        }, filter), Object.assign({
            localId: 1,
            'properties._id': 1,
            'properties.name': 1,
            "properties.typeId": 1,
            'properties.optional': 1
        }, projection))
}