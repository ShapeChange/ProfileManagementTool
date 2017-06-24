var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(config, modelReader, errorWriter, profile) {

return through2.obj(function(obj, enc, cb) {

    console.log(path.basename(__filename, '.js'));

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
                                        _id: obj.localId,
                                        prpId: prp._id,
                                        prpName: prp.name,
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