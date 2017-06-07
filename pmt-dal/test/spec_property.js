const chai = require('chai');
const should = chai.should();

exports.shouldIncludeProperty = shouldIncludeProperty;
exports.shouldExcludeProperty = shouldExcludeProperty;
exports.shouldIncludeMandatoryProperties = shouldIncludeMandatoryProperties;
exports.shouldExcludeOptionalProperties = shouldExcludeOptionalProperties;
exports.shouldIncludeAllProperties = shouldIncludeAllProperties;
exports.shouldExcludeAllProperties = shouldExcludeAllProperties;


function shouldIncludeProperty(params) {

    const {clsId, profile, include, mandatoryPrpId, mandatoryPrpIdIndex} = params;
    const {getTypeIdForProperty} = params;

    it('should add profile to given property', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId));
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`, include);
    });

    it('should add profile to type of given property', function() {

        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(mandatoryPrpId), profile, include));
        params.updatedClasses.should.have.deep.property(`${getTypeIdForProperty(clsId, mandatoryPrpId)}.profiles.${profile}`, include);
    });

}

function shouldExcludeProperty(params) {

    const {clsId, profile, include, mandatoryPrpId, mandatoryPrpIdIndex} = params;
    const {getTypeIdForProperty} = params;

    it('should remove profile from given property', function() {

        //updatedClasses.should.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId));
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`, include);
    });

    it('should not remove profile from type of given property', function() {

        //updatedClasses.should.not.include(getUpdateEntry(getTypeIdForProperty(mandatoryPrpId), profile, include));
        params.updatedClasses.should.not.have.deep.property(`${getTypeIdForProperty(clsId, mandatoryPrpId)}.profiles.${profile}`);
    });

}

function shouldIncludeMandatoryProperties(params) {

    const {clsId, profile, include, mandatoryPrpId, mandatoryPrpIdIndex, optionalPrpId, optionalPrpIdIndex} = params;
    const {getUpdateEntry, getTypeIdForProperty} = params;

    it('should add profile to mandatory properties of given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId));
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`, include);
    });

    it('should not add profile to optional properties of given class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include, optionalPrpId));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`);
    });

    it('should add profile to types of mandatory properties', function() {

        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(mandatoryPrpId), profile, include));
        params.updatedClasses.should.have.deep.property(`${getTypeIdForProperty(clsId, mandatoryPrpId)}.profiles.${profile}`, include);
    });

    it('should not add profile to types of optional properties', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(getTypeIdForProperty(optionalPrpId), profile, include));
        params.updatedClasses.should.not.have.deep.property(`${getTypeIdForProperty(clsId, optionalPrpId)}.profiles.${profile}`);
    });
}

function shouldIncludeAllProperties(params) {

    const {clsId, profile, include, mandatoryPrpId, mandatoryPrpIdIndex, optionalPrpId, optionalPrpIdIndex} = params;
    const {getUpdateEntry, getTypeIdForProperty} = params;

    it('should add profile to all properties of given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId, optionalPrpId));
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`, include);
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`, include);
    });

    it('should add profile to types of all properties', function() {

        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(mandatoryPrpId), profile, include));
        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(optionalPrpId), profile, include));
        params.updatedClasses.should.have.deep.property(`${getTypeIdForProperty(clsId, mandatoryPrpId)}.profiles.${profile}`, include);
        params.updatedClasses.should.have.deep.property(`${getTypeIdForProperty(clsId, optionalPrpId)}.profiles.${profile}`, include);
    });
}

function shouldExcludeOptionalProperties(params) {

    const {clsId, profile, include, mandatoryPrpId, mandatoryPrpIdIndex, optionalPrpId, optionalPrpIdIndex} = params;
    const {getUpdateEntry, getTypeIdForProperty} = params;

    it('should remove profile from optional properties of given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId));
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`, include);
    });

    it('should not remove profile from mandatory properties of given class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include, optionalPrpId));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`);
    });

    it('should not remove profile from types of optional properties', function() {

        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(mandatoryPrpId), profile, include));
        params.updatedClasses.should.not.have.deep.property(`${getTypeIdForProperty(clsId, optionalPrpId)}.profiles.${profile}`);
    });

    it('should not remove profile from types of mandatory properties', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(getTypeIdForProperty(optionalPrpId), profile, include));
        params.updatedClasses.should.not.have.deep.property(`${getTypeIdForProperty(clsId, mandatoryPrpId)}.profiles.${profile}`);
    });
}

function shouldExcludeAllProperties(params) {

    const {clsId, profile, include, mandatoryPrpId, mandatoryPrpIdIndex, optionalPrpId, optionalPrpIdIndex} = params;
    const {getUpdateEntry, getTypeIdForProperty} = params;

    it('should remove profile from any properties of given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include, mandatoryPrpId, optionalPrpId));
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${mandatoryPrpIdIndex}\\.profiles.${profile}`, include);
        params.updatedClasses.should.have.deep.property(`${clsId}.properties\\.${optionalPrpIdIndex}\\.profiles.${profile}`, include);
    });

    it('should not remove profile from types of any properties', function() {

        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(mandatoryPrpId), profile, include));
        //params.updatedClasses.should.include(getUpdateEntry(getTypeIdForProperty(optionalPrpId), profile, include));
        params.updatedClasses.should.not.have.deep.property(`${getTypeIdForProperty(clsId, mandatoryPrpId)}.profiles.${profile}`);
        params.updatedClasses.should.not.have.deep.property(`${getTypeIdForProperty(clsId, optionalPrpId)}.profiles.${profile}`);
    });
}





