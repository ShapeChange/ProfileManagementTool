var ss = require('socket.io-stream');
var path = require('path');
var fs = require('fs');
var mongoImport = process.env.NODE_ENV === 'production' ? require('pmt-io/mongo-import') : require('../../../pmt-io/mongo-import');
var mongoExport = process.env.NODE_ENV === 'production' ? require('pmt-io/mongo-export') : require('../../../pmt-io/mongo-export');

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
    'profile/update': updateProfile
}

function dispatch(socket, action) {
    console.log(action);

    if (actions[action.type])
        actions[action.type](socket, action.payload);
}

function updateProfile(socket, update) {
    if (update.type === 'cls' || update.type === 'prp') {
        var pr = update.type === 'cls'
            ? db.updateClassProfile(update.id, update.modelId, update.profile, update.include)
            : db.updatePropertyProfile(update.parent, update.id, update.modelId, update.profile, update.include);

        return pr
            .then(function(updatedClasses) {
                var uc = updatedClasses.map(function(cls) {
                    if (cls.ok && cls.value) {
                        cls.value._id = cls.value.localId;
                        return cls.value;
                    } else {
                        // TODO: error, also in catch, throw here
                        console.log('ERROR', cls)
                    }
                })
                console.log(uc)
                socket.emit('action', {
                    type: 'profile/new',
                    payload: uc
                });
            })
    }
}

function importFile(socket, file) {
    console.log(file.metadata);

    return mongoImport.importFile(db.getModelCollection(), file.stream, file.metadata)
        .then(function(stats) {
            console.log('DONE', stats);

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

            console.log(JSON.stringify(stats.ids));

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

function fetchModel(socket, model) {
    return db.getPackages(model)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(pkgs) {
            return db.getModel(model)
                .then(function(details) {
                    return {
                        fetchedModel: model,
                        packages: pkgs,
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

function fetchPackage(socket, pkg) {
    return fetchClasses(socket, pkg)
        .then(function() {
            return fetchPackageDetails(socket, pkg);
        })
}

function fetchClasses(socket, pkg) {
    return db.getClassesForPackage(pkg)
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
            return socket.emit('action', {
                type: 'package/fetched',
                payload: {
                    fetchedPackage: id,
                    details: details
                }
            });
        })
}

function fetchClass(socket, id) {
    return db.getDetails(id)
        .then(function(details) {
            if (details.type === 'cls') {
                details._id = details.localId
            }
            socket.emit('action', {
                type: 'class/fetched',
                payload: {
                    fetchedClass: id,
                    details: details
                }
            });
            return details;
        })
        .then(function(details) {
            return fetchPackage(socket, details.parent);
        })
}
