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

    var prfs = profile ? [profile] : obj.profiles

    const defaultGeometries = config.geometry;

    if (obj.taggedValues && obj.taggedValues.geometry) {

        if (!containsGeometries(defaultGeometries, obj.taggedValues.geometry.split(','))) {
            pr = pr.then(() => {
                return Promise.map(prfs, prf => {
                    return errorWriter.appendError(obj.model, prf, {
                        _id: obj.localId,
                        name: obj.name,
                        taggedValueGeometry: obj.taggedValues.geometry,
                        defaultGeometries: defaultGeometries.join(','),
                        msg: 'taggedValueGeometryInvalid'
                    })
                })
            });
        }
    }

    let geometries = defaultGeometries

    if (obj.taggedValues && obj.taggedValues.geometry) {
        geometries = _mergeGeometries(geometries, obj.taggedValues.geometry.split(','))
    }

    pr = pr.then(() => {
        return Promise.map(prfs, prf => {
            if (obj.profiles.indexOf(prf) > -1 && obj.profileParameters && obj.profileParameters[prf] && obj.profileParameters[prf].geometry) {

                if (!containsGeometries(geometries, obj.profileParameters[prf].geometry.split(','))) {
                    return errorWriter.appendError(obj.model, prf, {
                        _id: obj.localId,
                        name: obj.name,
                        parameterGeometry: obj.profileParameters[prf].geometry,
                        taggedValueGeometry: obj.taggedValues.geometry,
                        defaultGeometries: defaultGeometries.join(','),
                        msg: 'parameterGeometryInvalid'
                    })
                }
            }
        })
    });

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