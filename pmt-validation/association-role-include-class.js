var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function (config, modelReader, errorWriter, profile, fullCheck = false) {

    return through2.obj({
        highWaterMark: 1
    }, function (obj, enc, cb) {

        console.log(path.basename(__filename, '.js'));

        if (exports.shouldSkip(obj, profile)) {
            console.log('SKIP')
            cb(null, obj);
            return;
        }

        var prfs = profile ? [profile] : obj.profiles

        if (!fullCheck) {
            Promise.map(prfs, prf => {
                return errorWriter.clearErrors(null, obj.model, prf, {
                    superId: obj.localId,
                    msg: 'associationClassNotIncluded'
                });
            })
        }

        Promise.all(obj.properties
            .filter(prp => prp.associationId)
            .map(prp => modelReader.getClass(prp.associationId, obj.model, { assocClassId: 1 })))
            .then(function (ass) {
                console.log('ASS', ass)
                return Promise.all(ass.map(a => modelReader.getClass(a.assocClassId, obj.model)))
            })
            .then(function (classes) {
                console.log('ASS2', classes)
                return Promise.map(prfs, prf => {
                    return Promise.map(classes, (cls, index) => {
                        console.log('ASS3', cls)
                        if (!cls.profiles || cls.profiles.indexOf(prf) === -1) {
                            return errorWriter.appendError(obj.model, prf, {
                                itemId: cls.localId,
                                name: obj.name,
                                roleName: obj.properties[index].name,
                                className: cls.name,
                                msg: 'associationClassNotIncluded'
                            })
                        }
                    })
                })
            })
            .then(function () {
                cb(null, obj);
            })
            .catch(function () {
                cb(null, obj);
            })
    });

}

function getClassByProperty(modelReader, id, modelId) {
    return modelReader.getClassByProperty(id, modelId, {
        'properties.associationId': 1
    }, {
            'properties.localId': id
        })
}

exports.shouldSkip = function (cls, profile) {
    console.log('CHECK', cls.name, cls.associationId)
    return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
        || (!cls.profiles || cls.profiles.length === 0) || !cls.properties.some(prp => prp.associationId)
}
