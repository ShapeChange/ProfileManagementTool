var through2 = require('through2');
var Promise = require("bluebird");

exports.createStream = function(modelReader, errorWriter, profile) {

return through2.obj(function(obj, enc, cb) {

    //console.log('CHECK', obj)

    if (profile && (!obj.profiles || obj.profiles.indexOf(profile) === -1)) {
        console.log('SKIP')
        errorWriter.clearErrors(obj.localId, obj.model, profile);
        this.push(obj);
        cb();
        return;
    }

    var filter = {
        profiles: {
            $not: {
                $all: obj.profiles
            }
        }
    }

    modelReader.getClassGraph(obj.localId, obj.model, false, {
        name: 1,
        profiles: 1,
    }, filter)
        .then(function(classes) {

            var prfs = profile ? [profile] : obj.profiles

            prfs.forEach(function(prf) {
                errorWriter.clearErrors(obj.localId, obj.model, prf);

                classes.forEach(function(cls) {

                    if (!cls.profiles || cls.profiles.indexOf(prf) === -1) {
                        errorWriter.appendError({
                            _id: obj.localId,
                            name: obj.name,
                            model: obj.model,
                            profile: prf,
                            msg: 'Super class "' + cls.name + '" is not included in profile'
                        })
                    }
                })
            })


            this.push(obj);
            cb();
        }.bind(this))
});

}
