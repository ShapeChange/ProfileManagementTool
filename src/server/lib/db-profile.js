var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var MODELS = 'models';
var model;

exports.create = function(mdl) {
model = mdl;

return {
    getProfileUpdatesForProperty: getProfileUpdatesForProperty,
    getProfileUpdatesForClass: getProfileUpdatesForClass,
    getProfileUpdatesForPackage: getProfileUpdatesForPackage
}
}

// TODO: doesn't buildClassesUpdate have to call this for the typeId follow-up ??
function getProfileUpdatesForProperty(clsId, prpId, modelId, profile, include) {

    var propertyFilter = function(prp) {
        return prpId === prp._id;
    };

    var propertyHandler = function(update, prp, i) {
        if (propertyFilter(prp)) {
            if (include) {
                update['$addToSet']['properties.' + i + '.profiles'] = profile;
            } else {
                update['$pull']['properties.' + i + '.profiles'] = profile;
            }
        }
    };

    return getClass(clsId, modelId)
        .then(function(cls) {
            return buildPropertiesUpdate(cls.properties, cls.localId, modelId, profile, include, propertyHandler, propertyFilter);
        })
}

function getProfileUpdatesForClass(id, modelId, profile, include, onlyMandatory, onlyChildren) {

    if (onlyChildren) {
        var propertyHandler = function(update, prp, i) {
            if (include && onlyMandatory && !prp.optional) {
                update['$addToSet']['properties.' + i + '.profiles'] = profile;
            } else if (include && !onlyMandatory) {
                update['$addToSet']['properties.' + i + '.profiles'] = profile;
            } else if (!include && onlyMandatory && prp.optional) {
                update['$pull']['properties.' + i + '.profiles'] = profile;
            } else if (!include && !onlyMandatory) {
                update['$pull']['properties.' + i + '.profiles'] = profile;
            }
        };

        return getClass(id, modelId)
            .then(function(cls) {
                return buildPropertiesUpdate(cls.properties, cls.localId, modelId, profile, include, propertyHandler);
            })
    }

    var propertyHandler = function(update, prp, i) {
        if (include && !prp.optional) {
            update['$addToSet']['properties.' + i + '.profiles'] = profile;
        }
    };

    // for include get super classes, for exclude get sub classes
    return getClassGraph(id, modelId, !include)
        .then(function(classes) {
            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler);
        })
}

function getProfileUpdatesForPackage(id, modelId, profile, include, onlyMandatory, recursive) {

    var propertyHandler = function(update, prp, i) {
        if (include && onlyMandatory && !prp.optional) {
            update['$addToSet']['properties.' + i + '.profiles'] = profile;
        } else if (include && !onlyMandatory) {
            update['$addToSet']['properties.' + i + '.profiles'] = profile;
        } else if (!include) {
            update['$pull']['properties.' + i + '.profiles'] = profile;
        }
    };

    var projection = getProjection('parent');

    return getClassesForPackage(id, modelId, recursive)
        .then(function(classes) {
            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, projection);
        })
}

function getProfileUpdatesForType(id, modelId, profile, include) {

    if (!include) {
        return getAllOfType(id, modelId)
            .then(function(classesOfType) {

                return Promise.map(classesOfType, function(cls) {
                    var update = {
                        $pull: {
                        }
                    };

                    cls.properties.forEach(function(prp, i) {
                        if (!include && prp.optional) {
                            update['$pull']['properties.' + i + '.profiles'] = profile;
                        }
                    })

                    return putClassUpdate(cls.localId, modelId, update)
                })
            })
    }

    return Promise.resolve([]);
}

function buildPropertiesUpdate(properties, clsId, modelId, profile, include, propertyHandler, propertyFilter) {
    var update = include ? {
        $addToSet: {}
    } : {
        $pull: {}
    };

    properties.forEach(propertyHandler.bind(this, update));

    var updates = Promise.all([putClassUpdate(clsId, modelId, update)]);

    if (include) {
        var filteredProperties = propertyFilter ? properties.filter(propertyFilter) : properties;

        var typeIds = filteredProperties.reduce(function(tids, prp) {
            if (tids.indexOf(prp.typeId) === -1) {
                tids.push(prp.typeId);
            }
            return tids;
        }, []);

        var updatesType = Promise.map(typeIds, function(typeId) {
            return getProfileUpdatesForClass(typeId, modelId, profile, include)
        })
            .then(function(classesOfType) {
                return [].concat.apply([], classesOfType);
            })

        return Promise.join(updates, updatesType, function(updates1, updates2) {
            return updates1.concat(updates2);
        })
    }

    return updates;
}

function buildClassesUpdate(classes, modelId, profile, include, propertyHandler, projection) {
    var updates = Promise.map(classes, function(cls) {
        var update = include ? {
            $addToSet: {
                profiles: profile
            }
        } : {
            $pull: {
                profiles: profile
            }
        };

        cls.properties.forEach(propertyHandler.bind(this, update))

        return putClassUpdate(cls.localId, modelId, update, projection)
    })

    if (!include) {
        var updatesType = Promise.map(classes, function(cls) {
            return getProfileUpdatesForType(cls.localId, modelId, profile, include)
        })
            .then(function(classesOfType) {
                return [].concat.apply([], classesOfType);
            })

        return Promise.join(updates, updatesType, function(updates1, updates2) {
            return updates1.concat(updates2);
        })
    }


    return updates;
}

var minProjection = ['localId', 'type', 'profiles', 'properties.profiles'];

function getProjection() {
    return minProjection.concat([].slice.call(arguments)).reduce(function(prj, key) {
        prj[key] = 1;
        return prj;
    }, {})
}

function putClassUpdate(id, modelId, update, projection) {
    return model
        .findAndModify({
            localId: id,
            model: ObjectID(modelId)
        },
            [],
            update,
            {
                new: true,
                fields: projection || getProjection()
            }
    )
}

function getClassGraph(id, modelId, subNotSuper) {
    var projection = {
        localId: 1,
        'properties._id': 1,
        'properties.optional': 1
    };

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
                    restrictSearchWithMatch: {
                        model: ObjectID(modelId)
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
                $project: projection
            }
        ])
        .toArray();
}

function getClassesForPackageGraph(id, modelId, projection) {
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
                    restrictSearchWithMatch: {
                        model: ObjectID(modelId)
                    }
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

function getClassesForPackage(id, modelId, recursive) {
    var query = {
        parent: ObjectID(id),
        type: 'cls',
        model: ObjectID(modelId)
    };

    var projection = {
        localId: 1,
        'properties._id': 1,
        "properties.typeId": 1,
        'properties.optional': 1
    };

    if (recursive) {
        return getClassesForPackageGraph(id, modelId, projection);
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
            "properties.typeId": 1,
            "properties.optional": 1
        })
        .toArray();
}
