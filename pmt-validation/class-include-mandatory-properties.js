var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(modelReader, errorWriter, profile) {

return through2.obj(function(obj, enc, cb) {

    console.log(path.basename(__filename, '.js'));

    if (exports.shouldSkip(obj, profile)) {
        console.log('SKIP')
        cb(null, obj);
        return;
    }

    var prfs = profile ? [profile] : obj.profiles

    if (obj.properties) {
        obj.properties.forEach(prp => {
            if (!prp.optional) {
                prfs.forEach(prf => {
                    if (!prp.profiles || prp.profiles.indexOf(prf) === -1) {
                        errorWriter.appendError({
                            _id: obj.localId,
                            prpId: prp._id,
                            name: obj.name,
                            model: obj.model,
                            profile: prf,
                            msg: 'Mandatory Property "' + prp.name + '" is not included in profile'
                        })
                    }
                });
            }
        })
    }

    cb(null, obj);
});

}

exports.shouldSkip = function(cls, profile) {
return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
    || (!cls.profiles || cls.profiles.length === 0)
}