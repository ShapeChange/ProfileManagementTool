//import { List, Map, fromJS } from 'immutable';
import update from 'immutability-helper';
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
    fetchModels: createAction('models/fetch'),
    fetchedModels: createAction('models/fetched'),
    fetchModel: createAction('model/fetch'),
    fetchedModel: createAction('model/fetched'),
    fetchPackage: createAction('package/fetch'),
    fetchedPackage: createAction('package/fetched'),
    fetchClass: createAction('class/fetch'),
    fetchedClass: createAction('class/fetched'),
    fetchedClasses: createAction('classes/fetched'),
    updateProfile: createAction('profile/update'),
    updatedProfile: createAction('profile/new')
};

// state
const initialState = {
    models: [],
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
    [actions.fetchedModels]: fetchedModels,
    [actions.fetchedModel]: fetchedModel,
    [actions.fetchedPackage]: fetchedPackage,
    [actions.fetchedClass]: fetchedClass,
    [actions.fetchedClasses]: fetchedClasses,
    [actions.updatedProfile]: updatedProfile
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


function fetchedModels(state, action) {
    return {
        ...state,
        models: action.payload
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

function updateProfile(state, action) {

    const mutation = action.payload.include
        ? {
            profiles: {
                $push: [action.payload.profile]
            }
        }
        : {
            profiles: {
                $apply: prf => prf.filter(i => i !== action.payload.profile)
            }
        }

    if (action.payload.type === 'prp') {
        const index = state.cls.properties.findIndex(prp => prp._id === action.payload.id)

        return update(state, {
            cls: {
                properties: {
                    [index]: mutation
                }
            }
        })
    } else if (action.payload.type === 'cls') {
        const index = state.classes.findIndex(cls => cls._id === action.payload.id)

        return update(state, {
            classes: {
                [index]: mutation
            }
        })
    }

    return state;
}

function updatedProfile(state, action) {

    var current = state;

    action.payload.forEach(elem => {
        if (elem.type === 'prp') {

        } else if (elem.type === 'cls') {
            const index = state.classes.findIndex(cls => cls._id === elem._id)

            if (index > -1) {
                let clsUpdate = {};
                if (state.cls && state.cls._id === elem._id) {
                    clsUpdate = {
                        profiles: {
                            $set: elem.profiles
                        }
                    }

                    if (elem.properties) {
                        clsUpdate.properties = elem.properties.reduce((upd, prp, i) => {
                            upd[i] = {
                                profiles: {
                                    $set: prp.profiles
                                }
                            }
                            return upd
                        }, {})
                    }
                }

                current = update(current, {
                    classes: {
                        [index]: {
                            profiles: {
                                $set: elem.profiles
                            }
                        }
                    },
                    cls: clsUpdate
                })
            }
        }
    })

    return current;
}

//selectors
export const getModels = (state) => state.model.models
export const getPackages = (state) => state.model.packages
export const getClasses = (state) => state.model.classes
export const getProperties = (state) => getClass(state) && _extractProperties(getClass(state).properties) //_reduceProperties(_extractProperties(getClass(state)), getClass(state))
export const getPackage = (state) => state.model.pkg
export const getClass = (state) => state.model.cls
export const getProperty = (state) => _extractProperty(getProperties(state), getSelectedProperty(state))
export const getPackageDetails = (state) => _extractDetails(getPackage(state))
export const getClassDetails = (state) => _extractDetails(getClass(state))
export const getPropertyDetails = (state, selectedProperty) => _extractDetails(getProperty(state, selectedProperty))
export const getExpandedItems = (state) => _getExpandedItems(state)
export const getPendingModel = (state) => state.model.pendingModel
export const getPendingPackage = (state) => state.model.pendingPackage
export const getPendingClass = (state) => state.model.pendingClass
export const getSelectedModel = (state) => state.router.params.modelId //state.model.pendingModel || state.model.fetchedModel
export const getSelectedModelName = (state) => getModels(state).length && getSelectedModel(state) ? getModels(state).find(mdl => mdl._id == getSelectedModel(state)).name : null
export const getSelectedProfile = (state) => state.router.params.profileId
export const getSelectedPackage = (state) => state.model.pendingPackage || state.model.fetchedPackage
export const getSelectedClass = (state) => state.router.params.classId //state.model.pendingClass || state.model.fetchedClass
export const getSelectedProperty = (state) => state.router.params.propertyId
export const getSelectedTab = (state) => state.router.params.tabId
export const isFocusOnPackage = (state) => state.router.params.packageId
export const isFocusOnClass = (state) => state.router.params.classId
export const isFocusOnProperty = (state) => state.router.params.propertyId
export const isItemClosed = (state) => state.router.query && state.router.query.closed === 'true'
export const getDetails = (state) => isFocusOnProperty(state) ? _extractDetails(getProperty(state)) : isFocusOnClass(state) ? _extractDetails(getClass(state)) : isFocusOnPackage(state) ? _extractDetails(getPackage(state)) : {}

const _getExpandedItems = (state) => {
    const rootPackages = state.model.packages.filter(pkg => pkg.parent === getSelectedModel(state))
    const expanded = rootPackages.map(pkg => pkg._id);

    let current = getSelectedPackage(state)

    while (current !== null) {
        if (current !== getSelectedPackage(state) || !(isFocusOnPackage(state) && isItemClosed(state)))
            expanded.push(current)

        let next = state.model.packages.find(pkg => pkg._id === current)
        current = next ? next.parent : null
    }

    if (getSelectedClass(state) && !isItemClosed(state))
        expanded.push(getSelectedClass(state))
    let cls = state.model.details //state.model.classes.find(cls => cls._id === getSelectedClass(state))
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
    const descriptors = details && details.descriptors && details.descriptors //&& details.element && details.element.children ? _reduceDescriptors(details.element.children.find(child => child.name === 'sc:descriptors')) : {}
    const taggedValues = details && details.taggedValues && details.taggedValues //&& details.element && details.element.children ? _reduceTaggedValues(details.element.children.find(child => child.name === 'sc:taggedValues')) : {}
    const stereotypes = details && details.stereotypes && details.stereotypes //&& details.element && details.element.children ? _reduceStereotypes(details.element.children.find(child => child && child.name === 'sc:stereotypes')) : []

    let d = {}
    if (details && details.type === 'prp') {
        if (details.typeId) {
            d.type = details.typeId
        }
        if (details.associationId) {
            d.association = details.associationId
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
        profiles: details && details.profiles,
        infos: infos
    }
}

/*const _reduceProperties = (properties, parent) => {
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
}*/