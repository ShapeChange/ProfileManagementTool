var db = require('../db');
var assert = require('assert');

var url;
//var socket;

exports.addRoutes = function(app, io, config) {
url = config.db.url;

io.on('connection', function(socket) {
    //socket = sock;

    //socket.on('test/start', startTest);

    socket.on('action', (action) => {
        /*if (action.type === 'test/start') {
            startTest();
        }*/

        dispatch(socket, action);
    });
});

};

const actions = {
    'model/fetch': fetchModel,
    'package/fetch': fetchPackage,
    'class/fetch': fetchClass
}

function dispatch(socket, action) {
    console.log(action);

    if (actions[action.type])
        actions[action.type](socket, action.payload);
}

function fetchModel(socket, model) {
    return db.connect(url)
        .then(function() {
            return db.getPackages(model);
        })
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
/*.then(function() {
    db.close();
})*/
}

function fetchPackage(socket, pkg) {
    return fetchClasses(socket, pkg)
        .then(function() {
            return fetchPackageDetails(socket, pkg);
        })
}

function fetchClasses(socket, pkg) {
    return db.connect(url)
        .then(function() {
            return db.getClassesForPackage(pkg);
        })
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(classes) {
            return socket.emit('action', {
                type: 'classes/fetched',
                payload: classes
            });
        })
/*.then(function() {
    db.close();
})*/
}

function fetchPackageDetails(socket, id) {
    return db.connect(url)
        .then(function() {
            return db.getDetails(id);
        })
        .then(function(details) {
            return socket.emit('action', {
                type: 'package/fetched',
                payload: {
                    fetchedPackage: id,
                    details: details
                }
            });
        })
/*.then(function() {
    db.close();
})*/
}

function fetchClass(socket, id) {
    return db.connect(url)
        .then(function() {
            return db.getDetails(id);
        })
        .then(function(details) {
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

/*.then(function() {
    db.close();
})*/
}
