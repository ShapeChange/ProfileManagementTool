const intoStream = require('into-stream');

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

const options = require('./setup');

var errors = []
var errorWriter = {
    appendError: function(error) {
        errors.push(error)
    },
    clearErrors: function(id, model, profile) {
        console.log('CLEAR', id, profile)
        errors = []
    }
}
const validate = require('../index.js').createStream.bind(null, options.modelReader, errorWriter, null)


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
    var tests = validate(function() {
        errors.should.have.length(6)

        errors[0].should.have.property('_id', params.clsId)
        errors[0].should.have.property('prpId', params.mandatoryPrpId)
        errors[0].should.have.property('profile', 'B')

        errors[1].should.have.property('_id', params.clsId)

        errors[2].should.have.property('_id', params.clsId)
        errors[2].should.have.property('prpId', params.optionalPrpId)
        errors[2].should.have.property('profile', 'C')

        errors[3].should.have.property('_id', params.clsId)
        errors[3].should.have.property('prpId', params.mandatoryPrpId)
        errors[3].should.have.property('profile', 'A')

        errors[4].should.have.property('_id', params.clsId)
        errors[4].should.have.property('prpId', params.mandatoryPrpId)
        errors[4].should.have.property('profile', 'A')

        errors[5].should.have.property('_id', params.clsId)
        errors[5].should.have.property('prpId', params.mandatoryPrpId)
        errors[5].should.have.property('profile', 'A')

        console.log('DONE', errors)
        done();
    });

    intoStream.obj(params.testClass).pipe(tests);
});

});

