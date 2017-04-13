import { createAction, createActions, handleActions } from 'redux-actions';

// action creators
export const actions = {
    initApp: createAction('app/init'),
    selectPackage: createAction('app/package/select'),
    selectClass: createAction('app/class/select'),
    selectProperty: createAction('app/property/select')
};

// state
const initialState = {
    selectedPackage: null,
    selectedClass: null,
    selectedProperty: null
}

// reducer
export default handleActions({
    [actions.selectPackage]: selectPackage,
    [actions.selectClass]: selectClass,
    [actions.selectProperty]: selectProperty
}, initialState);


function selectPackage(state, action) {
    return {
        ...state,
        selectedPackage: action.payload
    }
}

function selectClass(state, action) {
    return {
        ...state,
        selectedClass: action.payload
    }
}

function selectProperty(state, action) {
    return {
        ...state,
        selectedProperty: action.payload
    }
}

// selectors
export const getSelectedPackage = (state) => state.app.selectedPackage
export const getSelectedClass = (state) => state.app.selectedClass
export const getSelectedProperty = (state) => state.app.selectedProperty