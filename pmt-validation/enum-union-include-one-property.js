var through2 = require('through2');
var Promise = require("bluebird");
var path = require('path');

exports.createStream = function(config, modelReader, errorWriter, profile) {

return through2.obj({
    highWaterMark: 1
}, function(obj, enc, cb) {

    console.log(path.basename(__filename, '.js'));

    if (exports.shouldSkip(obj, profile)) {
        console.log('SKIP')
        cb(null, obj);
        return;
    }

    var pr = Promise.resolve();

    var prfs = profile ? [profile] : obj.profiles

    if (obj.properties) {
        pr = Promise.map(prfs, prf => {
            if (obj.properties.some(prp => !prp.optional)
                    && !obj.properties.some(prp => !prp.optional && prp.profiles && prp.profiles.indexOf(prf) !== -1)) {
                return errorWriter.appendError(obj.model, prf, {
                    itemId: obj.localId,
                    name: obj.name,
                    msg: 'enumOrUnionNoMandatoryPropertyIncluded'
                })
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
return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
    || (!cls.profiles || cls.profiles.length === 0)
    || (!cls.stereotypes || (cls.stereotypes && cls.stereotypes[0] !== 'enumeration' && cls.stereotypes[0] !== 'union'))
}