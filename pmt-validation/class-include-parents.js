var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(config, modelReader, errorWriter, profile, fullCheck = false) {

return through2.obj({
    highWaterMark: 1
}, function(obj, enc, cb) {

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
                msg: 'superClassNotIncluded'
            });
        })
    }

    var filter = {
        profiles: {
            $not: {
                $all: obj.profiles
            }
        },
        editable: true
    }

    var projection = {
        name: 1,
        profiles: 1,
    }

    modelReader.getClassGraph(obj.localId, obj.model, false, projection, filter, false, fullCheck && 0)
        .then(function(classes) {

            return Promise.map(prfs, prf => {
                return Promise.map(classes, cls => {
                    if (cls.localId !== obj.localId) {
                        if (!cls.profiles || cls.profiles.indexOf(prf) === -1) {
                            return errorWriter.appendError(obj.model, prf, {
                                itemId: obj.localId,
                                name: obj.name,
                                superId: cls.localId,
                                superName: cls.name,
                                msg: 'superClassNotIncluded'
                            })
                        }
                    }
                })
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
return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
    || (!cls.profiles || cls.profiles.length === 0)
}