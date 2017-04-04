import { createAction, createActions, handleActions } from 'redux-actions';

// action creators
export const actions = {
    testStart: createAction('test/start'),
    testBackend: createAction('test/backend'),
    testDb: createAction('test/db'),
    testEnd: createAction('test/end')
};

// state
const initialState = {
	initial: true,
    running: false,
    backend: false,
    db: false
}

// reducer
export default handleActions({
    [actions.testStart]: startTest,
    [actions.testBackend]: testedBackend,
    [actions.testDb]: testedDb,
    [actions.testEnd]: endTest
}, initialState);

function startTest(state, action) {
    return {
        ...state,
		initial: false,
        running: true,
        backend: false,
        db: false
    }
}

function testedBackend(state, action) {
    return {
        ...state,
        backend: true
    }
}

function testedDb(state, action) {
    return {
        ...state,
        db: true
    }
}

function endTest(state, action) {
    return {
        ...state,
        running: false
    }
}

//selectors
export const getStatus = (state) => state.test.running
export const getInitial = (state) => state.test.initial
export const getBackendStatus = (state) => state.test.backend
export const getDbStatus = (state) => state.test.db