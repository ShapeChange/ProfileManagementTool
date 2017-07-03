var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(config, modelReader, errorWriter, profile, fullCheck = false) {

return through2.obj({
    highWaterMark: 1
}, function(obj, enc, cb) {

    console.log(path.basename(__filename, '.js'));

    if (!fullCheck) {
        // if class is in profile
        if ((profile && obj.profiles && obj.profiles.indexOf(profile) > -1)
                || (obj.profiles && obj.profiles.length > 0)) {

            var prfs = profile ? [profile] : obj.profiles

            Promise.map(prfs, prf => {
                return errorWriter.clearErrors(null, obj.model, prf, {
                    typeId: obj.localId,
                    msg: 'typeNotIncluded'
                });
            })
        }
    }

    if (exports.shouldSkip(obj, profile)) {
        console.log('SKIP')
        cb(null, obj);
        return;
    }

    var pr = Promise.resolve();

    if (obj.properties) {
        pr = Promise.map(obj.properties, prp => {
            var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
            if (prfs.length > 0) {
                var filter = {
                    profiles: {
                        $not: {
                            $all: prfs
                        }
                    },
                    editable: true
                }

                return modelReader.getClass(prp.typeId, obj.model, {
                    name: 1,
                    profiles: 1,
                }, filter)
                    .then(function(type) {
                        if (type) {
                            return Promise.map(prfs, prf => {
                                if (prp.profiles.indexOf(prf) > -1 && type.profiles.indexOf(prf) === -1) {
                                    return errorWriter.appendError(obj.model, prf, {
                                        itemId: obj.localId,
                                        prpId: prp._id,
                                        prpName: prp.name,
                                        typeId: prp.typeId,
                                        typeName: type.name,
                                        name: obj.name,
                                        msg: 'typeNotIncluded'
                                    })
                                }
                            });
                        }
                    });
            }
        })
    }

    pr.then(function() {
        cb(null, obj);
    }).catch(function() {
        cb(null, obj);
    })
});

}

exports.shouldSkip = function(cls, profile) {
return (profile && cls.properties.every(prp => prp.profiles.indexOf(profile) === -1))
    || (cls.properties.every(prp => prp.profiles.length === 0))
}