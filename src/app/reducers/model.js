import { createAction, createActions, handleActions } from 'redux-actions';

//import pkgs from '../../../pmt-io/pkgs'
//import clazzes from '../../../pmt-io/classes'

// action creators
export const actions = {
    fetchedPackages: createAction('packages/fetched'),
    fetchedClasses: createAction('classes/fetched'),
    fetchedPackage: createAction('package/fetched'),
    fetchedClass: createAction('class/fetched')
};

// state
const initialState = {
    packages: [],
    classes: [],
    pkg: null,
    cls: null
}

// reducer
export default handleActions({
    [actions.fetchedPackages]: fetchedPackages,
    [actions.fetchedClasses]: fetchedClasses,
    [actions.fetchedPackage]: fetchedPackage,
    [actions.fetchedClass]: fetchedClass
}, initialState);


function fetchedPackages(state, action) {
    return {
        ...state,
        packages: action.payload
    }
}

function fetchedClasses(state, action) {
    return {
        ...state,
        classes: action.payload
    }
}

function fetchedPackage(state, action) {
    return {
        ...state,
        pkg: action.payload
    }
}

function fetchedClass(state, action) {
    return {
        ...state,
        cls: action.payload
    }
}

//selectors
export const getPackages = (state) => state.model.packages
export const getClasses = (state) => state.model.classes
export const getPackage = (state) => state.model.pkg
export const getClass = (state) => state.model.cls
