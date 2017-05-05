import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
//import { Route, BrowserRouter as Router } from 'react-router-dom'
//import { ConnectedRouter } from 'react-router-redux'
import { Fragment, Link } from 'redux-little-router';

import { Navbar, NavbarBrand, Container, Button, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import { getPackages, getSelectedModelName, getSelectedProfile } from '../../reducers/model'
import { useThreePaneView, useSmallerFont, isMenuOpen, Font, View, actions } from '../../reducers/app'
import ModelBrowser from '../container/ModelBrowser'
import SideMenu from '../presentational/SideMenu'

import "../../scss/vendor/bootstrap-themed";
import "../../scss/vendor/font-awesome-woff-only";
import '../../scss/app';

/*
* icons
* - bar
* - bell(-o)
* - comment(-o)
* - external-link
* - folder(-open)(-o)
* - cog
* - edit
* - code
* - download
* - ellipsis(-v)
* - minus
* - plus
* - sign-(in|out)
* - spinner
* - search
* - tag(s)
* - toggle-(on|off)
* - trash(-o)
* - user(-o)
* - upload
* - warning
* - chevron-(right|down)
* - th-list or server or tasks
* - cube or hdd-o or ticket
* - align-left or list-alt
* - columns
* 
 */

const mapStateToProps = (state, props) => {
    return {
        packages: getPackages(state),
        useThreePaneView: useThreePaneView(state),
        useSmallerFont: useSmallerFont(state),
        isMenuOpen: isMenuOpen(state),
        model: state.model.models ? getSelectedModelName(state) : null,
        profile: state.model.models ? getSelectedProfile(state) : null
    }
}

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch)
});

class App extends Component {

    toggleMenu = (e) => {
        const {toggleMenu} = this.props;

        toggleMenu();

        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
        }
    }

    render() {
        const {packages, useThreePaneView, useSmallerFont, isMenuOpen, toggleMenu, model, profile} = this.props;

        const rootPackage = packages.find(leaf => leaf.parent === null);
        const title = rootPackage ? rootPackage.name : 'ProfileManagementTool';

        return (
            <Fragment forRoute='/'>
                <div className="h-100">
                    <Navbar color="inverse"
                        inverse
                        fixed="top"
                        className="flex-row">
                        <Button color="info" onClick={ this.toggleMenu } className={ 'menu-button' + (isMenuOpen ? ' active' : '') }>
                            <FontAwesome name="bars" />
                        </Button>
                        <NavbarBrand tag="span">
                            PMT
                        </NavbarBrand>
                        { model && <div className="navbar-text px-3">
                                       <FontAwesome name="sitemap" className="pr-2" />
                                       <span>{ model }</span>
                                   </div> }
                        { model && profile && <div className="navbar-text px-3">
                                                  <FontAwesome name="id-card" className="pr-2" />
                                                  <span>{ profile }</span>
                                              </div> }
                        <div className="navbar-text ml-auto">
                            <Link href={ '' } title="Show Errors" onClick={ (e) => {
                                                                                e.preventDefault();
                                                                            } }>
                            <FontAwesome name="bell-o" className="text-danger" />
                            <Badge color="danger" className="rounded-circle error-count">
                                5
                            </Badge>
                            </Link>
                        </div>
                    </Navbar>
                    <Container className="px-0 h-100" fluid style={ { paddingTop: '54px' } }>
                        { /*<Route path="/model/:modelId?/:pkgId?" component={ ModelBrowser } />*/ }
                        <Fragment forRoute='/profile'>
                            <Fragment forRoute='/:modelId/:profileId'>
                                <ModelBrowser />
                            </Fragment>
                        </Fragment>
                    </Container>
                    <SideMenu/>
                </div>
            </Fragment>
        );
    }
}
;

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)

export default ConnectedApp
