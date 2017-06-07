const propertySpec = require('./spec_property');
const classSpec = require('./spec_class');
const options = require('./setup');

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

// TODO: tests for packages, tests for editable
describe('Profile Editing', function() {

describe('include property', function() {

    const params = Object.assign(options, {
        include: true
    });

    const {clsId, profile, include, mandatoryPrpId, optionalPrpIdIndex, editor} = params;

    before(function() {

        return editor.getProfileUpdatesForProperty(clsId, mandatoryPrpId, 'model', profile, include)
            .then(params.joinUpdates)
    });

    propertySpec.shouldIncludeProperty(params);

    it('should not add profile to other properties of parent class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include, optionalPrpId));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`);
    });

    it('should not add profile to parent class of given property', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.profiles.${profile}`);
    });
});

describe('exclude property', function() {

    const params = Object.assign(options, {
        include: false
    });

    const {clsId, profile, include, mandatoryPrpId, optionalPrpIdIndex, editor} = params;

    before(function() {

        return editor.getProfileUpdatesForProperty(clsId, mandatoryPrpId, 'model', profile, include)
            .then(params.joinUpdates)
    });

    propertySpec.shouldExcludeProperty(params);

    it('should not remove profile from other properties of parent class', function() {

        //updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include, optionalPrpId));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`);
    });

    it('should not remove profile from parent class of given property', function() {

        //updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.profiles.${profile}`);
    });

});

// TODO: test for recursive addition of same class, shouldn't happen
describe('include class', function() {

    const params = Object.assign(options, {
        include: true
    });

    const {clsId, profile, include, editor} = params;

    before(function() {

        return editor.getProfileUpdatesForClass(clsId, 'model', profile, include)
            .then(params.joinUpdates)
    });

    classSpec.shouldIncludeClass(params);

    classSpec.shouldIncludeSuperClasses(params);

    classSpec.shouldNotIncludeSubClasses(params);

    propertySpec.shouldIncludeMandatoryProperties(params);

});

describe('exclude class', function() {

    const params = Object.assign(options, {
        include: false
    });

    const {clsId, profile, include, mandatoryPrpId, optionalPrpId, mandatoryPrpIdIndex, optionalPrpIdIndex, editor, getTypeIdForProperty} = params;

    before(function() {

        return editor.getProfileUpdatesForClass(clsId, 'model', profile, include)
            .then(params.joinUpdates)
    });

    classSpec.shouldExcludeClass(params);

    classSpec.shouldNotExcludeSuperClasses(params);

    classSpec.shouldExcludeSubClasses(params);

    propertySpec.shouldExcludeAllProperties(params);


    /*it('should not remove profile from any properties of given class', function() {

        //updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId, optionalPrpId));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`);
        params.updatedClasses.should.not.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`);
    });*/


    it('should remove profile from any optional properties that use given class as type', function() {

        return editor.getProfileUpdatesForClass(getTypeIdForProperty(clsId, optionalPrpId), 'model', profile, include)
            .then(params.joinUpdates)
            .then(function() {
                params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`, include);

            })
    });

});

});
