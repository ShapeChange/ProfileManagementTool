var Promise = require("bluebird");
var jwt = require('jsonwebtoken');

exports.createUser = function(users, socket, payload) {
return users.createUser(payload.name)
    .then(function(user) {
        socket.emit('action', {
            type: 'user/create/success',
            payload: {
                name: payload.name
            }
        });
    })
    .catch(function(error) {
        var msg = 'Unknown error when creating user, please try again';
        if (error.code === 11000)
            msg = 'A user with name \'' + payload.name + '\' already exists'

        socket.emit('action', {
            type: 'user/create/error',
            payload: {
                msg: msg
            }
        });
    })
}

exports.loginUser = function(users, socket, payload) {
var pr;
if (payload.token) {
    pr = verifyToken(payload.token);
} else {
    pr = users.findUser(payload.name);
}

return pr
    .then(function(user) {
        if (!user) {
            socket.emit('action', {
                type: 'user/login/error',
                payload: {
                    msg: 'A user with name \'' + payload.name + '\' does not exist'
                }
            });
        } else {
            socket.emit('action', {
                type: 'user/login/success',
                payload: {
                    user: user,
                    token: generateToken(user)
                }
            });
        }
    })
    .catch(function(error) {
        console.log(error);
        socket.emit('action', {
            type: 'user/login/error',
            payload: {
                msg: 'Unknown error when logging in user, please try again'
            }
        });
    })
}

const JWT_SECRET = 'private.key';

function generateToken(user) {
    //1. Dont use password and other sensitive fields
    //2. Use fields that are useful in other parts of the     
    //app/collections/models
    var u = {
        name: user.name,
        _id: user._id
    };

    return jwt.sign(u, JWT_SECRET, {
        //expiresIn: 60 * 60 * 24 // expires in 24 hours
    });
}

function verifyToken(token) {
    return new Promise(function(resolve, reject) {
        jwt.verify(token, JWT_SECRET, function(err, payload) {
            if (err)
                reject(err);

            resolve(payload);
        });
    });
}
exports.verifyToken = verifyToken