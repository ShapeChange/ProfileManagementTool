var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var users;

exports.create = function(usrs) {
users = usrs;

return {
    createUser: createUser,
    findUser: findUser
}
}

function createUser(name) {
    return users
        .insertOne({
            name: name
        })
}

function findUser(name) {
    return users
        .findOne({
            name: name
        })
}