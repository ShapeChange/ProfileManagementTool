var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url;
var socket;

exports.addRoutes = function(app, io, config) {
url = config.db.url;

io.on('connection', function(sock) {
    socket = sock;

    socket.on('test/start', startTest);

    socket.on('action', (action) => {
        if (action.type === 'test/start') {
            startTest();
        }
    });
});

};

function startTest() {
    socket.emit('action', {
        type: 'test/backend'
    });

    MongoClient.connect(url, function(err, db) {
        if (err === null) {

            var failed = false;

            insertDocuments(db, function(err) {
                if (err !== null) {
                    console.log(err);
                    failed = true;
                }
                findDocuments(db, function(err) {
                    if (err !== null) {
                        console.log(err);
                        failed = true;
                    }
                    updateDocument(db, function(err) {
                        if (err !== null) {
                            console.log(err);
                            failed = true;
                        }
                        removeDocument(db, function(err) {
                            if (err !== null) {
                                console.log(err);
                                failed = true;
                            }

                            if (!failed) {
                                socket.emit('action', {
                                    type: 'test/db'
                                });
                            }

                            db.close();

                            socket.emit('action', {
                                type: 'test/end'
                            });
                        });
                    });
                });
            });
        } else {
            console.log(err);

            socket.emit('action', {
                type: 'test/end'
            });
        }
    });
}

function insertDocuments(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insertMany([
        {
            a: 3
        }
    ], function(err, result) {
        if (err === null) {
            console.log("Inserted 1 document into the collection");
        }
        callback(err, result);
    });
}

function findDocuments(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Find some documents
    collection.find({
        'a': 3
    }).toArray(function(err, docs) {
        if (err === null) {
            console.log("Found the following records");
            console.log(docs);
        }
        callback(err, docs);
    });
}

function updateDocument(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Update document where a is 2, set b equal to 1
    collection.updateOne({
        a: 3
    }
        , {
            $set: {
                b: 1
            }
        }, function(err, result) {
            if (err === null) {
                console.log("Updated the document with the field a equal to 3");
            }
            callback(err, result);
        });
}

function removeDocument(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Delete document where a is 3
    collection.deleteOne({
        a: 3
    }, function(err, result) {
        if (err === null) {
            console.log("Removed the document with the field a equal to 3");
        }
        callback(err, result);
    });
}