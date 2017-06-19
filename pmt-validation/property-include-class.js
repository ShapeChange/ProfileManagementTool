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

    if (obj.properties) {
        obj.properties.forEach(prp => {
            var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
            prfs.forEach(prf => {
                if (prp.profiles.indexOf(prf) > -1 && obj.profiles.indexOf(prf) === -1) {
                    errorWriter.appendError({
                        _id: obj.localId,
                        prpId: prp._id,
                        name: obj.name,
                        model: obj.model,
                        profile: prf,
                        msg: 'Property "' + prp.name + '" is included in profile, but its class "' + obj.name + '" is not'
                    })
                }
            });
        })
    }

    cb(null, obj);
});

}

exports.shouldSkip = function(cls, profile) {
return (profile && cls.properties.every(prp => prp.profiles.indexOf(profile) === -1))
    || (cls.properties.every(prp => prp.profiles.length === 0))
}