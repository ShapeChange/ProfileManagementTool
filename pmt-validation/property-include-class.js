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

    if (obj.properties) {
        obj.properties.forEach(prp => {
            var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
            prfs.forEach(prf => {
                if (prp.profiles.indexOf(prf) > -1 && obj.profiles.indexOf(prf) === -1) {
                    errorWriter.appendError(obj.model, prf, {
                        _id: obj.localId,
                        prpId: prp._id,
                        prpName: prp.name,
                        name: obj.name,
                        msg: 'classNotIncluded'
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