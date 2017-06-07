var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var model;
var MODELS;

exports.create = function(mdl, MDL) {
model = mdl;
MODELS = MDL;

return {
    getClass: getClass,
    getClassGraph: getClassGraph,
    getClassesForPackage: getClassesForPackage,
    getAllOfType: getAllOfType,
    getPackageGraph: getPackageGraph,
    getProjection: getProjection
}
}

var minProjection = ['localId', 'name', 'model', 'type', 'profiles', 'properties.profiles', 'editable'];

function getProjection() {
    return minProjection.concat([].slice.call(arguments)).reduce(function(prj, key) {
        prj[key] = 1;
        return prj;
    }, {})
}

function getClassGraph(id, modelId, subNotSuper, prjctn = {}, filter = {}) {
    var projection = Object.assign({
        localId: 1,
        editable: 1,
        'properties._id': 1,
        'properties.typeId': 1,
        'properties.optional': 1
    }, prjctn);

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

function getClass(id, modelId) {
    return model
        .findOne({
            localId: id,
            model: ObjectID(modelId)
        }, {
            localId: 1,
            'properties._id': 1,
            "properties.typeId": 1,
            'properties.optional': 1
        })
}

function getClassesForPackage(id, modelId, recursive, filter = {}) {
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

    return model
        .find(query)
        .project(projection)
        .toArray();
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