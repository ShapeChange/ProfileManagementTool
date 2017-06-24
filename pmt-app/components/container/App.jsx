import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
import { Fragment, Link } from 'redux-little-router';
import { Container } from 'reactstrap';
import { translate } from 'react-i18next';

import { getModel, getSelectedProfile } from '../../reducers/model'
import { isMenuOpen, isErrorsOpen, isBusy, actions } from '../../reducers/app'
import { getToken, getUser, getSignupState, getLoginState, actions as authActions } from '../../reducers/auth'

import ModelBrowser from '../container/ModelBrowser'
import SideMenu from '../presentational/SideMenu'
import Login from '../presentational/Login'
import Navbar from '../presentational/Navbar'

import "../../scss/vendor/bootstrap-themed";
import "../../scss/vendor/font-awesome-woff-only";
import '../../scss/app';


@connect(
    (state, props) => {
        return {
            isMenuOpen: isMenuOpen(state),
            isErrorsOpen: isErrorsOpen(state),
            profile: state.model.models ? getSelectedProfile(state) : null,
            model: getModel(state),
            // TODO: normalize urls in LOCATION_CHANGE handler, use relative Links
            baseUrls: {
                pkg: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/package`,
                cls: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/class`,
                prp: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/property/${state.model.fetchedClass}`
            },
            busy: isBusy(state),
            token: getToken(state),
            user: getUser(state),
            signupState: getSignupState(state),
            loginState: getLoginState(state)
        }
    },
    (dispatch) => {
        return {
            ...bindActionCreators(actions, dispatch),
            ...bindActionCreators(authActions, dispatch)
        }
    })

@translate()

class App extends Component {

    render() {
        const {isMenuOpen, isErrorsOpen, toggleMenu, toggleErrors, model, profile, busy, baseUrls, user, t} = this.props;

        const navbarProps = {
            isMenuOpen,
            isErrorsOpen,
            toggleMenu,
            toggleErrors,
            model,
            profile,
            busy,
            baseUrls,
            user,
            t
        };

        const {signupState, loginState, createUser, loginUser} = this.props;

        const loginProps = {
            signupState,
            loginState,
            createUser,
            loginUser,
            t
        };

        return (
            <Fragment forRoute='/'>
                <div className="h-100">
                    <Navbar {...navbarProps} />
                    { /*<Route path="/model/:modelId?/:pkgId?" component={ ModelBrowser } />*/ }
                    <Fragment forRoute='/login(/)'>
                        <Login {...loginProps} />
                    </Fragment>
                    <Fragment forRoute='/profile'>
                        <Fragment forRoute='/:modelId/:profileId'>
                            <Container className="px-0 h-100" fluid style={ { paddingTop: '54px' } }>
                                { model && <ModelBrowser /> }
                            </Container>
                        </Fragment>
                    </Fragment>
                    { user && <SideMenu/> }
                </div>
            </Fragment>
        );
    }
}
;

//const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)

export default App
