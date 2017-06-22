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
                if (prp.profiles.indexOf(prf) > -1 && prp.profileParameters[prf] && prp.profileParameters[prf].multiplicity) {

                    if (!containsCardinality(parseCardinality(prp.cardinality), parseCardinality(prp.profileParameters[prf].multiplicity))) {
                        errorWriter.appendError({
                            _id: obj.localId,
                            prpId: prp._id,
                            name: obj.name,
                            model: obj.model,
                            profile: prf,
                            msg: 'The value for parameter multiplicity (' + prp.profileParameters[prf].multiplicity + ') of property "' + prp.name + '" is not contained in properties cardinality (' + prp.cardinality + ')'
                        })
                    }
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

//TODO: to pmt-util
function parseCardinality(cardinality) {
    const bounds = cardinality.split('..')
    return {
        min: parseInt(bounds[0]),
        max: parseInt(bounds[1]),
        maxUnbounded: bounds[1] === '*'
    }
}

function containsCardinality(outerCardinality, innerCardinality) {
    var minContained = innerCardinality.min >= outerCardinality.min
        && (outerCardinality.maxUnbounded || innerCardinality.min <= outerCardinality.max)

    var maxContained = (outerCardinality.maxUnbounded || (!innerCardinality.maxUnbounded && innerCardinality.max <= outerCardinality.max))
        && (innerCardinality.maxUnbounded || innerCardinality.max >= outerCardinality.min)

    return minContained && maxContained
}