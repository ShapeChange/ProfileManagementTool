var ss = require('socket.io-stream');
var path = require('path');
var fs = require('fs');
var through2 = require('through2');
var intoStream = require('into-stream');
var mongoImport = process.env.NODE_ENV === 'production' ? require('pmt-io/mongo-import') : require('../../../pmt-io/mongo-import');
var mongoExport = process.env.NODE_ENV === 'production' ? require('pmt-io/mongo-export') : require('../../../pmt-io/mongo-export');
var validator = process.env.NODE_ENV === 'production' ? require('pmt-validation') : require('../../../pmt-validation');

var db;

exports.addRoutes = function(app, config, dbs, io) {

db = dbs;

io.on('connection', function(socket) {
    socket.on('action', function(action) {
        dispatch(socket, action);
    });

    ss(socket).on('import', function(stream, metadata) {
        dispatch(socket, {
            type: 'file/import',
            payload: {
                owner: 'unknown',
                stream: stream,
                metadata: metadata
            }
        });
    });

    ss(socket).on('export', function(stream, metadata) {
        dispatch(socket, {
            type: 'file/export',
            payload: {
                owner: 'unknown',
                stream: stream,
                metadata: metadata
            }
        });
    });
});

};

const actions = {
    'models/fetch': fetchModels,
    'model/fetch': fetchModel,
    'package/fetch': fetchPackage,
    'class/fetch': fetchClass,
    'file/import': importFile,
    'file/export': exportFile,
    'profile/update': updateProfile,
    'editable/update': updateEditable,
    'filter/apply': applyFilter
}

function dispatch(socket, action) {
    console.log(action);

    if (actions[action.type])
        actions[action.type](socket, action.payload);
}

function updateEditable(socket, update) {
    var pr = db.updatePackageEditable(update.id, update.modelId, update.editable, update.recursive);

    if (pr) {
        return pr
            .then(function(updatedPackages) {
                console.log('UPD0', updatedPackages)
                var uc = updatedPackages.map(function(cls) {
                    if (cls.ok && cls.value) {
                        return cls.value;
                    } else {
                        // TODO: error, also in catch, throw here
                        console.log('ERROR', cls)
                    }
                })
                console.log('UPD1', uc)
                socket.emit('action', {
                    type: 'editable/new',
                    payload: uc
                });
            })
    }
}

function updateProfile(socket, update) {
    var pr;

    if (update.type === 'pkg')
        pr = db.updatePackageProfile(update.id, update.modelId, update.profile, update.include, update.onlyMandatory, update.recursive);
    else if (update.type === 'cls') {
        if (update.profileParameters)
            pr = db.updateProfileParameter(update.id, null, update.modelId, update.profile, update.profileParameters);
        else
            pr = db.updateClassProfile(update.id, update.modelId, update.profile, update.include, update.onlyMandatory, update.onlyChildren, update.recursive);
    } else if (update.type === 'prp') {
        if (update.profileParameters)
            pr = db.updateProfileParameter(update.parent, update.id, update.modelId, update.profile, update.profileParameters);
        else
            pr = db.updatePropertyProfile(update.parent, update.id, update.modelId, update.profile, update.include);
    }

    if (pr) {
        return pr
            .then(function(updatedClasses) {
                //console.log('UPD0', updatedClasses)
                var uc = updatedClasses.map(function(cls) {
                    if (cls.ok && cls.value) {
                        cls.value._id = cls.value.localId;
                        return cls.value;
                    } else {
                        // TODO: error, also in catch, throw here
                        console.log('ERROR', cls)
                    }
                })
                return uc;
            })
            .then(function(updatedClasses) {
                console.log('UPD1', updatedClasses)
                return new Promise(function(resolve, reject) {

                    var checks = validator.createStream(db.getModelReader(), db.getProfileWriter(), update.profile, function() {
                        resolve(updatedClasses);
                    });


                    intoStream.obj(updatedClasses).pipe(checks)
                })
            })
            .then(function(updatedClasses) {
                if (update.type === 'pkg')
                    updatedClasses = updatedClasses.filter(function(cls) {
                        return cls.parent == update.id
                    })
                //console.log('UPD2', updatedClasses)
                socket.emit('action', {
                    type: 'profile/new',
                    payload: updatedClasses
                });

                return db.getModel(update.modelId)
            })
            .then(function(model) {
                socket.emit('action', {
                    type: 'model/fetched',
                    payload: {
                        fetchedModel: update.modelId,
                        model: model
                    }
                });
            })
    }
}

function importFile(socket, file) {
    console.log(file.metadata);
    var written = 0;
    var progress = 0;

    return mongoImport.importFile(db.getModelCollection(), file.stream, file.metadata, function(chunkLength) {
        written += chunkLength;

        var newProgress = Math.round((written / file.metadata.size) * 50);

        if (newProgress > progress) {
            progress = newProgress;

            socket.emit('action', {
                type: 'file/import/stats',
                payload: {
                    progress: progress
                }
            });
        }
    })
        .then(function(stats) {
            console.log('DONE', stats);

            return new Promise(function(resolve, reject) {

                var checks = validator.createStream(db.getModelReader(), db.getProfileWriter(), null, function() {
                    resolve(stats);
                });

                written = 0;
                var logger = through2.obj(function(obj, enc, cb) {
                    written++;

                    var newProgress = Math.round((written / stats.classes) * 50) + 50;

                    if (newProgress > progress) {
                        progress = newProgress;

                        socket.emit('action', {
                            type: 'file/import/stats',
                            payload: {
                                progress: progress
                            }
                        });
                    }

                    cb(null, obj);
                });

                db.getClasses(stats.model)
                    .then(function(cursor) {
                        cursor.pipe(logger).pipe(checks)
                    })
            });
        })
        .then(function(stats) {
            socket.emit('action', {
                type: 'file/import/done',
                payload: {
                    success: true,
                    metadata: file.metadata,
                    stats: stats
                }
            });
        })
        .then(function() {
            return fetchModels(socket, file.owner);
        });
}

function exportFile(socket, file) {

    return mongoExport.exportFile(db, file.stream, file.metadata.id)
        .then(function(stats) {
            console.log('DONE', stats);

            //console.log(JSON.stringify(stats.ids));

        /*socket.emit('action', {
            type: 'file/export/done',
            payload: {
                success: true,
                metadata: file.metadata,
                stats: stats
            }
        });*/
        })
}

function fetchModels(socket, owner) {
    return db.getModels(owner)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(models) {
            socket.emit('action', {
                type: 'models/fetched',
                payload: models
            });
        })
}

function fetchModel(socket, payload) {
    return fetchPackages(socket, payload.id, payload.filter)
        .then(function() {
            return db.getModel(payload.id)
                .then(function(details) {
                    return {
                        fetchedModel: payload.id,
                        model: details
                    }
                })
        })
        .then(function(payload) {
            socket.emit('action', {
                type: 'model/fetched',
                payload: payload
            });
        })
}

function fetchPackages(socket, mdl, filter) {
    return db.getFilteredPackages(mdl, filter)
        .then(function(pkgs) {
            return socket.emit('action', {
                type: 'packages/fetched',
                payload: pkgs
            });
        })
}

function fetchPackage(socket, payload) {
    return fetchPackageDetails(socket, payload.id)
        .then(function(details) {
            var filter;
            if (payload.filter && payload.filter !== '') {
                if (details.name.toLowerCase().indexOf(payload.filter) === -1 && !(details.descriptors && details.descriptors.alias && details.descriptors.alias.toLowerCase().indexOf(payload.filter) > -1)) {
                    // if filter does not match package, filter classes
                    filter = payload.filter;
                }
            }
            return fetchClasses(socket, payload.id, filter)
        })
}

function fetchClasses(socket, pkg, filter) {
    return db.getClassesForPackage(pkg, filter)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(classes) {
            classes.forEach(function(cls) {
                cls._id = cls.localId
            })
            return socket.emit('action', {
                type: 'classes/fetched',
                payload: classes
            });
        })
}

function fetchPackageDetails(socket, id) {
    return db.getDetails(id)
        .then(function(details) {
            socket.emit('action', {
                type: 'package/fetched',
                payload: {
                    fetchedPackage: id,
                    details: details
                }
            });
            return details;
        })
}

function fetchClass(socket, payload) {
    var cls = payload.flattenInheritance || payload.flattenOninas ? db.getFlattenedClass(payload.id, payload.modelId, payload.flattenInheritance, payload.flattenOninas) : db.getDetails(payload.id, payload.modelId)

    return cls
        .then(function(details) {
            if (details.type === 'cls' || details.type === 'asc') {
                details._id = details.localId
                if (payload.filter && payload.filter !== '') {
                    if (details.name.toLowerCase().indexOf(payload.filter) === -1 && !(details.descriptors && details.descriptors.alias && details.descriptors.alias.toLowerCase().indexOf(payload.filter) > -1)) {
                        details.properties = details.properties.filter(function(prp) {
                            return prp.name.toLowerCase().indexOf(payload.filter) > -1 || (prp.descriptors && prp.descriptors.alias && prp.descriptors.alias.toLowerCase().indexOf(payload.filter) > -1)
                        })
                    }
                }
            }
            socket.emit('action', {
                type: 'class/fetched',
                payload: {
                    fetchedClass: payload.id,
                    details: details
                }
            });
            return details;
        })
        .then(function(details) {
            if (details.type === 'cls')
                return fetchPackage(socket, {
                    id: details.parent.toString(),
                    filter: payload.filter
                });
        })
}

function applyFilter(socket, payload) {
    return db.getFilteredPackages(payload.model, payload.filter)
        .then(function(pkgs) {
            console.log(pkgs)
            socket.emit('action', {
                type: 'packages/filtered',
                payload: pkgs
            });
        })
}