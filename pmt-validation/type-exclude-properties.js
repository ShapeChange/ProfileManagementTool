var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(config, modelReader, errorWriter, profile, fullCheck = false) {

return through2.obj({
    highWaterMark: 1
}, function(obj, enc, cb) {

    console.log(path.basename(__filename, '.js'));
    console.log('TYPE ', obj)
    if (exports.shouldSkip(obj, profile)) {
        console.log('SKIP')
        cb(null, obj);
        return;
    }

    var prfs = profile ? [profile] : obj.profiles

    if (!fullCheck) {
        Promise.map(prfs, prf => {
            return errorWriter.clearErrors(null, obj.model, prf, {
                typeId: obj.localId,
                msg: 'typeNotIncluded'
            });
        })
    }

    return modelReader.getAllOfType(obj.localId, obj.model, {}, {
        optional: false
    })
        .then(function(classesOfType) {

            return Promise.map(classesOfType, function(cls) {
                var pr = Promise.resolve();
                if (cls.properties) {
                    pr = Promise.map(cls.properties, prp => {
                        var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
                        console.log('CLASSESOFTYPE ', prp, prfs)
                        return Promise.map(prfs, prf => {
                            if (!prp.optional && prp.typeId === obj.localId && prp.profiles.indexOf(prf) > -1 && obj.profiles.indexOf(prf) === -1) {
                                return errorWriter.appendError(cls.model, prf, {
                                    itemId: cls.localId,
                                    prpId: prp._id,
                                    prpName: prp.name,
                                    typeId: prp.typeId,
                                    typeName: obj.name,
                                    name: cls.name,
                                    msg: 'typeNotIncluded'
                                })
                            }
                        });
                    })
                }
                return pr;
            })
        })
        .then(function() {
            cb(null, obj);
        })
        .catch(function() {
            cb(null, obj);
        })
});

}

exports.shouldSkip = function(cls, profile) {
return profile && cls.profiles && cls.profiles.indexOf(profile) !== -1
}