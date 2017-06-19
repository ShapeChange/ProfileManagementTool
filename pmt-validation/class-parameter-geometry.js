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

    const defaultGeometries = ['P', 'C', 'S', 'So', 'MP', 'MC', 'MS', 'MSo']

    if (obj.taggedValues && obj.taggedValues.geometry) {

        if (!containsGeometries(defaultGeometries, obj.taggedValues.geometry.split(','))) {
            prfs.forEach(prf => {
                errorWriter.appendError({
                    _id: obj.localId,
                    name: obj.name,
                    model: obj.model,
                    profile: prf,
                    msg: 'Tagged value geometry (' + obj.taggedValues.geometry + ') does not match configured geometries'
                })
            });
        }
    }

    let geometries = defaultGeometries

    if (obj.taggedValues && obj.taggedValues.geometry) {
        geometries = _mergeGeometries(geometries, obj.taggedValues.geometry.split(','))
    }

    prfs.forEach(prf => {
        if (obj.profiles.indexOf(prf) > -1 && obj.profileParameters && obj.profileParameters[prf] && obj.profileParameters[prf].geometry) {

            if (!containsGeometries(geometries, obj.profileParameters[prf].geometry.split(','))) {
                errorWriter.appendError({
                    _id: obj.localId,
                    name: obj.name,
                    model: obj.model,
                    profile: prf,
                    msg: 'The value for parameter geometry (' + obj.profileParameters[prf].geometry + ') does not match the configured geometries or the tagged value geometry'
                })
            }
        }
    });

    cb(null, obj);
});

}

exports.shouldSkip = function(cls, profile) {
return (profile && (!cls.profiles || cls.profiles.indexOf(profile) === -1))
    || (!cls.profiles || cls.profiles.length === 0)
}

//TODO: to pmt-util
function _mergeGeometries(geos, restriction) {
    return restriction.reduce((result, g) => {
        if (geos.indexOf(g) > -1)
            result.push(g)
        return result
    }, [])
}

function containsGeometries(geos, restriction) {
    return restriction.every(g => geos.indexOf(g) > -1)
}