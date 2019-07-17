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
                    msg: 'associationRoleNotIncluded'
                });
            })
        }

        modelReader.getClass(obj.associationId, obj.model, { end1: 1, end2: 1 })
            .then(function (ass) {
                console.log('ASS', ass)
                const ends = [];

                if (ass.end1 && ass.end1.ref) {
                    ends.push(getClassByProperty(modelReader, ass.end1.ref, obj.model));
                }
                if (ass.end2 && ass.end2.ref) {
                    ends.push(getClassByProperty(modelReader, ass.end2.ref, obj.model));
                }

                return Promise.all(ends)
            })
            .then(function (classes) {
                console.log('ASS2', classes)
                return Promise.map(prfs, prf => {
                    return Promise.map(classes, cls => {
                        console.log('ASS3', cls.properties)
                        return cls.properties.some(prp => prp.associationId === obj.associationId && (!prp.profiles || prp.profiles.indexOf(prf) === -1))
                    })

                        .then(included => {
                            console.log('INCL', included)
                            if (included && included.every(incl => incl)) {
                                return errorWriter.appendError(obj.model, prf, {
                                    itemId: obj.localId + '/info',
                                    name: obj.name,
                                    msg: 'associationRoleNotIncluded'
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
    return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
        || (!cls.profiles || cls.profiles.length === 0) || !cls.associationId
}
