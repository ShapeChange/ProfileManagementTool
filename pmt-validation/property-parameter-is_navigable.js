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

    var pr = Promise.resolve();

    if (obj.properties) {
        pr = Promise.map(obj.properties, prp => {

            var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
            return Promise.map(prfs, prf => {
                if (prp.profiles.indexOf(prf) > -1 && prp.profileParameters[prf] && prp.profileParameters[prf].isNavigable) {

                    if (prp.isAttribute) {
                        return errorWriter.appendError({
                            _id: obj.localId,
                            prpId: prp._id,
                            name: obj.name,
                            model: obj.model,
                            profile: prf,
                            msg: 'Property "' + prp.name + '" is not an association role, it should not have profile parameter "isNavigable"'
                        })
                    } else if (prp.profileParameters[prf].isNavigable === 'false') {
                        return modelReader.getClassByProperty(prp.reversePropertyId, obj.model, {
                            "properties.$": 1
                        }, {
                            properties: {
                                $elemMatch: {
                                    _id: prp.reversePropertyId,
                                    $or: [
                                        {
                                            isNavigable: false
                                        },
                                        {
                                            ['profileParameters.' + prf + '.isNavigable']: 'false'
                                        }
                                    ]

                                }
                            }
                        })
                            .then(function(cls) {
                                if (cls) {
                                    return errorWriter.appendError({
                                        _id: obj.localId,
                                        prpId: prp._id,
                                        name: obj.name,
                                        model: obj.model,
                                        profile: prf,
                                        msg: 'Profile parameter isNavigable for property "' + prp.name + '" should not have value "false", that renders the association unnavigable'
                                    })
                                }
                            });
                    }
                }
            });
        })
    }
    pr.then(function() {
        cb(null, obj);
    })

});

}

exports.shouldSkip = function(cls, profile) {
return (profile && cls.properties.every(prp => prp.profiles.indexOf(profile) === -1))
    || (cls.properties.every(prp => prp.profiles.length === 0))
}
