import { createAction, createActions, handleActions } from 'redux-actions';
import { actions as modelActions } from './model';
import { actions as authActions } from './auth';
import update from 'immutability-helper';

export const ItemType = {
    PKG: 'pkg',
    CLS: 'cls',
    PRP: 'prp',
    ASC: 'asc'
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
    toggleErrors: createAction('errors/toggle'),
    setSubmenusOpen: createAction('submenus/set'),
    toggleFlattenInheritance: createAction('flatten/inheritance/toggle'),
    toggleFlattenOninas: createAction('flatten/oninas/toggle'),
    createFileImport: createAction('file/import/create'),
    startFileImport: createAction('file/import/start'),
    endFileImport: createAction('file/import/done'),
    clearFileImport: createAction('file/import/clear'),
    progressFileImport: createAction('file/import/stats'),
    startFileExport: createAction('file/export/start'),
    endFileExport: createAction('file/export/done'),
    clearFileExport: createAction('file/export/clear'),
    progressFileExport: createAction('file/export/stats'),
    setFilter: createAction('filter/set'),
    applyFilter: createAction('filter/apply'),
    requestDelete: createAction('delete/request'),
    confirmDelete: createAction('delete/confirm'),
    cancelDelete: createAction('delete/cancel'),
    requestProfileEdit: createAction('profile/edit/request'),
    confirmProfileEdit: createAction('profile/edit/confirm'),
    cancelProfileEdit: createAction('profile/edit/cancel')
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
    errorsOpen: false,
    submenusOpen: {
        'View': true,
        'Model Files': true
    },
    flattenInheritance: false,
    flattenOninas: false,
    fileImport: {},
    fileExport: {},
    pendingFilter: {
        filter: '',
        pending: 0
    },
    filter: '',
    deleteRequested: [],
    profileEdit: {},
    allowedGeometries: []
}

// reducer
export default handleActions({
    [actions.initApp]: initApp,
    [actions.selectModel]: selectModel,
    [actions.selectPackage]: selectPackage,
    [actions.selectClass]: selectClass,
    [actions.selectProperty]: selectProperty,
    [actions.setView]: setView,
    [actions.setFont]: setFont,
    [actions.toggleMenu]: toggleMenu,
    [actions.toggleErrors]: toggleErrors,
    [actions.setSubmenusOpen]: setSubmenusOpen,
    [actions.toggleFlattenInheritance]: toggleFlattenInheritance,
    [actions.toggleFlattenOninas]: toggleFlattenOninas,
    [actions.createFileImport]: createFileImport,
    [actions.startFileImport]: startFileImport,
    [actions.endFileImport]: endFileImport,
    [actions.clearFileImport]: clearFileImport,
    [actions.progressFileImport]: progressFileImport,
    [actions.startFileExport]: startFileExport,
    [actions.endFileExport]: endFileExport,
    [actions.clearFileExport]: clearFileExport,
    [actions.progressFileExport]: progressFileExport,
    [actions.setFilter]: setFilter,
    [actions.requestDelete]: requestDelete,
    [actions.confirmDelete]: confirmDelete,
    [actions.cancelDelete]: cancelDelete,
    [actions.requestProfileEdit]: requestProfileEdit,
    [actions.confirmProfileEdit]: confirmProfileEdit,
    [actions.cancelProfileEdit]: cancelProfileEdit,
    [modelActions.fetchModel]: increaseFilterPending,
    [modelActions.fetchPackage]: increaseFilterPending,
    [modelActions.fetchClass]: increaseFilterPending,
    [modelActions.fetchedModel]: decreaseFilterPending,
    [modelActions.fetchedPackage]: decreaseFilterPending,
    [modelActions.fetchedClass]: decreaseFilterPending,
    [modelActions.updateProfile]: updateProfile,
    [modelActions.updateEditable]: updateEditable,
    [modelActions.updatedProfile]: updatedProfile,
    [modelActions.updatedEditable]: updatedEditable,
    [authActions.onUserLogin]: openMenu
}, initialState);



function initApp(state, action) {
    return {
        ...state,
        allowedGeometries: action.payload.geometry
    }
}

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

function openMenu(state) {
    return {
        ...state,
        menuOpen: true
    }
}

function toggleErrors(state) {
    return {
        ...state,
        errorsOpen: !state.errorsOpen
    }
}


function setSubmenusOpen(state, action) {
    return {
        ...state,
        submenusOpen: action.payload
    }
}

function toggleFlattenInheritance(state) {
    return {
        ...state,
        flattenInheritance: !state.flattenInheritance
    }
}

function toggleFlattenOninas(state) {
    return {
        ...state,
        flattenOninas: !state.flattenOninas
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
                written: 0,
                progress: 0
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

function progressFileExport(state, action) {
    return {
        ...state,
        fileExport: {
            ...state.fileExport,
            stats: {
                ...state.fileExport.stats,
                ...action.payload
            }
        }
    }
}

function clearFileExport(state) {
    return {
        ...state,
        fileExport: {}
    }
}

function setFilter(state, action) {
    const newState = {
        ...state,
        pendingFilter: {
            ...state.pendingFilter,
            filter: action.payload
        }
    }

    if (newState.pendingFilter.filter === '') {
        newState.disableBrowser = false
        newState.filter = ''
        newState.pendingFilter.pending = 0
    }

    return newState
}

function increaseFilterPending(state, action) {
    return {
        ...state,
        pendingFilter: {
            ...state.pendingFilter,
            pending: state.pendingFilter.pending + 1
        },
        disableBrowser: true
    }

    return state
}

function decreaseFilterPending(state, action) {
    const newState = {
        ...state,
        pendingFilter: {
            ...state.pendingFilter,
            pending: state.pendingFilter.pending - 1
        },
        disableBrowser: true
    }

    if (newState.pendingFilter.pending <= 0) {
        newState.pendingFilter.pending = 0
        newState.disableBrowser = false
        newState.filter = newState.pendingFilter.filter.toLowerCase()
    }

    return newState
}

function updateProfile(state, action) {

    return {
        ...state,
        busy: true
    }
}

function updateEditable(state, action) {

    return {
        ...state,
        busy: true
    }
}

function updatedProfile(state, action) {

    return {
        ...state,
        busy: false
    }
}

function updatedEditable(state, action) {

    return {
        ...state,
        busy: false
    }
}

function requestDelete(state, action) {

    return {
        ...state,
        deleteRequested: [
            ...state.deleteRequested,
            action.payload
        ]
    }
}

function confirmDelete(state, action) {

    return {
        ...state,
        deleteRequested: state.deleteRequested.filter(d => d !== action.payload.deleteId)
    }
}

function cancelDelete(state, action) {

    return {
        ...state,
        deleteRequested: state.deleteRequested.filter(d => d !== action.payload)
    }
}



function requestProfileEdit(state, action) {

    return update(state, {
        profileEdit: {
            [action.payload._id]: {
                $set: action.payload
            }
        }
    })
}

function confirmProfileEdit(state, action) {

    return update(state, {
        profileEdit: {
            $unset: [action.payload._id]
        }
    })
}

function cancelProfileEdit(state, action) {

    return update(state, {
        profileEdit: {
            $unset: [action.payload._id]
        }
    })
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
export const isErrorsOpen = (state) => state.app.errorsOpen
export const getSubmenusOpen = (state) => state.app.submenusOpen
export const isFlattenInheritance = (state) => state.app.flattenInheritance
export const isFlattenOninas = (state) => state.app.flattenOninas
export const hasFileImport = (state) => state.app.fileImport.name ? true : false
export const hasPendingFileImport = (state) => state.app.fileImport.pending && state.app.fileImport.stats ? true : false
export const getFileImport = (state) => state.app.fileImport
export const hasFileExport = (state) => state.app.fileExport.name ? true : false
export const hasPendingFileExport = (state) => state.app.fileExport.pending && state.app.fileExport.stats ? true : false
export const getFileExport = (state) => state.app.fileExport
export const getFilter = (state) => state.app.filter
export const getPendingFilter = (state) => state.app.pendingFilter
export const getBrowserDisabled = (state) => state.app.disableBrowser
export const isBusy = (state) => state.app.busy
export const getDeleteRequested = (state) => state.app.deleteRequested
export const getProfileEdit = (state) => state.app.profileEdit
export const getAllowedGeometries = (state) => state.app.allowedGeometries

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