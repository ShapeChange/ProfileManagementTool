//import { List, Map, fromJS } from 'immutable';
import update from 'immutability-helper';
import { createAction, createActions, handleActions } from 'redux-actions';
import { LOCATION_CHANGED } from 'redux-little-router';
import { actions as authActions } from './auth';

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
    fetchedPackages: createAction('packages/fetched'),
    fetchClass: createAction('class/fetch'),
    fetchedClass: createAction('class/fetched'),
    fetchedClasses: createAction('classes/fetched'),
    updateProfile: createAction('profile/update'),
    updatedProfile: createAction('profile/new'),
    updateEditable: createAction('editable/update'),
    updatedEditable: createAction('editable/new')
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
    [actions.fetchedPackages]: fetchedPackages,
    [actions.fetchedClass]: fetchedClass,
    [actions.fetchedClasses]: fetchedClasses,
    [actions.updatedProfile]: updatedProfile,
    [actions.updatedEditable]: updatedEditable,
    [authActions.logoutUser]: clear
}, initialState);

function clear(state) {
    return initialState;
}

function onLocationChange(state, action) {
    let newState = state

    newState = syncModel(newState, action)
    newState = syncPackage(newState, action)
    newState = syncClass(newState, action)

    return newState
}

function syncModel(state, action) {
    const modelId = action.payload.params ? action.payload.params.modelId : null

    return state.pendingModel === modelId || state.fetchedModel === modelId
        ? state
        : {
            ...state,
            mdl: null,
            fetchedModel: null,
            pendingModel: modelId,
            packages: [],
            pkg: null,
            fetchedPackage: null,
            pendingPackage: null,
            classes: [],
            cls: null,
            fetchedClass: null,
            pendingClass: null
        }
}

function syncPackage(state, action) {
    const packageId = action.payload.params ? action.payload.params.packageId : null

    return !packageId || state.pendingPackage === packageId || state.fetchedPackage === packageId
        ? state
        : {
            ...state,
            pkg: null,
            fetchedPackage: null,
            pendingPackage: packageId,
            classes: [],
            cls: null,
            fetchedClass: null,
            pendingClass: null
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
    return {
        ...state,
        fetchedModel: action.payload.fetchedModel,
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
    return {
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

function fetchedPackages(state, action) {
    return {
        ...state,
        packages: action.payload
    }
}

function updatedProfile(state, action) {

    var current = state;

    action.payload.forEach(elem => {
        if (elem.type === 'prp') {

        } else if (elem.type === 'cls') {
            let clsUpdate = {};
            if (state.cls && state.cls._id === elem._id) {
                clsUpdate = {
                    profiles: {
                        $set: elem.profiles
                    },
                    profileParameters: {
                        $set: elem.profileParameters || state.cls.profileParameters
                    }
                }
            }

            if (elem.properties && state.cls) {
                if (state.cls._id === elem._id) {
                    clsUpdate.properties = elem.properties.reduce((upd, prp, i) => {
                        upd[i] = {
                            profiles: {
                                $set: prp.profiles
                            },
                            profileParameters: {
                                $set: prp.profileParameters || state.cls.properties[i].profileParameters
                            }
                        }
                        return upd
                    }, {})
                } else /*if (state.app.flattenInheritance)*/ {
                    clsUpdate.properties = elem.properties.reduce((upd, prp, i) => {
                        const j = state.cls.properties.findIndex(prp2 => prp._id === prp2._id)
                        if (j > -1) {
                            upd[j] = {
                                profiles: {
                                    $set: prp.profiles
                                },
                                profileParameters: {
                                    $set: prp.profileParameters || state.cls.properties[i].profileParameters
                                }
                            }
                        }
                        return upd
                    }, {})
                }
            }

            const index = state.classes.findIndex(cls => cls._id === elem._id)

            if (index > -1) {
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
            } else {
                current = update(current, {
                    cls: clsUpdate
                })
            }
        }
    })

    return current;
}

function updatedEditable(state, action) {

    var current = state;

    action.payload.forEach(elem => {
        const index = state.packages.findIndex(pkg => pkg._id === elem._id)

        if (index > -1) {
            let pkgUpdate = {};
            if (state.pkg && state.pkg._id === elem._id) {
                pkgUpdate = {
                    editable: {
                        $set: elem.editable
                    }
                }
            }

            current = update(current, {
                packages: {
                    [index]: {
                        editable: {
                            $set: elem.editable
                        }
                    }
                },
                pkg: pkgUpdate
            })
        } else {
            const indexCls = state.classes.findIndex(cls => cls.localId === elem.localId)

            if (indexCls > -1) {
                let clsUpdate = {};
                if (state.cls && state.cls.localId === elem.localId) {
                    clsUpdate = {
                        editable: {
                            $set: elem.editable
                        }
                    }
                }

                current = update(current, {
                    classes: {
                        [indexCls]: {
                            editable: {
                                $set: elem.editable
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
export const getModel = (state) => state.model.mdl
export const getPackages = (state) => state.model.packages
export const getClasses = (state) => (state.app.flattenInheritance || state.app.flattenOninas) ? state.model.classes.filter(cls => ((!state.app.flattenInheritance || !cls.isAbstract) && (!state.app.flattenOninas || (!cls.isMeta && !cls.isReason)))) : state.model.classes
export const getProperties = (state) => getClass(state) && _extractProperties(getClass(state), getDefaultPropertyInfoValues(state)) //_reduceProperties(_extractProperties(getClass(state)), getClass(state))
export const getPropertiesClean = (state) => getClass(state) && _extractProperties(getClass(state), [])
export const getPackage = (state) => state.model.pkg
export const getClass = (state) => state.model.cls
export const getProperty = (state) => _extractProperty(getPropertiesClean(state), getSelectedProperty(state))
export const getPackageDetails = (state) => _extractDetails(getPackage(state))
export const getClassDetails = (state) => _extractDetails(getClass(state))
export const getPropertyDetails = (state, selectedProperty) => _extractDetails(getProperty(state, selectedProperty))
export const getExpandedItems = (state) => _getExpandedItems(state)
export const getPendingModel = (state) => state.model.pendingModel
export const getPendingPackage = (state) => state.model.pendingPackage
export const getPendingClass = (state) => state.model.pendingClass
export const getSelectedModel = (state) => state.router.params.modelId //state.model.pendingModel || state.model.fetchedModel
export const getSelectedProfile = (state) => state.router.params.profileId
export const getSelectedPackage = (state) => state.model.pendingPackage || state.model.fetchedPackage
export const getSelectedClass = (state) => state.router.params.classId //state.model.pendingClass || state.model.fetchedClass
export const getSelectedProperty = (state) => state.router.params.propertyId && decodeURIComponent(decodeURIComponent(state.router.params.propertyId))
export const getSelectedTab = (state) => state.router.params.tabId
export const isFocusOnPackage = (state) => state.router.params.packageId
export const isFocusOnClass = (state) => state.router.params.classId
export const isFocusOnProperty = (state) => state.router.params.propertyId
export const isItemClosed = (state) => state.router.query && state.router.query.closed === 'true'
export const getDetails = (state) => isFocusOnProperty(state) ? _extractDetails(getProperty(state), getDefaultPropertyInfoValues(state), state.app.showDefaultValues) : isFocusOnClass(state) ? _extractDetails(getClass(state), getDefaultClassInfoValues(state), state.app.showDefaultValues) : isFocusOnPackage(state) ? _extractDetails(getPackage(state)) : {}
export const getDefaultPropertyInfoValues = (state) => state.app.defaultInfoValues.properties
export const getDefaultClassInfoValues = (state) => state.app.defaultInfoValues.classes

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

const _extractProperties = (cls, defaults) => {
    return [].concat(cls.properties)
        .sort(function (a, b) {
            return a.name > b.name ? 1 : -1
        }).map(prp => ({
            ...prp,
            ..._getPropertyInfos(prp, defaults, true),
            editable: prp.parent === cls._id ? cls.editable : cls.superEditable && cls.superEditable.find(s => prp.parent === s._id).editable
        }))
    //return details && details.element.children ? details.element.children.find(child => child && child.name === 'sc:properties') : null
}

const _extractProperty = (properties, selectedProperty) => {
    return properties ? properties.find(child => child._id === selectedProperty) : null
}

const _getPropertyInfos = (details, defaults, notAsString, ignoreDefaults) => {
    const infos = {};

    for (var key of Object.keys(defaults)) {
        const value = _computeInfoValue(key, details, defaults, notAsString, ignoreDefaults);
        if (value !== undefined) {
            infos[key] = value;
        }
    }

    return infos;
}

const _computeInfoValue = (key, details, defaults, notAsString, ignoreDefaults) => {
    if (details.hasOwnProperty(key)
        && details[key] !== null
        && details[key] !== undefined) {
        return details[key];
    }
    if (defaults.hasOwnProperty(key) && !ignoreDefaults) {
        //console.log('DEFAULT', key, defaults[key])
        return notAsString ? defaults[key] : `${defaults[key]} (default)`;
    }

    return undefined;
}

// TODO: is called three times, once for every even unrelated action
// move to backend or check reselect memorization
const _extractDetails = (details, defaults, showDefaultValues) => {
    const descriptors = details && details.descriptors && details.descriptors //&& details.element && details.element.children ? _reduceDescriptors(details.element.children.find(child => child.name === 'sc:descriptors')) : {}
    //const taggedValues = details && details.taggedValues && details.taggedValues //&& details.element && details.element.children ? _reduceTaggedValues(details.element.children.find(child => child.name === 'sc:taggedValues')) : {}
    const stereotypes = details && details.stereotypes && details.stereotypes //&& details.element && details.element.children ? _reduceStereotypes(details.element.children.find(child => child && child.name === 'sc:stereotypes')) : []

    let d = {}
    if (details && details.type === 'prp') {
        if (details.typeId) {
            d.type = {
                ...details.typeId,
                _id: details.typeId.localId
            }
        }
    }
    if (details && details.associationId) {
        d.association = details.associationId
        if (details && details.type === 'prp' && details.associationId.assocClassId) {
            d.associationClass = details.associationId.assocClassId
        }
        if (details && details.type === 'cls' && details.associationId.end1) {
            d.end1 = details.associationId.end1
        }
        if (details && details.type === 'cls' && details.associationId.end2) {
            d.end2 = details.associationId.end2
        }
        if (details && details.type === 'prp') {
            if (details.associationId.end1 && details.associationId.end1.parent && details.associationId.end1.localId !== details.localId) {
                d.reverseProperty = {
                    localId: details.associationId.end1.parent,
                    properties: [
                        {
                            localId: details.associationId.end1.localId,
                            name: details.associationId.end1.name
                        }
                    ]
                }
            }
            else if (details.associationId.end1 && details.associationId.end1.properties && details.associationId.end1.properties.length && details.associationId.end1.properties[0].localId !== details.localId) {
                d.reverseProperty = details.associationId.end1;
            }
            if (details.associationId.end2 && details.associationId.end2.parent && details.associationId.end2.localId !== details.localId) {
                d.reverseProperty = {
                    localId: details.associationId.end2.parent,
                    properties: [
                        {
                            localId: details.associationId.end2.localId,
                            name: details.associationId.end2.name
                        }
                    ]
                }
            }
            else if (details.associationId.end2 && details.associationId.end2.properties && details.associationId.end2.properties.length && details.associationId.end2.properties[0].localId !== details.localId) {
                d.reverseProperty = details.associationId.end2;
            }
        }
    }
    if (details && details.end1) {
        d.end1 = details.end1
    }
    if (details && details.end2) {
        d.end2 = details.end2
    }
    const stereo = stereotypes && stereotypes.length > 0 ? {
        stereotypes: stereotypes.reduce((sts, st) => `${sts}${sts.length ? ', ' : ''}${st}`, '')
    } : {}
    const supert = details && details.supertypes && details.supertypes.length > 0 ? {
        supertypes: details.supertypes
    } : {}
    const subt = details && details.subtypes && details.subtypes.length > 0 ? {
        subtypes: details.subtypes
    } : {}
    const otherInfos = details && (details.type === 'cls' || details.type === 'prp') ? _getPropertyInfos(details, defaults, false, !showDefaultValues) : {};
    const otherDetails = details && (details.type === 'cls' || details.type === 'prp') ? _getPropertyInfos(details, defaults, true) : {};

    const infos = Object.assign(d, stereo, supert, subt, otherInfos, descriptors)

    const taggedValues = details && details.taggedValues && Object.keys(details.taggedValues).length !== 0 ? { taggedValues: details.taggedValues } : {}

    return {
        _id: details && details._id,
        type: details && details.type,
        name: details && details.name,
        parent: details && details.parent,
        editable: details && details.editable,
        superEditable: details && details.superEditable,
        optional: details && details.optional,
        profiles: details && details.profiles,
        profileParameters: details && details.profileParameters,
        infos: infos,
        ...taggedValues,
        ...otherDetails
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
