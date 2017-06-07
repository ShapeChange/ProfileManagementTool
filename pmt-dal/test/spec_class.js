const chai = require('chai');
const should = chai.should();

exports.shouldIncludeClass = shouldIncludeClass;
exports.shouldNotIncludeClass = shouldNotIncludeClass;
exports.shouldExcludeClass = shouldExcludeClass;
exports.shouldNotExcludeClass = shouldNotExcludeClass;
exports.shouldIncludeSuperClasses = shouldIncludeSuperClasses;
exports.shouldNotIncludeSubClasses = shouldNotIncludeSubClasses;
exports.shouldNotExcludeSuperClasses = shouldNotExcludeSuperClasses;
exports.shouldExcludeSubClasses = shouldExcludeSubClasses;


function shouldIncludeClass(params) {

    const {clsId, profile, include, getUpdateEntry} = params;

    it('should add profile to given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include));
        params.updatedClasses.should.have.deep.property(`${clsId}.profiles.${profile}`, include);
    });
}

function shouldExcludeClass(params) {

    const {clsId, profile, include, getUpdateEntry} = params;

    it('should remove profile from given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(clsId, profile, include));
        params.updatedClasses.should.have.deep.property(`${clsId}.profiles.${profile}`, include);
    });
}

function shouldNotIncludeClass(params) {

    const {clsId, profile, include, getUpdateEntry} = params;

    it('should not add profile to given class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.profiles.${profile}`);
    });
}

function shouldNotExcludeClass(params) {

    const {clsId, profile, include, getUpdateEntry} = params;

    it('should not remove profile from given class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(clsId, profile, include));
        params.updatedClasses.should.not.have.deep.property(`${clsId}.profiles.${profile}`);
    });
}

// TODO: shouldIncludeMandatoryProperties
function shouldIncludeSuperClasses(params) {

    const {superClsId, profile, include} = params;

    it('should add profile to super classes of given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(superClsId, profile, include));
        params.updatedClasses.should.have.deep.property(`${superClsId}.profiles.${profile}`, include);
    });
}

function shouldNotIncludeSubClasses(params) {

    const {subClsId, profile, include} = params;

    it('should not add profile to sub classes of given class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(subClsId, profile, include));
        params.updatedClasses.should.not.have.deep.property(`${subClsId}.profiles.${profile}`);
    });
}

function shouldNotExcludeSuperClasses(params) {

    const {superClsId, profile, include} = params;

    it('should not remove profile from super classes of given class', function() {

        //params.updatedClasses.should.include(getUpdateEntry(superClsId, profile, include));
        params.updatedClasses.should.not.have.deep.property(`${superClsId}.profiles.${profile}`);
    });
}

function shouldExcludeSubClasses(params) {

    const {subClsId, profile, include} = params;

    it('should remove profile from sub classes of given class', function() {

        //params.updatedClasses.should.not.include(getUpdateEntry(subClsId, profile, include));
        params.updatedClasses.should.have.deep.property(`${subClsId}.profiles.${profile}`, include);
    });
}










