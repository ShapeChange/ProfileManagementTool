import { createAction, createActions, handleActions } from 'redux-actions';

export const ItemType = {
    PKG: 'pkg',
    CLS: 'cls',
    PRP: 'prp',
};

export const Font = {
    NORMAL: 'normal',
    SMALL: 'small'
};

export const View = {
    SINGLE_PANE: 'single',
    THREE_PANE: 'three'
};

// action creators
export const actions = {
    initApp: createAction('app/init'),
    selectModel: createAction('app/model/select'),
    selectPackage: createAction('app/package/select'),
    selectClass: createAction('app/class/select'),
    selectProperty: createAction('app/property/select'),
    setView: createAction('view/set'),
    setFont: createAction('font/set')
};

// state
const initialState = {
    selectedModel: null,
    selectedPackage: null,
    selectedClass: null,
    selectedProperty: null,
    focus: null,
    useThreePaneView: false,
    useSmallerFont: false
}

// reducer
export default handleActions({
    [actions.selectModel]: selectModel,
    [actions.selectPackage]: selectPackage,
    [actions.selectClass]: selectClass,
    [actions.selectProperty]: selectProperty,
    [actions.setView]: setView,
    [actions.setFont]: setFont
}, initialState);


function selectModel(state, action) {
    return action.payload === state.selectedModel
        ? state
        : {
            ...state,
            selectedModel: action.payload,
            selectedPackage: null,
            selectedClass: null,
            selectedProperty: null,
            focus: null
        }
}


function selectPackage(state, action) {
    return action.payload === state.selectedPackage
        ? state
        : {
            ...state,
            selectedPackage: action.payload,
            selectedClass: null,
            selectedProperty: null,
            focus: action.payload ? ItemType.PKG : state.focus
        }
}

function selectClass(state, action) {
    return action.payload === state.selectedClass
        ? state
        : {
            ...state,
            selectedClass: action.payload,
            selectedProperty: null,
            focus: action.payload ? ItemType.CLS : state.focus
        }
}

function selectProperty(state, action) {
    return action.payload === state.selectedProperty
        ? state
        : {
            ...state,
            selectedProperty: action.payload,
            focus: action.payload ? ItemType.PRP : state.focus
        }
}

function setView(state, action) {
    return {
        ...state,
        useThreePaneView: action.payload === View.THREE_PANE
    }
}

function setFont(state, action) {
    return {
        ...state,
        useSmallerFont: action.payload === Font.SMALL
    }
}

// selectors
export const getSelectedModel = (state) => state.app.selectedModel
export const getSelectedPackage = (state) => state.app.selectedPackage
export const getSelectedClass = (state) => state.app.selectedClass
export const getSelectedProperty = (state) => state.app.selectedProperty
export const isFocusOnPackage = (state) => state.app.focus === ItemType.PKG
export const isFocusOnClass = (state) => state.app.focus === ItemType.CLS
export const isFocusOnProperty = (state) => state.app.focus === ItemType.PRP
export const useThreePaneView = (state) => state.app.useThreePaneView
export const useSmallerFont = (state) => state.app.useSmallerFont

// is backend sync needed
const doesChangeSelectedPackage = (state, action) => state.app.selectedPackage !== action.payload
const doesChangeSelectedClass = (state, action) => state.app.selectedClass !== action.payload
const doesChangeSelectedProperty = (state, action) => state.app.selectedProperty !== action.payload

export const doesChangeState = (state, action) => {
    const cond = {
        [actions.selectPackage]: doesChangeSelectedPackage,
        [actions.selectClass]: doesChangeSelectedClass,
        [actions.selectProperty]: doesChangeSelectedProperty
    };
    return !cond[action.type] || cond[action.type](state, action);
}