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
        pr = Promise.map(obj.properties, prp => {

            var prfs = profile ? (prp.profiles.indexOf(profile) > -1 ? [profile] : []) : prp.profiles
            return Promise.map(prfs, prf => {
                if (prp.profiles.indexOf(prf) > -1 && prp.profileParameters[prf] && prp.profileParameters[prf].isNavigable) {

                    if (prp.isAttribute) {
                        return errorWriter.appendError(obj.model, prf, {
                            _id: obj.localId,
                            prpId: prp._id,
                            prpName: prp.name,
                            name: obj.name,
                            msg: 'notAnAssociationRole'
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
                                    return errorWriter.appendError(obj.model, prf, {
                                        _id: obj.localId,
                                        prpId: prp._id,
                                        prpName: prp.name,
                                        name: obj.name,
                                        msg: 'rendersAssociationUnnavigable'
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
