var Promise = require("bluebird");

var modelReader;
var profileWriter;

exports = module.exports = createProfileEditor;

function createProfileEditor(mr, pw) {
    modelReader = mr;
    profileWriter = pw;

    return {
        getProfileUpdatesForProperty: getProfileUpdatesForProperty,
        getProfileUpdatesForClass: getProfileUpdatesForClass,
        getProfileUpdatesForPackage: getProfileUpdatesForPackage,
        getEditableUpdatesForPackage: getEditableUpdatesForPackage,
        getProfileParameterUpdates: getProfileParameterUpdates
    }
}

function getEditableUpdatesForPackage(id, modelId, editable, recursive) {

    var updates = Promise.all([profileWriter.putPackageUpdate(id, modelId, {
        $set: {
            editable: editable
        }
    })]);

    if (recursive) {
        var updates2 = modelReader.getPackageGraph(id, modelId)
            .then(function(pkgs) {
                return Promise.map(pkgs, function(pkg) {
                    return profileWriter.putPackageUpdate(pkg._id, modelId, {
                        $set: {
                            editable: editable
                        }
                    })
                })
            })

        updates = Promise.join(updates, updates2, function(updates1, updates2) {
            return updates1.concat(updates2);
        })
    }


    return modelReader.getClassesForPackage(id, modelId, recursive)
        .then(function(classes) {
            console.log('EDIT', classes);
            var updatesClass = Promise.map(classes, function(cls) {
                return profileWriter.putClassUpdate(cls.localId, modelId, {
                    $set: {
                        editable: editable
                    }
                })
            })

            return Promise.join(updates, updatesClass, function(updates1, updates2) {
                return updates1.concat(updates2);
            })
        })
}

function getProfileParameterUpdates(clsId, prpId, modelId, profile, parameter) {

    var update

    return modelReader.getClass(clsId, modelId)
        .then(function(cls) {

            if (prpId) {
                cls.properties.forEach(function(prp, index) {
                    if (prpId === prp._id) {
                        update = buildPropertyParameterUpdate(parameter, profile, index)
                    }
                })
            } else {
                update = buildPropertyParameterUpdate(parameter, profile)
            }
            console.log('UPD3', update)

            return Promise.all([profileWriter.putClassUpdate(clsId, modelId, update)]);
        })
}

// TODO: doesn't buildClassesUpdate have to call this for the typeId follow-up ??
function getProfileUpdatesForProperty(clsId, prpId, modelId, profile, include) {

    var update = {}

    var propertyFilter = function(prp) {
        return prpId === prp._id;
    };

    var propertyHandler = function(update, prp, index) {
        if (propertyFilter(prp)) {
            /*if (include) {
                update['$addToSet']['properties.' + i + '.profiles'] = profile;
            } else {
                update['$pull']['properties.' + i + '.profiles'] = profile;
            }*/
            buildPropertyUpdate(update, profile, include, index)
        }
    }.bind(this, update);

    return modelReader.getClass(clsId, modelId)
        .then(function(cls) {
            var updatesType = buildPropertiesUpdate(cls.properties || [], cls.localId, modelId, profile, include, propertyHandler, propertyFilter);


            var updates = Promise.all([profileWriter.putClassUpdateProfile(clsId, modelId, update)]);

            return Promise.join(updates, updatesType, function(updates1, updates2) {
                return updates1.concat(updates2);
            })
        })
}

function getProfileUpdatesForClass(id, modelId, profile, include, onlyMandatory = true, onlyChildren = false, ascendInheritanceTree = false, visitedClassIds = []) {

    var propertyFilter = function(prp) {
        return !onlyMandatory || !prp.optional;
    };

    if (onlyChildren) {

        var cls = ascendInheritanceTree ? modelReader.getClassGraph(id, modelId, false, {}, {
            editable: true
        }) : modelReader.getClass(id, modelId)

        return cls
            .then(function(cls) {
                return ascendInheritanceTree ? cls : [cls]
            })
            .then(function(clss) {

                return Promise.map(clss, function(cls) {
                    var update = {}

                    var propertyHandler = function(update, prp, index) {
                        if (include && onlyMandatory && !prp.optional) {
                            buildPropertyUpdate(update, profile, include, index)
                        } else if (include && !onlyMandatory) {
                            buildPropertyUpdate(update, profile, include, index)
                        } else if (!include && onlyMandatory && prp.optional) {
                            buildPropertyUpdate(update, profile, include, index)
                        } else if (!include && !onlyMandatory) {
                            buildPropertyUpdate(update, profile, include, index)
                        }
                    }.bind(this, update);

                    var updatesType = buildPropertiesUpdate(cls.properties || [], cls.localId, modelId, profile, include, propertyHandler, propertyFilter);

                    var updates = Promise.all([]);
                    if (update && Object.keys(update).length)
                        updates = Promise.all([profileWriter.putClassUpdateProfile(cls.localId, modelId, update)]);

                    return Promise.join(updates, updatesType, function(updates1, updates2) {
                        return updates1.concat(updates2);
                    })

                })
                    .then(function(classes) {
                        return [].concat.apply([], classes);
                    })

            })
    }

    var propertyHandler = function(update, prp, index) {
        if ((include && !prp.optional) || !include) {
            //update['$addToSet']['properties.' + i + '.profiles'] = profile;
            buildPropertyUpdate(update, profile, include, index)
        }
    };

    // for include get super classes, for exclude get sub classes
    return modelReader.getClassGraph(id, modelId, !include)
        .then(function(classes) {
            return classes.filter(function(cls) {
                return cls.editable
            })
        })
        .then(function(classes) {
            var classIds = classes.map(function(cls) {
                return cls.localId;
            })
            visitedClassIds.push(...classIds);

            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds);
        })
}

function getProfileUpdatesForPackage(id, modelId, profile, include, onlyMandatory, recursive) {

    var propertyFilter = function(prp) {
        return !onlyMandatory || !prp.optional;
    };

    var propertyHandler = function(update, prp, index) {
        if (include && onlyMandatory && !prp.optional) {
            buildPropertyUpdate(update, profile, include, index)
        } else if (include && !onlyMandatory) {
            buildPropertyUpdate(update, profile, include, index)
        } else if (!include) {
            buildPropertyUpdate(update, profile, include, index)
        }
    };

    return modelReader.getClassesForPackage(id, modelId, recursive, !include, {
        editable: true
    })
        .then(function(classes) {
            var classIds = classes.map(function(cls) {
                return cls.localId;
            })

            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, classIds);
        })
}

function getProfileUpdatesForType(id, modelId, profile, include) {

    if (!include) {
        return modelReader.getAllOfType(id, modelId)
            .then(function(classesOfType) {
                return classesOfType.filter(function(cls) {
                    return cls.editable
                })
            })
            .then(function(classesOfType) {

                return Promise.map(classesOfType, function(cls) {
                    /*var update = {
                        $pull: {
                        }
                    };*/
                    var update = {};

                    cls.properties.forEach(function(prp, index) {
                        if (!include && prp.optional) {
                            //update['$pull']['properties.' + i + '.profiles'] = profile;
                            buildPropertyUpdate(update, profile, include, index)
                        }
                    })

                    return profileWriter.putClassUpdateProfile(cls.localId, modelId, update)
                })
            })
    }

    return Promise.resolve([]);
}

function buildPropertiesUpdate(properties, clsId, modelId, profile, include, propertyHandler, propertyFilter, ascendInheritanceTree = false, visitedClassIds = []) {
    /*var update = include ? {
        $addToSet: {}
    } : {
        $pull: {}
    };*/
    //var update = {};

    //properties.forEach(propertyHandler.bind(this, update));

    //var updates = Promise.all([profileWriter.putClassUpdate(clsId, modelId, update)]);

    properties.forEach(propertyHandler)
    var updates = Promise.resolve([]);

    if (include) {
        var filteredProperties = propertyFilter ? properties.filter(propertyFilter) : properties;

        var typeIds = filteredProperties.reduce(function(tids, prp) {
            if (tids.indexOf(prp.typeId) === -1) {
                tids.push(prp.typeId);
            }
            return tids;
        }, []);

        typeIds = typeIds.filter(function(clsid) {
            return visitedClassIds.indexOf(clsid) === -1
        });
        visitedClassIds.push(...typeIds)

        var updatesType = Promise.map(typeIds, function(typeId) {
            return getProfileUpdatesForClass(typeId, modelId, profile, include, true, false, ascendInheritanceTree, visitedClassIds)
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

function buildClassUpdate(cls, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds, projection) {

    var update = {
        profiles: {
            [profile]: include
        }
    };

    var updates = buildPropertiesUpdate(cls.properties || [], cls.localId, modelId, profile, include, propertyHandler.bind(this, update), propertyFilter, false, visitedClassIds)
        .then(function(updatesTypes) {

            var updatesClass = Promise.all([profileWriter.putClassUpdateProfile(cls.localId, modelId, update, projection)]);

            return Promise.join(updatesClass, updatesTypes, function(updates1, updates2) {
                return updates1.concat(updates2);
            })
        });

    if (!include) {
        var updatesType = getProfileUpdatesForType(cls.localId, modelId, profile, include)

        return Promise.join(updates, updatesType, function(updates1, updates2) {
            return updates1.concat(updates2);
        })
    }

    return updates;
}

function buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds, projection) {
    var updates = Promise.map(classes, function(cls) {
        /*var update = include ? {
            $addToSet: {
                profiles: profile
            }
        } : {
            $pull: {
                profiles: profile
            }
        };*/

        return buildClassUpdate(cls, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds, projection)

        //cls.properties.forEach(propertyHandler.bind(this, update))

    //return profileWriter.putClassUpdate(cls.localId, modelId, update, projection)
    })
        .then(function(classesUpdate) {
            return [].concat.apply([], classesUpdate);
        })

    /*if (!include) {
        var updatesType = Promise.map(classes, function(cls) {
            return getProfileUpdatesForType(cls.localId, modelId, profile, include)
        })
            .then(function(classesOfType) {
                return [].concat.apply([], classesOfType);
            })

        return Promise.join(updates, updatesType, function(updates1, updates2) {
            return joinUpdates(updates1.concat(updates2));
        })
    }*/


    return updates;
}

function buildPropertyUpdate(update, profile, include, index) {
    const key = 'properties.' + index + '.profiles';

    if (!update[key])
        update[key] = {};

    update[key][profile] = include;
}

function buildPropertyParameterUpdate(parameter, profile, index) {
    const key = Object.keys(parameter)[0];
    let upd;

    if (index || index === 0) {
        upd = 'properties.' + index + '.profileParameters.' + profile + '.' + key;
    } else {
        upd = 'profileParameters.' + profile + '.' + key;
    }

    return {
        $set: {
            [upd]: parameter[key]
        }
    };
}

function joinUpdates(updates, joinedUpdates = {}) {
    return updates.reduce(function(joined, upd) {
        return Object.assign(joined, upd);
    }, joinedUpdates);
}



