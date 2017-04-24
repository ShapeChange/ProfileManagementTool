import { createAction, createActions, handleActions } from 'redux-actions';
import { LOCATION_CHANGED } from 'redux-little-router';

//import pkgs from '../../../pmt-io/pkgs'
//import clazzes from '../../../pmt-io/classes'

export const StereoType = {
    FT: 'featuretype',
    T: 'type',
    DT: 'datatype',
    CL: 'codelist',
    E: 'enumeration',
    U: 'union',
    AT: 'attribute',
    AR: 'associationrole'
}

// action creators
export const actions = {
    fetchModel: createAction('model/fetch'),
    fetchedModel: createAction('model/fetched'),
    fetchPackage: createAction('package/fetch'),
    fetchedPackage: createAction('package/fetched'),
    fetchClass: createAction('class/fetch'),
    fetchedClass: createAction('class/fetched'),

    //fetchedPackages: createAction('packages/fetched'),
    fetchedClasses: createAction('classes/fetched')
};

// state
const initialState = {
    packages: [],
    classes: [],
    mdl: null,
    pkg: null,
    cls: null,
    details: null,
    fetchedModel: null,
    pendingModel: null,
    fetchedPackage: null,
    pendingPackage: null,
    fetchedClass: null,
    pendingClass: null
}

// reducer
export default handleActions({
    [LOCATION_CHANGED]: onLocationChange,
    [actions.fetchedModel]: fetchedModel,
    [actions.fetchedPackage]: fetchedPackage,
    [actions.fetchedClass]: fetchedClass,
    //[actions.fetchedPackages]: fetchedPackages,
    [actions.fetchedClasses]: fetchedClasses,
//[actions.fetchedPackage]: fetchedPackage
}, initialState);

function onLocationChange(state, action) {
    let newState = state

    newState = syncModel(newState, action)
    newState = syncPackage(newState, action)
    newState = syncClass(newState, action)

    return newState
}

function syncModel(state, action) {
    const modelId = action.payload.params ? action.payload.params.modelId : null

    return !modelId || state.pendingModel === modelId || state.fetchedModel === modelId
        ? state
        : {
            ...state,
            packages: [],
            mdl: null,
            fetchedModel: null,
            pendingModel: modelId
        }
}

function syncPackage(state, action) {
    const packageId = action.payload.params ? action.payload.params.packageId : null

    return !packageId || state.pendingPackage === packageId || state.fetchedPackage === packageId
        ? state
        : {
            ...state,
            pkg: null,
            classes: [],
            fetchedPackage: null,
            pendingPackage: packageId
        }
}

function syncClass(state, action) {
    const classId = action.payload.params ? action.payload.params.classId : null

    return !classId || state.pendingClass === classId || state.fetchedClass === classId
        ? state
        : {
            ...state,
            cls: null,
            fetchedClass: null,
            pendingClass: classId
        }
}


function fetchedModel(state, action) {
    return state.pendingModel !== action.payload.fetchedModel
        ? state
        : {
            ...state,
            fetchedModel: action.payload.fetchedModel,
            packages: action.payload.packages,
            mdl: action.payload.model,
            pendingModel: null
        }
}


function fetchedPackage(state, action) {
    return state.pendingPackage && state.pendingPackage !== action.payload.fetchedPackage
        ? state
        : {
            ...state,
            fetchedPackage: action.payload.fetchedPackage,
            pkg: action.payload.details,
            pendingPackage: null
        }
}

function fetchedClass(state, action) {
    return state.pendingClass !== action.payload.fetchedClass
        ? state
        : {
            ...state,
            fetchedClass: action.payload.fetchedClass,
            cls: action.payload.details,
            pendingClass: null
        }
}



function fetchedClasses(state, action) {
    return {
        ...state,
        classes: action.payload
    }
}

//selectors
export const getPackages = (state) => state.model.packages
export const getClasses = (state) => state.model.classes
export const getProperties = (state) => getClass(state) && _extractProperties(getClass(state).properties) //_reduceProperties(_extractProperties(getClass(state)), getClass(state))
export const getPackage = (state) => state.model.pkg
export const getClass = (state) => state.model.cls
export const getProperty = (state) => _extractProperty(getProperties(state), getSelectedProperty(state))
export const getPackageDetails = (state) => _extractDetails(getPackage(state))
export const getClassDetails = (state) => _extractDetails(getClass(state))
export const getPropertyDetails = (state, selectedProperty) => _extractDetails(getProperty(state, selectedProperty))
export const getExpandedItems = (state, selectedPackage, selectedClass, selectedProperty) => _getExpandedItems(state, selectedPackage, selectedClass, selectedProperty)
export const getPendingModel = (state) => state.model.pendingModel
export const getPendingPackage = (state) => state.model.pendingPackage
export const getPendingClass = (state) => state.model.pendingClass
export const getSelectedModel = (state) => state.router.params.modelId //state.model.pendingModel || state.model.fetchedModel
export const getSelectedPackage = (state) => state.model.pendingPackage || state.model.fetchedPackage
export const getSelectedClass = (state) => state.router.params.classId //state.model.pendingClass || state.model.fetchedClass
export const getSelectedProperty = (state) => state.router.params.propertyId
export const getSelectedTab = (state) => state.router.params.tabId
export const isFocusOnPackage = (state) => state.router.params.packageId
export const isFocusOnClass = (state) => state.router.params.classId
export const isFocusOnProperty = (state) => state.router.params.propertyId
export const isItemClosed = (state) => state.router.query && state.router.query.closed === 'true'
export const getDetails = (state) => isFocusOnProperty(state) ? _extractDetails(getProperty(state)) : isFocusOnClass(state) ? _extractDetails(getClass(state)) : isFocusOnPackage(state) ? _extractDetails(getPackage(state)) : {}

const _getExpandedItems = (state, selectedPackage, selectedClass, selectedProperty) => {
    const rootPackage = state.model.packages.find(pkg => pkg.parent === null)
    const expanded = rootPackage ? [rootPackage._id] : [];

    let current = selectedPackage

    while (current !== null) {
        if (current !== selectedPackage || !(isFocusOnPackage(state) && isItemClosed(state)))
            expanded.push(current)

        let next = state.model.packages.find(pkg => pkg._id === current)
        current = next ? next.parent : null
    }

    if (selectedClass && !isItemClosed(state))
        expanded.push(selectedClass)
    let cls = state.model.details //state.model.classes.find(cls => cls._id === selectedClass)
    if (cls && cls.type === 'cls') {
        current = cls.parent

        while (current !== null) {
            expanded.push(current)

            let next = state.model.packages.find(pkg => pkg._id === current)
            current = next ? next.parent : null
        }
    }

    return expanded
}

const _extractProperties = (properties) => {
    return [].concat(properties)
        .sort(function(a, b) {
            return a.name > b.name ? 1 : -1
        })
//return details && details.element.children ? details.element.children.find(child => child && child.name === 'sc:properties') : null
}

const _extractProperty = (properties, selectedProperty) => {
    return properties ? properties.find(child => child._id === selectedProperty) : null
}

// TODO: is called three times, once for every even unrelated action
// move to backend or check reselect memorization
const _extractDetails = (details) => {
    const descriptors = details && details.element && details.element.children ? _reduceDescriptors(details.element.children.find(child => child.name === 'sc:descriptors')) : {}
    const taggedValues = details && details.element && details.element.children ? _reduceTaggedValues(details.element.children.find(child => child.name === 'sc:taggedValues')) : {}
    const stereotypes = details && details.element && details.element.children ? _reduceStereotypes(details.element.children.find(child => child && child.name === 'sc:stereotypes')) : []

    let d = {}
    if (details && details.type === 'prp') {
        if (details.typeName) {
            d.type = details.typeName
        }
        if (details.cardinality) {
            d.cardinality = details.cardinality
        }
        if (details.isAttribute) {
            d.isAttribute = details.isAttribute
        }
    }
    const stereo = stereotypes && stereotypes.length > 0 ? {
        stereotypes: stereotypes.reduce((sts, st) => `${sts}${sts.length ? ', ' : ''}${st}`, '')
    } : {}
    const supert = details && details.supertypes && details.supertypes.length > 0 ? {
        supertypes: details.supertypes
    } : {}
    const infos = Object.assign(d, stereo, supert, descriptors, taggedValues)

    return {
        _id: details && details._id,
        type: details && details.type,
        name: details && details.name,
        infos: infos
    }
}

const _reduceProperties = (properties, parent) => {
    return properties && properties.children ? properties.children.map(prop => {
        let p = prop.children.reduce((attrs, attr) => {
            let key = attr.name.substr(3);
            key = key === 'id' ? '_id' : key

            attrs[key] = attr.children && attr.children[0] ? attr.children[0].value : ''

            return attrs
        }, {});
        p.parent = parent._id;
        p.element = prop;
        p.type = 'prp'
        return p;
    }).sort((a, b) => a.name > b.name ? 1 : -1) : null;
}

const _reduceDescriptors = (details) => {
    return details && details.children ? details.children.reduce((attrs, attr) => {
        let key = attr.name.substr(3);
        let value = attr.children && attr.children[0] && attr.children[0].children[0] && attr.children[0].children[0].children[0] ? attr.children[0].children[0].children[0].value : ''

        if (key && value && value !== '')
            attrs[key] = value

        return attrs
    }, {}) : null;
}

const _reduceTaggedValues = (details) => {
    return details && details.children ? details.children.reduce((attrs, attr) => {
        let key = attr.children && attr.children[0] && attr.children[0].children[0] ? attr.children[0].children[0].value : null
        let value = key && attr.children[1] && attr.children[1].children[0] ? attr.children[1].children[0].children[0].value : ''
        if (key && key !== 'profiles' && key !== 'sequenceNumber' && value && value !== '')
            attrs[key] = value

        return attrs
    }, {}) : null;
}

const _reduceStereotypes = (details) => {
    return details && details.children ? details.children.reduce((attrs, attr) => {
        let value = attr.children && attr.children[0] ? attr.children[0].value : ''

        if (value && value !== '')
            attrs.push(value)

        return attrs
    }, []) : null;
}