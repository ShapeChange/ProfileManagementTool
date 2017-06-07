const intoStream = require('into-stream');

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

const options = require('./setup');

var errors = []
const validator = require('../index.js').createStream(options.modelReader, {
    appendError: appendError,
    clearErrors: function() {}
});


describe('Consistency checks', function() {

const params = Object.assign(options, {});

before(function() {

    return options.modelReader.getClass(options.clsId)
        .then(function(cls) {
            params.testClass = cls;

            return options.modelReader.getClass(options.superClsId)
        })
        .then(function(cls) {
            params.testSuperClass = cls;
        })
});

it('should work', function(done) {
    var stream = intoStream.obj(params.testClass).pipe(validator);

    stream.on('finish', function() {
        errors.should.have.length(1)
        errors[0].should.have.property('_id', params.testClass.localId)

        console.log('DONE', errors)
        done();
    })
});

});

function appendError(error) {
    errors.push(error)
}