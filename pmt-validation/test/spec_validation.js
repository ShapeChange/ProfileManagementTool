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
const config = {
    geometry: ["P", "C", "S", "So", "MP", "MC", "MS", "MSo"]
}
const validate = require('../index.js').createStream.bind(null, config, options.modelReader, errorWriter, null)


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
        console.log('DONE', errors)

        errors.should.have.length(9)

        errors[0].should.have.property('_id', params.clsId)
        errors[0].should.have.property('prpId', params.mandatoryPrpId)
        errors[0].should.have.property('profile', 'B')

        errors[1].should.have.property('_id', params.clsId)

        errors[2].should.have.property('_id', params.clsId)

        errors[3].should.have.property('_id', params.clsId)

        errors[4].should.have.property('_id', params.clsId)

        errors[5].should.have.property('_id', params.clsId)
        errors[5].should.have.property('prpId', params.optionalPrpId)
        errors[5].should.have.property('profile', 'C')

        errors[6].should.have.property('_id', params.clsId)
        errors[6].should.have.property('prpId', params.mandatoryPrpId)
        errors[6].should.have.property('profile', 'A')

        errors[7].should.have.property('_id', params.clsId)
        errors[7].should.have.property('prpId', params.mandatoryPrpId)
        errors[7].should.have.property('profile', 'A')

        errors[8].should.have.property('_id', params.clsId)
        errors[8].should.have.property('prpId', params.mandatoryPrpId)
        errors[8].should.have.property('profile', 'A')


        done();
    });

    intoStream.obj(params.testClass).pipe(tests);
});

});

