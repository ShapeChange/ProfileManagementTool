// walk over test files
// call with common interface
// pass modelReader if needed
// use i18next for error messages
//
// how to run this for import? start after import is ready and walk over profiles one at a time?
// then remember already checked super classes -> set valid flag
//
// or stream all classes from db into validation (only relevant information, e.g. id, profiles, supertypes)
// then run e.g. getClassGraph with filter to only get super classes that are not part of the profile
// so if valid, there is no write access at all

var through2 = require('through2');
var Promise = require("bluebird");
var multipipe = require('multipipe');
var requireAll = require('require-all');
var writer = require('flush-write-stream')

exports.createStream = function(config, modelReader, errorWriter, profile, onFinish) {

var tests = requireAll({
    dirname: __dirname,
    filter: function(fileName) {
        //return fileName === 'class-include-parents.js';
        return fileName !== 'index.js' && fileName;
    },
    resolve: function(test) {
        return test.createStream(config, modelReader, errorWriter, profile);
    },
    recursive: false
});

var testArray = Object.keys(tests).map(key => tests[key])

var init = through2.obj(function(obj, enc, cb) {

    console.log('INIT')

    var prfs = profile ? [profile] : obj.profiles

    prfs.forEach(prf => {
        errorWriter.clearErrors(obj.localId, obj.model, prf);
    })

    cb(null, obj);
});

testArray.unshift(init);

var start = Date.now()

var deadend = writer.obj(function(obj, enc, cb) {
    cb();
}, function(cb) {
    if (onFinish)
        onFinish();

    console.log('Consistency checks finished, took ' + (Date.now() - start) + 'ms')

    cb();
});

var pipeline = multipipe(testArray);
pipeline.pipe(deadend);

return pipeline;
}


