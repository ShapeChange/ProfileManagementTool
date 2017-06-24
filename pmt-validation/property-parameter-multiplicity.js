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

    if (obj.properties) {
        obj.properties.forEach(prp => {
            var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
            pr = Promise.map(prfs, prf => {
                if (prp.profiles.indexOf(prf) > -1 && prp.profileParameters[prf] && prp.profileParameters[prf].multiplicity) {

                    if (!containsCardinality(parseCardinality(prp.cardinality), parseCardinality(prp.profileParameters[prf].multiplicity))) {
                        return errorWriter.appendError(obj.model, prf, {
                            _id: obj.localId,
                            prpId: prp._id,
                            prpName: prp.name,
                            prpCardinality: prp.cardinality,
                            name: obj.name,
                            parameterMultiplicity: prp.profileParameters[prf].multiplicity,
                            msg: 'parameterMultiplicityOutOfBounds'
                        })
                    }
                }
            });
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