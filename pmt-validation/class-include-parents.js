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

    var filter = {
        profiles: {
            $not: {
                $all: obj.profiles
            }
        },
        editable: true
    }

    modelReader.getClassGraph(obj.localId, obj.model, false, {
        name: 1,
        profiles: 1,
    }, filter)
        .then(function(classes) {

            var prfs = profile ? [profile] : obj.profiles

            return Promise.map(prfs, prf => {
                return Promise.map(classes, cls => {
                    if (cls.localId !== obj.localId) {
                        if (!cls.profiles || cls.profiles.indexOf(prf) === -1) {
                            return errorWriter.appendError(obj.model, prf, {
                                _id: obj.localId,
                                name: obj.name,
                                clsName: cls.name,
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