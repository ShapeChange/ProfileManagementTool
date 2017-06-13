const propertySpec = require('./spec_property');
const classSpec = require('./spec_class');
const options = require('./setup');

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;


describe('Profile Batch Editing', function() {

describe('Package', function() {

    describe('Add direct child classes with mandatory properties to profile', function() {

        const params = Object.assign({}, options, {
            include: true,
            onlyMandatory: true,
            recursive: false
        });

        const paramsSuperNonEditable = Object.assign({}, params, {
            clsId: '6'
        });

        const {clsId, profile, include, onlyMandatory, recursive, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForPackage('pkg', 'model', profile, include, onlyMandatory, recursive)
                .then(params.joinUpdates.bind(params))
                .then(params.joinUpdates.bind(paramsSuperNonEditable))
        });

        classSpec.shouldIncludeClass(params);

        classSpec.shouldIncludeSuperClasses(params);

        classSpec.shouldNotIncludeSubClasses(params);

        propertySpec.shouldIncludeMandatoryProperties(params);

        propertySpec.shouldNotIncludeAnyProperties(paramsSuperNonEditable, params.classes['6'].name);

    });

    describe('Add direct child classes with all properties to profile', function() {});

    describe('Add all classes in subpackages with mandatory properties to profile', function() {});

    describe('Add all classes in subpackages with all properties to profile', function() {});

    describe('Remove direct child classes with all properties from profile', function() {});

    describe('Remove all classes in subpackages with all properties from profile', function() {});

});

describe('Class', function() {

    describe('include all properties with full view', function() {

        const params = Object.assign({}, options, {
            include: true,
            onlyMandatory: false,
            onlyChildren: true
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren)
                .then(params.joinUpdates.bind(params))
        });

        classSpec.shouldNotIncludeClass(params);

        propertySpec.shouldIncludeAllProperties(params);

    });

    describe('include all properties with flattened inheritance', function() {

        const params = Object.assign({}, options, {
            include: true,
            onlyMandatory: false,
            onlyChildren: true,
            recursive: true
        });

        const paramsSuper = Object.assign({}, params, {
            clsId: params.superClsId
        });

        const paramsSuperNonEditable = Object.assign({}, params, {
            clsId: '6'
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, recursive, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren, recursive)
                .then(params.joinUpdates.bind(params))
                .then(paramsSuper.joinUpdates.bind(paramsSuper))
                .then(paramsSuper.joinUpdates.bind(paramsSuperNonEditable))
        });

        classSpec.shouldNotIncludeClass(params);

        classSpec.shouldNotIncludeClass(paramsSuper, params.classes['3'].name);

        propertySpec.shouldIncludeAllProperties(params);

        propertySpec.shouldIncludeAllProperties(paramsSuper, params.classes['3'].name);

        propertySpec.shouldNotIncludeAnyProperties(paramsSuperNonEditable, params.classes['6'].name);

    });

    describe('exclude optional properties with full view', function() {

        const params = Object.assign({}, options, {
            include: false,
            onlyMandatory: true,
            onlyChildren: true
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren)
                .then(params.joinUpdates.bind(params))
        });

        classSpec.shouldNotExcludeClass(params);

        propertySpec.shouldExcludeOptionalProperties(params);

    });

    describe('exclude optional properties with flattened inheritance', function() {

        const params = Object.assign({}, options, {
            include: false,
            onlyMandatory: true,
            onlyChildren: true,
            recursive: true
        });

        const paramsSuper = Object.assign({}, params, {
            clsId: params.superClsId
        });

        const {clsId, profile, include, onlyMandatory, onlyChildren, recursive, editor} = params;

        before(function() {

            return editor.getProfileUpdatesForClass(clsId, 'model', profile, include, onlyMandatory, onlyChildren, recursive)
                .then(params.joinUpdates.bind(params))
                .then(paramsSuper.joinUpdates.bind(paramsSuper))
        });

        classSpec.shouldNotExcludeClass(params);

        classSpec.shouldNotExcludeClass(paramsSuper);

        propertySpec.shouldExcludeOptionalProperties(params);

        propertySpec.shouldExcludeOptionalProperties(paramsSuper);

    });

});

});
