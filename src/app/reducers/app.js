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
    setFont: createAction('font/set'),
    toggleMenu: createAction('menu/toggle'),
    setSubmenusOpen: createAction('submenus/set'),
    createFileImport: createAction('file/import/create'),
    startFileImport: createAction('file/import/start'),
    endFileImport: createAction('file/import/done'),
    clearFileImport: createAction('file/import/clear'),
    progressFileImport: createAction('file/import/stats'),
    startFileExport: createAction('file/export/start'),
    endFileExport: createAction('file/export/done'),
    clearFileExport: createAction('file/export/clear'),
    progressFileExport: createAction('file/export/stats')
};

// state
const initialState = {
    selectedModel: null,
    selectedPackage: null,
    selectedClass: null,
    selectedProperty: null,
    focus: null,
    useThreePaneView: false,
    useSmallerFont: false,
    menuOpen: false,
    submenusOpen: {},
    fileImport: {},
    fileExport: {}
}

// reducer
export default handleActions({
    [actions.selectModel]: selectModel,
    [actions.selectPackage]: selectPackage,
    [actions.selectClass]: selectClass,
    [actions.selectProperty]: selectProperty,
    [actions.setView]: setView,
    [actions.setFont]: setFont,
    [actions.toggleMenu]: toggleMenu,
    [actions.setSubmenusOpen]: setSubmenusOpen,
    [actions.createFileImport]: createFileImport,
    [actions.startFileImport]: startFileImport,
    [actions.endFileImport]: endFileImport,
    [actions.clearFileImport]: clearFileImport,
    [actions.progressFileImport]: progressFileImport,
    [actions.startFileExport]: startFileExport,
    [actions.endFileExport]: endFileExport,
    [actions.clearFileExport]: clearFileExport,
    [actions.progressFileExport]: progressFileExport,
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

function toggleMenu(state) {
    return {
        ...state,
        menuOpen: !state.menuOpen
    }
}


function setSubmenusOpen(state, action) {
    return {
        ...state,
        submenusOpen: action.payload
    }
}

function createFileImport(state, action) {
    return {
        ...state,
        fileImport: {
            pending: false,
            name: action.payload.name,
            valid: action.payload.valid
        }
    }
}

function startFileImport(state, action) {
    return {
        ...state,
        fileImport: {
            pending: true,
            name: action.payload.metadata.name,
            stats: {
                size: action.payload.metadata.size,
                written: 0
            }
        }
    }
}

function endFileImport(state, action) {
    if (state.fileImport.pending && state.fileImport.name === action.payload.metadata.name) {

        return {
            ...state,
            fileImport: {
                ...state.fileImport,
                pending: false,
                model: action.payload.stats.model,
                stats: {
                    ...state.fileImport.stats,
                    ...action.payload.stats
                }
            }
        }
    }
    return state;
}

function progressFileImport(state, action) {
    return {
        ...state,
        fileImport: {
            ...state.fileImport,
            stats: {
                ...state.fileImport.stats,
                ...action.payload
            }
        }
    }
}

function clearFileImport(state) {
    return {
        ...state,
        fileImport: {}
    }
}

function startFileExport(state, action) {
    return {
        ...state,
        fileExport: {
            ...action.payload,
            pending: true,
            stats: {
            }
        }
    }
}

function endFileExport(state, action) {
    return {
        ...state,
        fileExport: {
            ...state.fileExport,
            pending: false,
            data: action.payload
        }
    }
}

function progressFileExport(state) {
    return {
        ...state
    }
}

function clearFileExport(state) {
    return {
        ...state,
        fileExport: {}
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
export const isMenuOpen = (state) => state.app.menuOpen
export const getSubmenusOpen = (state) => state.app.submenusOpen
export const hasFileImport = (state) => state.app.fileImport.name ? true : false
export const hasPendingFileImport = (state) => state.app.fileImport.pending && state.app.fileImport.stats ? true : false
export const getFileImport = (state) => state.app.fileImport
export const hasFileExport = (state) => state.app.fileExport.name ? true : false
export const hasPendingFileExport = (state) => state.app.fileExport.pending && state.app.fileExport.stats ? true : false
export const getFileExport = (state) => state.app.fileExport

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