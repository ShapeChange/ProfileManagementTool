const propertySpec = require('./spec_property');
const classSpec = require('./spec_class');
const options = require('./setup');

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;


describe('Profile Batch Editing', function() {

describe('Class', function() {

    describe('include mandatory properties', function() {

        const params = Object.assign(options, {
            include: true,
            onlyMandatory: true,
            onlyChildren: true
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren)
                .then(params.joinUpdates)
        });

        classSpec.shouldNotIncludeClass(params);

        propertySpec.shouldIncludeMandatoryProperties(params);

    });

    describe('include all properties', function() {

        const params = Object.assign(options, {
            include: true,
            onlyMandatory: false,
            onlyChildren: true
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren)
                .then(params.joinUpdates)
        });

        classSpec.shouldNotIncludeClass(params);

        propertySpec.shouldIncludeAllProperties(params);

    });

    describe('exclude optional properties', function() {

        const params = Object.assign(options, {
            include: false,
            onlyMandatory: true,
            onlyChildren: true
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren)
                .then(params.joinUpdates)
        });

        classSpec.shouldNotExcludeClass(params);

        propertySpec.shouldExcludeOptionalProperties(params);

    });

    describe('exclude all properties', function() {

        const params = Object.assign(options, {
            include: false,
            onlyMandatory: false,
            onlyChildren: true
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren)
                .then(params.joinUpdates)
        });

        classSpec.shouldNotExcludeClass(params);

        propertySpec.shouldExcludeAllProperties(params);

    });

});

});
