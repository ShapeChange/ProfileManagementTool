var ss = require('socket.io-stream');
var path = require('path');
var fs = require('fs');
var through2 = require('through2');
var intoStream = require('into-stream');
var pmtIo = require('pmt-io');
var validator = require('pmt-validation');
var auth = require('./auth');

var db;
var actions;
var cfg;

exports.addRoutes = function(app, config, dbs, io) {

db = dbs;
cfg = config;

actions = {
    'models/fetch': fetchModels,
    'model/fetch': fetchModel,
    'package/fetch': fetchPackage,
    'class/fetch': fetchClass,
    'file/import': importFile,
    'file/export': exportFile,
    'profile/update': updateProfile,
    'editable/update': updateEditable,
    'filter/apply': applyFilter,
    'delete/confirm': deleteItem,
    'profile/edit/confirm': addOrRenameProfile,
    'user/create': auth.createUser.bind(auth, db.getUserReaderWriter()),
    'user/login': auth.loginUser.bind(auth, db.getUserReaderWriter())
}

io.on('connection', function(socket) {
    socket.on('action', function(action) {
        dispatch(socket, action);
    });

    ss(socket).on('import', function(stream, payload) {
        dispatch(socket, {
            type: 'file/import',
            payload: {
                stream: stream,
                metadata: payload.metadata,
                token: payload.token
            }
        });
    });

    ss(socket).on('export', function(stream, payload) {
        dispatch(socket, {
            type: 'file/export',
            payload: {
                stream: stream,
                metadata: payload.metadata,
                token: payload.token
            }
        });
    });

    socket.emit('action', {
        type: 'app/init',
        payload: config.get('app')
    });
});

};



function dispatch(socket, action) {
    console.log(action);

    // TODO: channel per user (or model???), send changes after write to whole channel 

    if (actions[action.type]) {
        if (action.type !== 'user/create' && action.type !== 'user/login') {
            if (action.payload && action.payload.token) {
                auth.verifyToken(action.payload.token)
                    .then(function(user) {
                        console.log('VRFY', user)
                        actions[action.type](socket, user, action.payload)
                            .catch(function(error) {
                                socket.emit('action', {
                                    type: 'server/error',
                                    payload: error
                                });
                            });
                    })
                    .catch(function() {
                        socket.emit('action', {
                            type: 'user/logout'
                        });
                    })
            } else {
                socket.emit('action', {
                    type: 'user/logout'
                });
            }
        } else {
            actions[action.type](socket, action.payload)
        }
    }
}

function updateEditable(socket, user, update) {
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
                return uc;
            })
            .then(function(updatedClasses) {
                console.log('UPD1', updatedClasses)
                return new Promise(function(resolve, reject) {

                    var checks = validator.createStream(cfg.get('app'), db.getModelReader(), db.getProfileWriter(), update.profile, function() {
                        resolve(updatedClasses);
                    });


                    intoStream.obj(updatedClasses.filter(elem => elem.type === 'cls')).pipe(checks)
                })
            })
            .then(function(updatedClasses) {
                socket.emit('action', {
                    type: 'editable/new',
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

function updateProfile(socket, user, update) {
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

                    var checks = validator.createStream(cfg.get('app'), db.getModelReader(), db.getProfileWriter(), update.profile, function() {
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

function importFile(socket, user, file) {
    console.log(file.metadata);
    var written = 0;
    var progress = 0;

    return pmtIo.importFile(db.getModelCollection(), file.stream, file.metadata, user._id, function(chunkLength) {
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

                var checks = validator.createStream(cfg.get('app'), db.getModelReader(), db.getProfileWriter(), null, function() {
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
            return fetchModels(socket, user);
        });
}

function exportFile(socket, user, file) {
    var progress = 0;

    return pmtIo.exportFile(db, file.stream, file.metadata.id, function(stats) {

        var newProgress = Math.round(((stats.packages + stats.classes + stats.associations) / stats.totalElements) * 100);

        if (newProgress > progress) {
            progress = newProgress;

            socket.emit('action', {
                type: 'file/export/stats',
                payload: {
                    progress: progress
                }
            });
        }
    })
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

function fetchModels(socket, user) {
    if (!user) return;

    return db.getModels(user._id)
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

function fetchModel(socket, user, payload) {
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

function fetchPackage(socket, user, payload) {
    return fetchPackageDetails(socket, payload.id)
        .then(function(details) {
            var filter;
            if (payload.filter && payload.filter !== '') {
                // if filter does not match package, filter classes
                if (!matchesFilter(details, payload.filter)) {
                    filter = payload.filter;
                }
            }
            return fetchClasses(socket, payload.id, filter)
        })
}

function matchesFilter(details, filter) {
    return details.name.toLowerCase().indexOf(filter) > -1
        || (details.descriptors && details.descriptors.alias && details.descriptors.alias.toLowerCase().indexOf(filter) > -1)
        || (details.descriptors && details.descriptors.description && details.descriptors.description.toLowerCase().indexOf(filter) > -1)
        || (details.descriptors && details.descriptors.definition && details.descriptors.definition.toLowerCase().indexOf(filter) > -1)
}

function fetchClasses(socket, pkg, filter) {
    return db.getClassesForPackage(pkg, filter)
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

function fetchClass(socket, user, payload) {
    var cls = payload.flattenInheritance || payload.flattenOninas ? db.getFlattenedClass(payload.id, payload.modelId, payload.flattenInheritance, payload.flattenOninas) : db.getDetails(payload.id, payload.modelId)

    return cls
        .then(function(details) {
            if (details.type === 'cls' || details.type === 'asc') {
                details._id = details.localId
                if (payload.filter && payload.filter !== '') {
                    // if filter does not match class, filter properties
                    if (!matchesFilter(details, payload.filter)) {
                        details.properties = details.properties.filter(function(prp) {
                            return matchesFilter(prp, payload.filter)
                        }).map(function(prp) {
                            prp.filterMatch = true;
                            return prp;
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
                return fetchPackage(socket, user, {
                    id: details.parent.toString(),
                    filter: payload.filter
                });
        })
}

function applyFilter(socket, user, payload) {
    return db.getFilteredPackages(payload.model, payload.filter)
        .then(function(pkgs) {
            console.log(pkgs)
            socket.emit('action', {
                type: 'packages/filtered',
                payload: pkgs
            });
        })
}

function deleteItem(socket, user, payload) {
    var pr = Promise.resolve();

    if (payload.type === 'mdl') {
        pr = db.deleteModel(payload.mdlId)
    } else if (payload.type === 'prf') {
        pr = db.deleteProfile(payload.prfId, payload.mdlId)
            .then(function(model) {
                if (payload.fetch) {
                    socket.emit('action', {
                        type: 'model/fetched',
                        payload: {
                            fetchedModel: payload.mdlId,
                            model: model
                        }
                    });
                }
            })
    }

    return pr
        .then(function() {
            return fetchModels(socket, user);
        })
}

function addOrRenameProfile(socket, user, payload) {
    var pr = Promise.resolve();

    if (!payload.oldName) {
        pr = db.addProfile(payload.name, payload.model)
    } else {
        pr = db.renameProfile(payload.oldName, payload.name, payload.model)
    }

    if (payload.fetch) {
        pr = pr
            .then(function(model) {
                socket.emit('action', {
                    type: 'model/fetched',
                    payload: {
                        fetchedModel: payload.model,
                        model: model
                    }
                });
            })
    }

    return pr
        .then(function() {
            return fetchModels(socket, user);
        })
}




