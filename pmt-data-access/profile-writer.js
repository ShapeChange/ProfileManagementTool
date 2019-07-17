var Promise = require("bluebird");
var ObjectID = require('mongodb').ObjectID;

var model;
var errors;

exports.create = function (mdl, err) {
    model = mdl;
    errors = err;

    return {
        putClassUpdate: putClassUpdate,
        putClassUpdateProfile: putClassUpdateProfile,
        putPackageUpdate: putPackageUpdate,
        appendError: appendError,
        clearErrors: clearErrors,
        appendErrorBulk: appendErrorBulk,
        clearErrorsBulk: clearErrorsBulk,
        finishBulk: finishBulk
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

    const dbUpdate = Object.keys(update).reduce(function (upd, key) {
        return Object.keys(update[key]).reduce(function (upd2, profile) {
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

function appendError(modelId, profile, error) {
    return errors.insertOne(Object.assign(error, {
        model: modelId,
        profile: profile
    }))

    /*if (!error._id)
        return //throw new Error()
    
    var update = {
        $addToSet: {
            ['profilesInfo.' + profile + '.errors']: error
        }
    }
    console.log('APPEND', update)
    return model
        .findAndModify({
            _id: ObjectID(modelId)
        },
            [],
            update,
            {
                new: true
            }
    )*/
}

function clearErrors(clsId, modelId, profile, filter) {
    return errors.deleteMany(Object.assign({
        model: modelId,
        profile: profile
    }, filter || {
        itemId: clsId
    }))

    /*if (!clsId)
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
    )*/
}

var bulk = [];

function appendErrorBulk(modelId, profile, error) {
    if (!error._id)
        return //throw new Error()

    var update = {
        $addToSet: {
            ['profilesInfo.' + profile + '.errors']: error
        }
    }
    console.log('APPEND BULK', update)

    bulk.push({
        'updateOne': {
            'filter': {
                '_id': ObjectID(modelId)
            },
            'update': update
        }
    })

    return checkBulk();
}

function clearErrorsBulk(clsId, modelId, profile) {
    if (!clsId)
        return //throw new Error()

    var update = {
        $pull: {
            ['profilesInfo.' + profile + '.errors']: {
                _id: clsId
            }
        }
    }
    console.log('CLEAR BULK', update)

    bulk.push({
        'updateOne': {
            'filter': {
                '_id': ObjectID(modelId)
            },
            'update': update
        }
    })

    return checkBulk();
}

function checkBulk(submit = false) {
    if (bulk.length === 1000 || submit) {
        //Execute per 500 operations and re-init
        var write = bulk;
        bulk = [];
        console.log('BULK WRITE')

        return model.bulkWrite(write, {
            ordered: true,
            w: 1
        })
    }
    return Promise.resolve();
}

function finishBulk() {
    return checkBulk(true);
}


var minProjection = ['localId', 'parent', 'name', 'type', 'profiles', 'profileParameters', 'properties.profiles', 'properties.profileParameters', 'properties._id', 'properties.name', 'properties.typeId', 'properties.isAttribute', 'properties.isNavigable', 'properties.optional', 'properties.reversePropertyId', 'properties.cardinality', 'taggedValues', 'stereotypes', 'model', 'editable', 'associationId'];

function getProjection() {
    return minProjection.concat([].slice.call(arguments)).reduce(function (prj, key) {
        prj[key] = 1;
        return prj;
    }, {})
}
