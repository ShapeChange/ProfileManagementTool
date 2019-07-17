var Promise = require("bluebird");
const util = require('util')

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
            .then(function (pkgs) {
                var updatesPkg = Promise.mapSeries(pkgs, function (pkg) {
                    return profileWriter.putPackageUpdate(pkg._id, modelId, {
                        $set: {
                            editable: editable
                        }
                    })
                })

                var updatesClass = Promise.mapSeries(pkgs, function (pkg) {
                    return modelReader.getClassesForPackage(pkg._id, modelId)
                        .then(function (classes) {
                            console.log('EDIT', pkg._id, classes.length, process.memoryUsage().heapUsed);
                            return Promise.mapSeries(classes, function (cls) {
                                return profileWriter.putClassUpdate(cls.localId, modelId, {
                                    $set: {
                                        editable: editable
                                    }
                                })
                            })
                        })
                        .then(function (classes) {
                            console.log('EDITED', pkg._id, classes.length, process.memoryUsage().heapUsed);
                            return classes
                        })
                })

                return Promise.join(updatesPkg, updatesClass, function (updates1, updates2) {
                    console.log('MERGE', updates1.length, updates2.length);
                    var updates3 = updates2.reduce(function (joined, item) {
                        return joined.concat(item);
                    }, [])

                    console.log('MERGE', updates1.length, updates2.length, updates3.length);
                    return updates1.concat(updates3);
                })
            })

        updates = Promise.join(updates, updates2, function (updates1, updates2) {
            return updates1.concat(updates2);
        })
    }

    return updates


    /*return modelReader.getClassesForPackage(id, modelId, recursive)
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
        })*/
}

function getProfileParameterUpdates(clsId, prpId, modelId, profile, parameter) {

    var update

    return modelReader.getClass(clsId, modelId)
        .then(function (cls) {

            if (prpId) {
                cls.properties.forEach(function (prp, index) {
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
    var visitedClassIds = []

    var propertyFilter = function (prp) {
        return prpId === prp._id;
    };

    var propertyHandler = function (update, prp, index) {
        if (propertyFilter(prp)) {
            /*if (include) {
                update['$addToSet']['properties.' + i + '.profiles'] = profile;
            } else {
                update['$pull']['properties.' + i + '.profiles'] = profile;
            }*/
            buildPropertyUpdate(update, profile, include, index)
        }
    }.bind(this, update);

    return modelReader.getClass(clsId, modelId, {
        isMeta: 1,
        isReason: 1,
        'properties.associationId': 1
    })
        .then(function (cls) {
            var updatesType = buildPropertiesUpdate(cls.properties || [], cls.localId, modelId, profile, include, propertyHandler, propertyFilter, false, visitedClassIds, cls.isReason);

            var updatesAssociation = []
            const prp = cls.properties && cls.properties.find(propertyFilter);
            if (prp && prp.associationId) {
                updatesAssociation = getProfileUpdatesForAssociation(prp.associationId, modelId, profile, include, visitedClassIds, propertyFilter, true);
                console.log('PASS', cls, updatesAssociation)
            }

            var updates = Promise.all([profileWriter.putClassUpdateProfile(clsId, modelId, update)]);

            return Promise.join(updates, updatesType, updatesAssociation, function (updates1, updates2, updates3) {
                return updates1.concat(updates2, updates3);
            })
        })
}

function getProfileUpdatesForClass(id, modelId, profile, include, onlyMandatory = true, onlyChildren = false, ascendInheritanceTree = false, visitedClassIds = []) {

    var propertyFilter = function (prp) {
        return !onlyMandatory || !prp.optional;
    };

    if (onlyChildren) {

        var cls = ascendInheritanceTree ? modelReader.getClassGraph(id, modelId, false, {
            isMeta: 1,
            isReason: 1
        }, {
                editable: true
            }) : modelReader.getClass(id, modelId)

        return cls
            .then(function (cls) {
                return ascendInheritanceTree ? cls : [cls]
            })
            .then(function (clss) {

                return Promise.map(clss, function (cls) {
                    var update = {}

                    var propertyHandler = function (update, prp, index) {
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

                    var updatesType = buildPropertiesUpdate(cls.properties || [], cls.localId, modelId, profile, include, propertyHandler, propertyFilter, false, [], cls.isReason);

                    var updates = Promise.all([]);
                    if (update && Object.keys(update).length)
                        updates = Promise.all([profileWriter.putClassUpdateProfile(cls.localId, modelId, update)]);

                    return Promise.join(updates, updatesType, function (updates1, updates2) {
                        return updates1.concat(updates2);
                    })

                })
                    .then(function (classes) {
                        return [].concat.apply([], classes);
                    })

            })
    }

    var propertyHandler = function (update, prp, index) {
        if ((include && !prp.optional) || !include) {
            //update['$addToSet']['properties.' + i + '.profiles'] = profile;
            buildPropertyUpdate(update, profile, include, index)
        }
    };

    // for include get super classes, for exclude get sub classes
    return modelReader.getClassGraph(id, modelId, !include, {
        isMeta: 1,
        isReason: 1
    })
        .then(function (classes) {
            return classes.filter(function (cls) {
                return cls.editable
            })
        })
        .then(function (classes) {
            var classIds = classes.map(function (cls) {
                return cls.localId;
            })
            visitedClassIds.push(...classIds);

            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds);
        })
        .then(function (updates) {
            const associations = updates
                .filter(update => {
                    return update.value && update.value.type === 'cls' && update.value.associationId
                })
                .map(update => {
                    console.log('ASSOC', update.value)
                    return getProfileUpdatesForAssociation(update.value.associationId, modelId, profile, include, visitedClassIds, propertyFilter);
                })
                .reduce(function (joined, item) {
                    return joined.concat(item);
                }, [])

            if (associations.length) {
                console.log('ASS5', associations)

                return Promise.all(associations)
                    .then(updates2 => {
                        const up = updates2.reduce(function (joined, item) {
                            return joined.concat(item);
                        }, [])

                        return updates.concat(up);
                    })

                    //return Promise.all(updates.concat(associations || []));
                    /*return Promise.join(updates, associations, function (updates1, updates2) {
                        return updates1.concat(updates2);
                    })*/
                    .then(function (classes) {
                        console.log('ASS6', classes)
                        return classes
                    });
            }

            return updates;
        })
}

function getProfileUpdatesForAssociation(id, modelId, profile, include, visitedClassIds, propertyFilter = () => false, onlyAssociationClass = false) {
    var propertyHandler = function (update, prp, index) {
        if ((include && !prp.optional) || !include) {
            //update['$addToSet']['properties.' + i + '.profiles'] = profile;
            buildPropertyUpdate(update, profile, include, index)
        }
    };

    var propertyHandler2 = function (update, prp, index) {
        //if ((include && !prp.optional) || !include) {
        //update['$addToSet']['properties.' + i + '.profiles'] = profile;
        buildPropertyUpdate(update, profile, include, index)
        //}
    };

    return modelReader.getClass(id, modelId, { end1: 1, end2: 1, assocClassId: 1 })
        .then(function (ass) {
            console.log('ASS', ass)
            const ends = [];
            if (onlyAssociationClass && ass.assocClassId) {
                ends.push(modelReader.getClass(ass.assocClassId, modelId));
            }
            if (!onlyAssociationClass || !include) {

                if (ass.end1 && ass.end1.ref) {
                    ends.push(getClassByProperty(ass.end1.ref, modelId));
                }
                if (ass.end2 && ass.end2.ref) {
                    ends.push(getClassByProperty(ass.end2.ref, modelId));
                }
            }
            return Promise.all(ends)
        })
        .then(function (classes) {
            console.log('ASS2', classes)
            return classes.filter(function (cls) {
                return cls.editable
            })
        })
        .then(function (classes) {
            console.log('ASS3', util.inspect(classes, false, null))
            var classIds = classes.map(function (cls) {
                return cls.localId;
            })
            visitedClassIds.push(...classIds);

            if (onlyAssociationClass) {
                if (include) {
                    var propertyFilter2 = function (prp) {
                        return !prp.optional;
                    };

                    return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter2, visitedClassIds);
                } else {
                    if (classes.length > 1) {
                        let disableAssocClass = false;
                        for (var i = 1; i < classes.length; i++) {
                            const reverseProp = classes[i].properties.find(prp => !propertyFilter(prp) && prp.associationId === id);
                            console.log('REVERSE', reverseProp);
                            if (reverseProp && !reverseProp.profiles.some(pr => pr === profile)) {
                                disableAssocClass = true;
                            }
                        }
                        if (disableAssocClass) {
                            return buildClassesUpdate([classes[0]], modelId, profile, include, propertyHandler2, propertyFilter, visitedClassIds);
                        }
                    }
                    return []
                }
            } else {
                if (include) {
                    const propertyFilter2 = prp => propertyFilter(prp) || prp.associationId == id

                    return buildClassesUpdate(classes, modelId, profile, include, propertyHandler2, propertyFilter2, visitedClassIds);
                } else {
                    const propertyFilter2 = prp => prp.associationId == id

                    return Promise.all(classes.map(cls => {
                        const prp = cls.properties.find(propertyFilter2);
                        console.log('PASS2', cls.localId, prp && prp._id)
                        if (!prp) return [];
                        return getProfileUpdatesForProperty(cls.localId, prp._id, modelId, profile, include, propertyHandler, propertyFilter2, false, visitedClassIds);
                    }))
                        .then(updates2 => {
                            console.log('PASS3', updates2)
                            return updates2.reduce(function (joined, item) {
                                return joined.concat(item);
                            }, [])
                        })

                }
            }
        })
        .then(function (classes) {
            console.log('ASS4', classes)
            return classes
        });
}

function getClassByProperty(id, modelId) {
    return modelReader.getClassByProperty(id, modelId, {
        'properties.associationId': 1
    }, {
            'properties.localId': id
        })
}

function getProfileUpdatesForPackage(id, modelId, profile, include, onlyMandatory, recursive) {

    var propertyFilter = function (prp) {
        return !onlyMandatory || !prp.optional;
    };

    var propertyHandler = function (update, prp, index) {
        if (include && onlyMandatory && !prp.optional) {
            buildPropertyUpdate(update, profile, include, index)
        } else if (include && !onlyMandatory) {
            buildPropertyUpdate(update, profile, include, index)
        } else if (!include) {
            buildPropertyUpdate(update, profile, include, index)
        }
    };

    var filter = {
        editable: true
    }
    var pr;

    if (recursive) {
        pr = modelReader.getPackageGraph(id, modelId)
            .then(function (pkgs) {
                return Promise.mapSeries(pkgs, function (pkg) {
                    return modelReader.getClassesForPackage(pkg._id, modelId, false, !include, filter, {
                        isMeta: 1,
                        isReason: 1
                    })
                })
            })
            .then(function (classes) {
                return classes.reduce(function (joined, item) {
                    return joined.concat(item);
                }, [])
            })
            .then(function (clss) {
                const ids = [];
                return clss.filter(function (cls) {
                    if (ids.indexOf(cls._id.toHexString()) === -1) {
                        ids.push(cls._id.toHexString())
                        return true
                    }
                    return false
                });
            })
    } else {
        pr = modelReader.getClassesForPackage(id, modelId, recursive, !include, filter, {
            isMeta: 1,
            isReason: 1
        })
    }

    return pr
        .then(function (classes) {
            var classIds = classes.map(function (cls) {
                return cls.localId;
            })

            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, classIds);
        })
}

function getProfileUpdatesForType(id, modelId, profile, include) {

    if (!include) {
        return modelReader.getAllOfType(id, modelId, {}, {
            optional: true
        })
            .then(function (classesOfType) {
                return classesOfType.filter(function (cls) {
                    return cls.editable
                })
            })
            .then(function (classesOfType) {

                return Promise.map(classesOfType, function (cls) {
                    /*var update = {
                        $pull: {
                        }
                    };*/
                    var update = {};

                    cls.properties.forEach(function (prp, index) {
                        if (!include && prp.optional && prp.typeId === id) {
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

function buildPropertiesUpdate(properties, clsId, modelId, profile, include, propertyHandler, propertyFilter, ascendInheritanceTree = false, visitedClassIds = [], clsIsReason = false) {
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

        var typeIds = filteredProperties.reduce(function (tids, prp) {
            if (tids.indexOf(prp.typeId) === -1) {
                tids.push(prp.typeId);
            }
            return tids;
        }, []);

        typeIds = typeIds.filter(function (clsid) {
            return visitedClassIds.indexOf(clsid) === -1
        });
        visitedClassIds.push(...typeIds)

        var updatesType = Promise.map(typeIds, function (typeId) {
            return getProfileUpdatesForClass(typeId, modelId, profile, include, true, false, ascendInheritanceTree, visitedClassIds)
        })
            .then(function (classesOfType) {
                return [].concat.apply([], classesOfType);
            })

        return Promise.join(updates, updatesType, function (updates1, updates2) {
            return updates1.concat(updates2);
        })
    } else {
        // starting point is always a property with meta or reason type
        // that is why this method should be the only place to change
        // 
        // change all callers: , cls.isMeta || cls.isReason
        // 
        // get type classes that are meta or reason and not used (getAllOfType) by filter 
        // 
        // if cls from getProfileUpdatesForProperty isMeta or isReason
        // or if type isMeta or isReason
        // exclude types if not used elsewhere
        // see getProfileUpdatesForType for usage check

        var reversePropertyFilter = function (prp) {
            return prp.profiles && prp.profiles.indexOf(profile) > -1 && !propertyFilter(prp);
        };

        var filteredProperties = propertyFilter ? properties.filter(propertyFilter) : properties;
        var remainingProperties = propertyFilter ? properties.filter(reversePropertyFilter) : [];

        var typeIds = filteredProperties.reduce(function (tids, prp) {
            if (tids.indexOf(prp.typeId) === -1) {
                tids.push(prp.typeId);
            }
            return tids;
        }, []);

        var usedTypeIds = remainingProperties.reduce(function (tids, prp) {
            if (!clsIsReason && tids.indexOf(prp.typeId) === -1) {
                tids.push(prp.typeId);
            }
            return tids;
        }, []);

        typeIds = typeIds.filter(function (clsid) {
            return visitedClassIds.indexOf(clsid) === -1 && usedTypeIds.indexOf(clsid) === -1
        });
        visitedClassIds.push(...typeIds)

        var updatesType = Promise.filter(typeIds, function (typeId) {
            return modelReader.getClass(typeId, modelId, clsIsReason ? {} : {
                isMeta: 1,
                isReason: 1
            })
                .then(function (cls) {
                    return cls && (clsIsReason || (cls.isMeta || cls.isReason));
                })
        })
            .filter(function (typeId) {
                console.log('ISMETAORREASON: ', typeId)

                return modelReader.getAllOfType(typeId, modelId, {}, {
                    profiles: profile
                })
                    .then(function (classesOfType) {
                        return classesOfType.length === 0 || (classesOfType.length === 1 && classesOfType[0].localId === clsId);
                    })
            })
            .then(function (unusedMetaOrReasonTypeIds) {

                return Promise.map(unusedMetaOrReasonTypeIds, function (typeId) {
                    console.log('ISMETAORREASONANDUNUSED: ', typeId);

                    //return getProfileUpdatesForClass(typeId, modelId, profile, include, true, false, false, visitedClassIds)
                    var propertyFilter = function (prp) {
                        return !true || !prp.optional;
                    };

                    var propertyHandler = function (update, prp, index) {
                        if ((include && !prp.optional) || !include) {
                            //update['$addToSet']['properties.' + i + '.profiles'] = profile;
                            buildPropertyUpdate(update, profile, include, index)
                        }
                    };

                    return modelReader.getClass(typeId, modelId, {
                        isMeta: 1,
                        isReason: 1,
                        editable: 1
                    })
                        .then(function (cls) {
                            console.log('ISMETAORREASONANDUNUSED: ', typeId, cls);
                            return cls && cls.editable ? [cls] : []
                        })
                        .then(function (classes) {
                            var classIds = classes.map(function (cls) {
                                return cls.localId;
                            })
                            visitedClassIds.push(...classIds);

                            return buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds);
                        })


                })
                    .then(function (classesOfType) {
                        console.log('ISMETAORREASONANDUNUSED: ', unusedMetaOrReasonTypeIds, classesOfType.length);
                        return [].concat.apply([], classesOfType);
                    })
            })

        return Promise.join(updates, updatesType, function (updates1, updates2) {
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

    var updates = buildPropertiesUpdate(cls.properties || [], cls.localId, modelId, profile, include, propertyHandler.bind(this, update), propertyFilter, false, visitedClassIds, cls.isReason)
        .then(function (updatesTypes) {

            var updatesClass = Promise.all([profileWriter.putClassUpdateProfile(cls.localId, modelId, update, projection)]);

            return Promise.join(updatesClass, updatesTypes, function (updates1, updates2) {
                return updates1.concat(updates2);
            })
        });

    if (!include) {
        var updatesType = getProfileUpdatesForType(cls.localId, modelId, profile, include)

        return Promise.join(updates, updatesType, function (updates1, updates2) {
            return updates1.concat(updates2);
        })
    }

    return updates;
}

function buildClassesUpdate(classes, modelId, profile, include, propertyHandler, propertyFilter, visitedClassIds, projection) {
    var updates = Promise.mapSeries(classes, function (cls) {
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
        .then(function (classesUpdate) {
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
    const update = {};

    Object.keys(parameter).forEach(key => {

        //const key = Object.keys(parameter)[0];
        let upd;

        if (index || index === 0) {
            upd = 'properties.' + index + '.profileParameters.' + profile + '.' + key;
            update[upd] = parameter[key];
        } else {
            upd = 'profileParameters.' + profile + '.' + key;
            update[upd] = parameter[key];
        }
    });

    return {
        $set: update
    };
}

function joinUpdates(updates, joinedUpdates = {}) {
    return updates.reduce(function (joined, upd) {
        return Object.assign(joined, upd);
    }, joinedUpdates);
}



