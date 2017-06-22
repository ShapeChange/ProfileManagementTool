import { createAction, createActions, handleActions } from 'redux-actions';
import update from 'immutability-helper';


// action creators
export const actions = {
    createUser: createAction('user/create'),
    onUserCreated: createAction('user/create/success'),
    onUserCreateError: createAction('user/create/error'),
    loginUser: createAction('user/login'),
    onUserLogin: createAction('user/login/success'),
    onUserLoginError: createAction('user/login/error'),
    logoutUser: createAction('user/logout')
};


// state
const initialState = {
    token: null,
    user: null,
    loginState: {},
    signupState: {}
}


// reducer
export default handleActions({
    [actions.createUser]: createUser,
    [actions.onUserCreated]: onUserCreated,
    [actions.onUserCreateError]: onUserCreateError,
    [actions.loginUser]: loginUser,
    [actions.onUserLogin]: onUserLogin,
    [actions.onUserLoginError]: onUserLoginError,
    [actions.logoutUser]: logoutUser
}, initialState);

function createUser(state, action) {

    return {
        ...state,
        signupState: {
            pending: true
        }
    }
}

function onUserCreated(state, action) {

    return {
        ...state,
        signupState: {
            pending: false,
            error: false,
            msg: `User with name '${action.payload.name}' was created successfully, proceed to login`
        }
    }
}

function onUserCreateError(state, action) {

    return {
        ...state,
        signupState: {
            pending: false,
            error: true,
            msg: action.payload.msg
        }
    }
}

function loginUser(state, action) {

    return {
        ...state,
        loginState: {
            pending: true
        }
    }
}

function onUserLogin(state, action) {

    return {
        ...state,
        loginState: {
            pending: false,
            error: false,
            msg: `User with name '${action.payload.user.name}' was logged in successfully`
        },
        user: action.payload.user,
        token: action.payload.token
    }
}

function onUserLoginError(state, action) {

    return {
        ...state,
        loginState: {
            pending: false,
            error: true,
            msg: action.payload.msg
        }
    }
}

function logoutUser(state, action) {

    return initialState;
}


// selectors
export const getToken = (state) => state.auth.token
export const getUser = (state) => state.auth.user
export const getSignupState = (state) => state.auth.signupState
export const getLoginState = (state) => state.auth.loginState
