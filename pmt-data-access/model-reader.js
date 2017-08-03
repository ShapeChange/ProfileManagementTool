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

var minProjection = ['localId', 'name', 'model', 'type', 'profiles', 'properties._id', 'properties.typeId', 'properties.optional', 'properties.name', 'properties.profiles', 'editable'];

function getProjection() {
    return minProjection.concat([].slice.call(arguments)).reduce(function(prj, key) {
        prj[key] = 1;
        return prj;
    }, {})
}

function getProjection2(projection) {
    return Object.assign(getProjection(), projection)
}

function getClassGraph(id, modelId, subNotSuper, prjctn = {}, filter = {}, match = false, maxDepth = false) {
    var projection = getProjection2(prjctn);

    match = match || {
        localId: id,
        model: ObjectID(modelId)
    }

    var graphLookup = {
        from: MODELS,
        startWith: subNotSuper ? '$localId' : '$supertypes',
        connectFromField: subNotSuper ? 'localId' : 'supertypes',
        connectToField: subNotSuper ? 'supertypes' : 'localId',
        as: "inheritanceTree",
        restrictSearchWithMatch: Object.assign({
            model: ObjectID(modelId)
        }, filter)
    }
    if (maxDepth || maxDepth === 0) {
        graphLookup.maxDepth = maxDepth
        console.log('MAXDEPTH', maxDepth)
    }

    return model
        .aggregate([
            {
                $match: match
            },
            {
                $graphLookup: graphLookup
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
                    element: 0,
                    'items.element': 0
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
                $project: {
                    element: 0,
                    'items.element': 0
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
                $project: getProjection()
            }
        ])
        .toArray()
        .then(function(details) {
            return details[0]
        })
}

function getClassesForPackage(id, modelId, recursive, subNotSuper, filter = {}, prjctn = {}) {
    var query = Object.assign({
        parent: ObjectID(id),
        type: 'cls',
        model: ObjectID(modelId)
    }, filter);

    var projection = getProjection2(prjctn);

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

function getAllOfType(typeId, modelId, projection = {}, filter = {}) {
    return model
        .find({
            type: 'cls',
            model: ObjectID(modelId),
            properties: {
                $elemMatch: Object.assign({
                    typeId: typeId
                }, filter)
            }
        })
        .project(getProjection2(projection))
        .toArray();
}

function getClasses(ids, modelId, projection = {}, filter = {}) {
    return model
        .find(Object.assign({
            type: 'cls',
            model: ObjectID(modelId),
            localId: {
                $in: ids
            }
        }, filter))
        .project(getProjection2(projection))
        .toArray()
}

function getClass(id, modelId, projection = {}, filter = {}) {
    return model
        .findOne(Object.assign({
            model: ObjectID(modelId),
            localId: id
        }, filter), getProjection2(projection))
}

function getClassByProperty(id, modelId, projection = {}, filter = {}) {
    return model
        .findOne(Object.assign({
            model: ObjectID(modelId)
        }, filter), getProjection2(projection))
}