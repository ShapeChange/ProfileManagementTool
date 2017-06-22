var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var model;

exports.create = function(mdl) {
model = mdl;

return {
    putClassUpdate: putClassUpdate,
    putClassUpdateProfile: putClassUpdateProfile,
    putPackageUpdate: putPackageUpdate,
    appendError: appendError,
    clearErrors: clearErrors
}
}

function putClassUpdate(id, modelId, update, projection) {
    if (id === undefined)
        throw new Error()

    return model
        .findAndModify({
            localId: id,
            model: ObjectID(modelId)
        },
            [],
            update,
            {
                new: true,
                fields: projection || getProjection()
            }
    )
}

function putClassUpdateProfile(id, modelId, update, projection) {
    if (id === undefined)
        throw new Error()

    const dbUpdate = Object.keys(update).reduce(function(upd, key) {
        return Object.keys(update[key]).reduce(function(upd2, profile) {
            const cmd = update[key][profile] === true ? '$addToSet' : '$pull'
            if (!upd2[cmd])
                upd2[cmd] = {}
            upd2[cmd] = Object.assign(upd2[cmd], {
                [key]: profile
            });
            return upd2;
        }, upd);
    }, {});

    return putClassUpdate(id, modelId, dbUpdate, projection);
}

function putPackageUpdate(id, modelId, update, projection) {
    if (id === undefined)
        throw new Error()

    return model
        .findAndModify({
            _id: ObjectID(id),
            model: ObjectID(modelId)
        },
            [],
            update,
            {
                new: true,
                fields: projection || getProjection()
            }
    )
}

function appendError(error) {
    if (!error._id)
        return //throw new Error()

    var update = {
        $addToSet: {
            ['profilesInfo.' + error.profile + '.errors']: {
                _id: error._id,
                name: error.name,
                msg: error.msg
            }
        }
    }
    console.log('APPEND', update)
    return model
        .findAndModify({
            _id: ObjectID(error.model)
        },
            [],
            update,
            {
                new: true
            }
    )
}

function clearErrors(clsId, modelId, profile) {
    if (!clsId)
        return //throw new Error()

    var update = {
        $pull: {
            ['profilesInfo.' + profile + '.errors']: {
                _id: clsId
            }
        }
    }
    console.log('CLEAR', update)

    return model
        .findAndModify({
            _id: ObjectID(modelId)
        },
            [],
            update,
            {
                new: true
            }
    )
}

var minProjection = ['localId', 'parent', 'name', 'type', 'profiles', 'profileParameters', 'properties.profiles', 'properties.profileParameters', 'properties._id', 'properties.name', 'properties.typeId', 'properties.isAttribute', 'properties.isNavigable', 'properties.optional', 'properties.reversePropertyId', 'taggedValues', 'model', 'editable'];

function getProjection() {
    return minProjection.concat([].slice.call(arguments)).reduce(function(prj, key) {
        prj[key] = 1;
        return prj;
    }, {})
}