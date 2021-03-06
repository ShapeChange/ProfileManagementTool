var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;
const util = require('util')
//var dbProfile = require('./db-profile');
var profileEdit = require('./profile-edit');
var mr = require('./model-reader');
var pw = require('./profile-writer');
var urw = require('./user-rw');

var MODELS = 'models';
var USERS = 'users';
var ERRORS = 'errors';
var db;
var model;
var users;
var dbEdit;
var modelReader;
var profileWriter;
var userReaderWriter;
var cfg;

function setConnection(connection) {
    db = connection;
    model = db.collection(MODELS);
    users = db.collection(USERS);
    errors = db.collection(ERRORS);

    modelReader = mr.create(model, MODELS)
    profileWriter = pw.create(model, errors)
    userReaderWriter = urw.create(users)

    dbEdit = profileEdit(modelReader, profileWriter);

    const defaultIndexes = [{
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
    }, /*{
        key: {
            'descriptors.alias': 1
        }
    },*/ {
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
    },/* {
        key: {
            'properties.descriptors.alias': 1
        }
    }*/ /*, {
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
    }*/ ]

    const filterableDescriptors = cfg.get('app.search.descriptors');
    const filterableTaggedValues = cfg.get('app.search.taggedValues');


    const textIndex = {
        key: {},
        name: 'textSearchIndex',
        default_language: 'none'
    };
    filterableDescriptors.forEach(index => {
        textIndex.key[`descriptors.${index}`] = 'text';
        textIndex.key[`properties.descriptors.${index}`] = 'text';
    })
    filterableTaggedValues.forEach(index => {
        textIndex.key[`taggedValues.${index}`] = 'text';
        textIndex.key[`properties.taggedValues.${index}`] = 'text';
    })
    //console.log('FILTERABLE2', filterableDescriptors, filterableTaggedValues, textIndex);

    return model.createIndexes(defaultIndexes)
        .then(function (indexName) {
            console.log('Created indexes ', indexName)

            return model.createIndexes([textIndex])
                .then(function (indexName) {
                    return indexName
                }, function (error) {
                    console.log('RETRY', error)
                    // try to recreate text index
                    //if (error) {
                    return model.dropIndex(textIndex.name)
                        .then(function (indexName) {
                            console.log('Dropped indexes ', indexName)

                            return model.createIndexes([textIndex])
                        })
                    //}

                    return indexName
                })
        })
        .then(function (indexName) {
            console.log('Created indexes ', indexName)

            return users.createIndexes([{
                key: {
                    'name': 1
                },
                unique: true
            }])
        })
        .then(function (indexName) {
            console.log('Created indexes ', indexName)

            return errors.createIndexes([
                {
                    key: {
                        'model': 1
                    }
                },
                {
                    key: {
                        'profile': 1
                    }
                },
                {
                    key: {
                        'itemId': 1
                    }
                },
                {
                    key: {
                        'superId': 1
                    }
                },
                {
                    key: {
                        'typeId': 1
                    }
                },
                {
                    key: {
                        'msg': 1
                    }
                }
            ])
        })
        .then(function (indexName) {
            console.log('Created indexes ', indexName)
        })
        .catch(function (error) {
            console.log('Error on creating indexes: ', error)
        })

    return db;
}

exports.getModelReader = function () {
    return modelReader;
}

exports.getProfileWriter = function () {
    return profileWriter;
}

exports.getUserReaderWriter = function () {
    return userReaderWriter;
}

exports.connect = function (url, config) {
    if (db) {
        return Promise.resolve();
    }
    cfg = config;

    return MongoClient
        .connect(url, {
            promiseLibrary: Promise,
            poolSize: 5,
            loggerLevel: 'error'
        })
        .then(setConnection);
}

exports.getModelCollection = function () {
    return model;
}

exports.getUserCollection = function () {
    return users;
}

exports.getModels = function (owner) {
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

function getFilters(term, prefix) {
    const filterableDescriptors = cfg.get('app.search.descriptors');
    const filterableTaggedValues = cfg.get('app.search.taggedValues');
    //console.log('FILTERABLE2', filterableDescriptors, filterableTaggedValues);

    const keyPrefix = prefix ? `${prefix}.` : ''
    const regex = {
        $regex: `(?i)${term}`
    };

    const nameFilter = [{
        [`${keyPrefix}name`]: regex
    }]
    const descriptorFilters = filterableDescriptors.map(key => ({
        [`${keyPrefix}descriptors.${key}`]: regex
    }))
    const taggedValueFilters = filterableTaggedValues.map(key => ({
        [`${keyPrefix}taggedValues.${key}`]: regex
    }))

    return nameFilter.concat(descriptorFilters, taggedValueFilters);
}

//TODO: is descriptors.alias even set in the db for pkgs
exports.getPackages = function (modelId, filter) {
    const query = {
        type: 'pkg',
        model: ObjectID(modelId)
    }

    if (filter && filter !== '') {
        query.$or = getFilters(filter) /*[
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
        ]*/
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

exports.getClasses = function (modelId) {
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

exports.getFilteredPackages = function (modelId, filter) {

    if (!filter || filter === '') {
        return exports.getPackages(modelId)
            .then(function (pkgs) {
                return pkgs.toArray();
            })
    }

    var filteredPackageTree = exports.getPackages(modelId, filter)
        .then(function (pkgs) {
            return pkgs.toArray();
        })
        .then(function (pkgs) {
            return pkgs.map(function (pkg) {
                return pkg._id
            })
        })
        .then(function (pkgIds) {
            return getParentsForPackages(modelId, pkgIds)
        })


    var packagesForFilteredClasses = getFilteredClasses(modelId, filter)
        .then(function (classIds) {
            return getPackagesForClasses(modelId, classIds)
        })


    return Promise.join(filteredPackageTree, packagesForFilteredClasses, function (pkgs, pkgs2) {
        return pkgs.concat(pkgs2);
    })

        .then(function (pkgs) {
            const ids = [];
            return pkgs.filter(function (pkg) {
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
        .then(function (pkgs) {
            const ids = [];
            return pkgs.filter(function (pkg) {
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
        .then(function (pkgs) {
            const ids = [];
            return pkgs.filter(function (pkg) {
                if (ids.indexOf(pkg._id.toHexString()) === -1) {
                    ids.push(pkg._id.toHexString())
                    return true
                }
                return false
            });
        })
}

//TODO: from config
function getFilteredClasses(modelId, filter) {
    return Promise.resolve(
        model
            .find({
                type: 'cls',
                model: ObjectID(modelId),
                $or: getFilters(filter).concat(getFilters(filter, 'properties')) /*[
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
                ]*/
            })
            .project({
                parent: 1
            })
    ).then(function (classes) {
        return classes.toArray()
    }).then(function (classes) {
        return classes.map(function (cls) {
            return cls._id //.toHexString()
        })
    });
}

exports.getPackagesForParent = function (parent) {
    return Promise.resolve(
        model
            .find({
                type: 'pkg',
                parent: ObjectID(parent)
            })
    );
}

exports.getClassesForParent = function (parent) {
    return Promise.resolve(
        model
            .find({
                type: 'cls',
                parent: ObjectID(parent)
            })
    );
}

exports.getAssociationsForParent = function (parent) {
    return Promise.resolve(
        model
            .find({
                type: 'asc',
                parent: ObjectID(parent)
            })
    );
}

//TODO: from config
exports.getClassesForPackage = function (pkg, filter) {
    const query = {
        type: 'cls',
        parent: ObjectID(pkg)
    }

    if (filter && filter !== '') {
        query.$or = getFilters(filter).concat(getFilters(filter, 'properties')) /*[
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
        ]*/
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
                isReason: 1,
                associationId: 1
            })
            .sort({
                name: 1
            })
            .toArray()
            .then(function (classes) {
                if (filter && filter !== '') {
                    return classes.map(function (cls) {
                        cls.filterMatch = true;
                        return cls;
                    })
                }
                return classes;
            })
    );
}

exports.getDetails = function (id, modelId) {
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
    if (details && details.assocClassId)
        localids.push(details.assocClassId)
    if (details && details.properties)
        details.properties.reduce(function (ids, prp) {
            if (prp.typeId) ids.push(prp.typeId)
            if (prp.associationId) ids.push(prp.associationId)
            return ids;
        }, localids);
    if (flattenOninas && details.metaReasonClasses)
        details.metaReasonClasses.reduce(function (ids, cls) {
            return cls.properties.reduce(function (ids, prp) {
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
                end1: 1,
                end2: 1,
                assocClassId: 1,
                'properties.localId': 1,
                'properties.name': 1
            })
            .toArray()
            .then(function (resolvedIds) {

                if (details.supertypes)
                    details.supertypes = details.supertypes.map(function (st) {
                        return resolvedIds.find(function (tid) {
                            return tid.localId === st;
                        });
                    });
                if (details.subtypes)
                    details.subtypes = details.subtypes.map(function (st) {
                        return resolvedIds.find(function (tid) {
                            return tid.localId === st;
                        });
                    });
                if (details.associationId)
                    details.associationId = resolvedIds.find(function (tid) {
                        return tid.localId === details.associationId;
                    });
                if (details.assocClassId)
                    details.assocClassId = resolvedIds.find(function (tid) {
                        return tid.localId === details.assocClassId;
                    });
                if (details && details.end1 && details.end1.ref) {
                    var eid = details.end1.ref;

                    details.end1 = resolvedIds.find(function (tid) {
                        return tid.properties.some(prp => prp.localId === eid);
                    });
                    details.end1.properties = details.end1.properties.filter(prp => prp.localId === eid);
                }
                /*if (details && details.end1 && details.end1.parent && details.end1.parent === details.localId) {
                    if (details.properties.length && details.properties[0].associationId === details.localId) {
                        const { ...rest } = details;
                        delete rest.properties;
                        console.log('REST', rest)

                        details.properties[0].associationId = rest;
                    }

                    const { end1, end2, ...rest } = details;
                    console.log('REST2', rest)
                    details.end1 = rest;
                }*/
                if (details && details.end2 && details.end2.ref) {
                    var eid = details.end2.ref;
                    details.end2 = resolvedIds.find(function (tid) {
                        return tid.properties.some(prp => prp.localId === eid);
                    });
                    details.end2.properties = details.end2.properties.filter(prp => prp.localId === eid);
                }
                if (details.properties) {
                    if (flattenOninas && details.metaReasonClasses) {
                        resolvedIds = resolvedIds.concat(details.metaReasonClasses.map(function (t) {
                            return {
                                name: t.name,
                                localId: t.localId,
                                isAbstract: t.isAbstract,
                                isMeta: t.isMeta,
                                isReason: t.isReason
                            }
                        }))

                        details.properties = details.properties.map(function (prp) {
                            var metaReason = details.metaReasonClasses.find(function (t) {
                                return t.localId === prp.typeId
                            })

                            if (metaReason && metaReason.isMeta) {
                                metaReason = details.metaReasonClasses.find(function (t) {
                                    return metaReason.properties && t.localId === metaReason.properties[0].typeId
                                })
                            }

                            if (metaReason && metaReason.isReason && metaReason.properties) {
                                var value = metaReason.properties.find(function (p) {
                                    return !p.isNilReason
                                })

                                if (value) {
                                    prp.typeId = value.typeId
                                    prp.typeName = value.typeName
                                    prp.cardinality = _mergeCardinalities(prp.cardinality, value.cardinality)
                                }
                            }

                            return prp;
                        });

                        delete details.metaReasonClasses
                    }

                    details.properties = details.properties.map(function (prp) {
                        if (prp.typeId) {
                            prp.typeId = resolvedIds.find(function (tid) {
                                return tid.localId === prp.typeId;
                            });
                        }
                        if (prp.associationId /*&& typeof details.associationId === 'string'*/) {
                            console.log(prp.name, typeof prp.associationId, prp.associationId, resolvedIds)
                            prp.associationId = resolvedIds.find(function (tid) {
                                return tid.localId === prp.associationId;
                            });
                        }
                        /*if (prp.associationId && prp.associationId.end1 && prp.associationId.end1.ref) {
                            var eid = prp.associationId.end1.ref;

                            prp.associationId.end1 = resolvedIds.find(function (tid) {
                                return tid.properties.some(prp => prp.localId === eid);
                            });
                            prp.associationId.end1.properties = prp.associationId.end1.properties.filter(prp => prp.localId === eid);
                        }
                        if (prp.associationId && prp.associationId.end2 && prp.associationId.end2.ref) {
                            var eid = prp.associationId.end2.ref;

                            prp.associationId.end2 = resolvedIds.find(function (tid) {
                                return tid.properties.some(prp => prp.localId === eid);
                            });
                            prp.associationId.end2.properties = prp.associationId.end2.properties.filter(prp => prp.localId === eid);
                        }*/
                        return prp;
                    });
                }

                //recurse
                var recursions = [];

                // for association class
                if (details.associationId && typeof details.associationId === 'object') {
                    const recursive = {
                        model: details.model,
                        ...details.associationId
                    }
                    recursions.push(resolveIds(recursive).then(function (recursiveDetails) {
                        details.associationId = recursiveDetails;
                        return details;
                    }));
                }
                if (details.properties && details.properties.some(prp => prp.associationId && typeof prp.associationId === 'object')) {
                    details.properties.forEach(prp => {
                        if (prp.associationId) {
                            const recursive = {
                                model: details.model,
                                ...prp.associationId
                            }
                            recursions.push(resolveIds(recursive).then(recursiveDetails => {
                                prp.associationId = recursiveDetails;
                                return details;
                            }));
                        }
                    });
                }

                if (recursions.length) {
                    return Promise.all(recursions).then(results => { console.log('DET2', util.inspect(details, false, null)); return results[0] });
                }
                console.log('DET', util.inspect(details, false, null))
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

exports.getFlattenedClass = function (id, modelId, flattenInheritance, flattenOninas) {
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
        .then(function (details) {
            return resolveIds(details[0], flattenOninas)
        })
}

exports.getModel = function (id, owner) {
    return model
        .findOne({
            _id: ObjectID(id),
            owner: owner
        }, {
            element: 0
        })
        .then(function (mdl) {
            return errors
                .find({
                    model: ObjectID(id)
                })
                .toArray()
                .then(function (err) {
                    Object.keys(mdl.profilesInfo).forEach(function (prf) {
                        mdl.profilesInfo[prf].errors = err.filter(e => e.profile === prf);
                    })
                    return mdl;
                })
        })
}

exports.getFullModel = function (id) {
    return model
        .findOne({
            _id: ObjectID(id)
        })
}

exports.updatePackageProfile = function (clsId, modelId, profile, include, onlyMandatory, recursive) {


    return measure(dbEdit.getProfileUpdatesForPackage(clsId, modelId, profile, include, onlyMandatory, recursive));

}

exports.updateClassProfile = function (clsId, modelId, profile, include, onlyMandatory, onlyChildren, ascendInheritanceTree) {

    return measure(dbEdit.getProfileUpdatesForClass(clsId, modelId, profile, include, onlyMandatory, onlyChildren, ascendInheritanceTree));

}

exports.updatePropertyProfile = function (clsId, prpId, modelId, profile, include) {

    return measure(dbEdit.getProfileUpdatesForProperty(clsId, prpId, modelId, profile, include));

}

exports.updatePackageEditable = function (pkgId, modelId, editable, recursive) {


    return measure(dbEdit.getEditableUpdatesForPackage(pkgId, modelId, editable, recursive));

}

exports.updateProfileParameter = function (clsId, prpId, modelId, profile, parameter) {


    return measure(dbEdit.getProfileParameterUpdates(clsId, prpId, modelId, profile, parameter));

}

function measure(prms) {
    var start = Date.now();

    return prms
        .then(function (results) {
            console.log('took', Date.now() - start)
            return results;
        });
}

exports.close = function (force) {
    return db.close(force || false);
}

exports.deleteModel = function (id) {
    return model
        .deleteOne({
            _id: ObjectID(id)
        })
        .then(function (ret) {
            console.log('DELETE', ret.result)
            // do not wait for this, should happen async in the background
            model
                .deleteMany({
                    model: ObjectID(id)
                })
                .then(function (ret2) {
                    console.log('DELETE2', ret2.result)
                })

            errors
                .deleteMany({
                    model: ObjectID(id)
                })
                .then(function (ret3) {
                    console.log('DELETE3', ret3.result)
                })
        })
}

exports.deleteProfile = function (id, modelId) {
    var update = {
        $unset: {
            ['profilesInfo.' + id]: ''
        }
    }

    return updateModel(modelId, update)
        .then(function (ret) {
            console.log('DELETE', ret)

            errors
                .deleteMany({
                    model: ObjectID(modelId),
                    profile: id
                })
                .then(function (ret2) {
                    console.log('DELETE2', ret2.result)
                })

            return ret.value;
        })
}

exports.addProfile = function (id, description, modelId, errors) {
    var update = {
        $set: {
            ['profilesInfo.' + id]: {
                _id: id,
                name: id,
                description: description,
                errors: errors || []
            }
        }
    }

    return updateModel(modelId, update)
        .then(function (ret) {
            console.log('ADD', ret)
            return ret.value;
        })
}



exports.copyProfile = function (newProfile, description, modelId, copyFrom, errors) {

    return exports.addProfile(newProfile, description, modelId, errors)
        .then(function (mdl) {
            var cursor = model
                .find({
                    model: ObjectID(modelId),
                    $or: [
                        {
                            profiles: copyFrom
                        },
                        {
                            'properties.profiles': copyFrom
                        }
                    ]
                })
                .project({
                    "profiles": 1,
                    "properties.profiles": 1,
                    ["profileParameters." + copyFrom]: 1,
                    ["properties.profileParameters." + copyFrom]: 1
                })

            var requests = [];

            return new Promise(function (resolve, reject) {
                cursor.forEach(function (doc) {
                    var update = {
                        profiles: newProfile
                    }
                    var updateSet = {};
                    if (doc.profileParameters && doc.profileParameters[copyFrom])
                        updateSet['profileParameters.' + newProfile] = doc.profileParameters[copyFrom];

                    doc.properties.reduce(function (upd, prp, i) {
                        if (prp.profiles.indexOf(copyFrom) > -1) {
                            upd['properties.' + i + '.profiles'] = newProfile
                        }
                        if (prp.profileParameters && prp.profileParameters[copyFrom])
                            updateSet['properties.' + i + '.profileParameters.' + newProfile] = prp.profileParameters[copyFrom]
                        return upd;
                    }, update)

                    requests.push({
                        'updateOne': {
                            'filter': {
                                '_id': ObjectID(doc._id)
                            },
                            'update': {
                                '$addToSet': update
                            }
                        }
                    });
                    if (Object.keys(updateSet).length) {
                        requests.push({
                            'updateOne': {
                                'filter': {
                                    '_id': ObjectID(doc._id)
                                },
                                'update': {
                                    '$set': updateSet
                                }
                            }
                        });
                    }

                    if (requests.length === 500) {
                        //Execute per 500 operations and re-init
                        model.bulkWrite(requests)
                        requests = [];
                    }

                }, function (err) {
                    if (requests.length > 0) {
                        model.bulkWrite(requests)
                    }
                    if (err)
                        reject(err);
                    else
                        resolve(mdl);
                });
            })
        })
}

exports.renameProfile = function (id, name, description, modelId) {
    var update = {
        $set: {
            ['profilesInfo.' + id + '.name']: name,
            ['profilesInfo.' + id + '.description']: description
        }
    }

    return updateModel(modelId, update)
        .then(function (ret) {
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
