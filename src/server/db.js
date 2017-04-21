var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

var db;
var pkgs;
var classes;
var model;

function setConnection(connection) {
    db = connection;
    //pkgs = db.collection('packages');
    //classes = db.collection('classes');
    model = db.collection('models');
}

exports.connect = function(url) {
if (db) {
    return Promise.resolve();
}

return MongoClient
    .connect(url, {
        promiseLibrary: Promise
    })
    .then(setConnection);
}

exports.getPackages = function(modelId) {
return model
    .find({
        type: 'pkg',
        model: modelId
    })
    .project({
        parent: 1,
        name: 1,
        type: 1
    })
    .sort({
        name: 1
    })
}

exports.getClasses = function() {
return model
    .find({
        type: 'cls'
    })
    .project({
        parent: 1,
        name: 1,
        type: 1
    })
// TODO: does not work
/*.sort({
    parent: 1,
    name: 1
})*/
}

exports.getClassesForPackage = function(pkg) {
return model
    .find({
        type: 'cls',
        parent: pkg
    })
    .project({
        parent: 1,
        name: 1,
        type: 1
    })
    .sort({
        name: 1
    })
}

exports.getDetails = function(id) {
return model
    .findOne({
        _id: new ObjectID(id)
    })
}

exports.getModel = function(id) {
return model
    .findOne({
        _id: id
    })
}

exports.close = function() {
return db.close();
}