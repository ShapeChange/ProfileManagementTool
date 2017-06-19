var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(modelReader, errorWriter, profile) {
console.log(path.basename(__filename, '.js'));

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

            prfs.forEach(function(prf) {
                classes.forEach(function(cls) {
                    if (cls.localId !== obj.localId) {
                        if (!cls.profiles || cls.profiles.indexOf(prf) === -1) {
                            errorWriter.appendError({
                                _id: obj.localId,
                                name: obj.name,
                                model: obj.model,
                                profile: prf,
                                msg: 'Super class "' + cls.name + '" is not included in profile'
                            })
                        }
                    }
                })
            })

            cb(null, obj);
        })
});

}

exports.shouldSkip = function(cls, profile) {
return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
    || (!cls.profiles || cls.profiles.length === 0)
}