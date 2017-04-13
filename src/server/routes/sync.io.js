var db = require('../db');
var assert = require('assert');

var url;
var socket;

exports.addRoutes = function(app, io, config) {
url = config.db.url;

io.on('connection', function(sock) {
    socket = sock;

    //socket.on('test/start', startTest);

    socket.on('action', (action) => {
        /*if (action.type === 'test/start') {
            startTest();
        }*/

        dispatch(action);
    });
});

};

const actions = {
    'app/init': fetchPackages,
    'app/package/select': selectPackage,
    'app/class/select': fetchClass
}

function dispatch(action) {
    console.log(action);

    if (actions[action.type])
        actions[action.type](action.payload);
}

function fetchPackages() {
    return db.connect(url)
        .then(db.getPackages)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(pkgs) {
            socket.emit('action', {
                type: 'packages/fetched',
                payload: pkgs
            });
        })
/*.then(function() {
    db.close();
})*/
}

function selectPackage(pkg) {
    return fetchClasses(pkg)
        .then(function() {
            return fetchPackage(pkg);
        })
}

function fetchClasses(pkg) {
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

function fetchPackage(id) {
    return db.connect(url)
        .then(function() {
            return db.getDetails(id);
        })
        .then(function(details) {
            return socket.emit('action', {
                type: 'package/fetched',
                payload: details
            });
        })
/*.then(function() {
    db.close();
})*/
}

function fetchClass(id) {
    return db.connect(url)
        .then(function() {
            return db.getDetails(id);
        })
        .then(function(details) {
            return socket.emit('action', {
                type: 'class/fetched',
                payload: details
            });
        })
/*.then(function() {
    db.close();
})*/
}
