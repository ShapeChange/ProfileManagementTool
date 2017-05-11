var Promise = require("bluebird");

var MODELS = 'models';
var model;

exports.create = function(mdl) {
model = mdl;

return {
    getProfileUpdatesForProperty: getProfileUpdatesForProperty,
    getProfileUpdatesForClass: getProfileUpdatesForClass
}
}

function getProfileUpdatesForProperty(clsId, prpId, modelId, profile, include) {

    return getClass(clsId, modelId)
        .then(function(cls) {
            var typeId;
            var update = include ? {
                $addToSet: {}
            } : {
                $pull: {}
            };

            cls.properties.forEach(function(prp, i) {
                if (prpId === prp._id) {
                    if (include) {
                        update['$addToSet']['properties.' + i + '.profiles'] = profile;
                    } else {
                        update['$pull']['properties.' + i + '.profiles'] = profile;
                    }
                    typeId = prp.typeId;
                }
            })

            var updates = Promise.all([updateClass(cls.localId, modelId, update)]);

            if (include && typeId) {
                updates = Promise.join(updates, getProfileUpdatesForClass(typeId, modelId, profile, include), function(updates1, updates2) {
                    return updates1.concat(updates2);
                })
            }

            return updates;
        })
}

function getProfileUpdatesForClass(id, modelId, profile, include) {

    // for include get super classes, for exclude get sub classes
    return getClassGraph(id, modelId, !include)
        .then(function(classes) {
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

                cls.properties.forEach(function(prp, i) {
                    if (include && !prp.optional) {
                        update['$addToSet']['properties.' + i + '.profiles'] = profile;
                    }
                })

                return updateClass(cls.localId, modelId, update)
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

                    return updateClass(cls.localId, modelId, update)
                })
            })
    }

    return Promise.resolve([]);
}

function updateClass(id, modelId, update) {
    return model
        .findAndModify({
            localId: id,
            model: modelId
        },
            [],
            update,
            {
                new: true,
                fields: {
                    localId: 1,
                    type: 1,
                    profiles: 1,
                    'properties.profiles': 1
                }
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
                    model: modelId
                }
            },
            {
                $facet: {

                    orig: [
                        {
                            $project: projection
                        }
                    ],
                    stypes: [
                        {
                            $graphLookup: {
                                from: MODELS,
                                startWith: subNotSuper ? '$localId' : '$supertypes',
                                connectFromField: subNotSuper ? 'localId' : 'supertypes',
                                connectToField: subNotSuper ? 'supertypes' : 'localId',
                                as: "inheritanceTree",
                                restrictSearchWithMatch: {
                                    model: modelId
                                }
                            }
                        },
                        {
                            $unwind: "$inheritanceTree"
                        },
                        {
                            $replaceRoot: {
                                newRoot: "$inheritanceTree"
                            }
                        },
                        {
                            $project: projection
                        }
                    ]
                }
            }
        ])
        .toArray()
        .then(function(supertypes) {
            // TODO: merge in aggregation stage
            var st = supertypes[0].orig.concat(supertypes[0].stypes);
            return st;
        });
}

function getClass(id, modelId) {
    return model
        .findOne({
            localId: id,
            model: modelId
        }, {
            localId: 1,
            'properties._id': 1,
            "properties.typeId": 1,
            'properties.optional': 1
        })
}

function getAllOfType(typeId, modelId) {
    return model
        .find({
            type: 'cls',
            model: modelId,
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
