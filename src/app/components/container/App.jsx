import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
//import { Route, BrowserRouter as Router } from 'react-router-dom'
//import { ConnectedRouter } from 'react-router-redux'
import { Fragment, Link } from 'redux-little-router';

import { Navbar, NavbarBrand, Container, Button, Badge, Popover, PopoverTitle, PopoverContent, ListGroup, ListGroupItem } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import { getPackages, getModel, getSelectedProfile } from '../../reducers/model'
import { useThreePaneView, useSmallerFont, isMenuOpen, isErrorsOpen, isBusy, Font, View, actions } from '../../reducers/app'
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
        isErrorsOpen: isErrorsOpen(state),
        profile: state.model.models ? getSelectedProfile(state) : null,
        model: getModel(state),
        // TODO: normalize urls in LOCATION_CHANGE handler, use relative Links
        baseUrls: {
            pkg: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/package`,
            cls: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/class`,
            prp: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/property/${state.model.fetchedClass}`
        },
        busy: isBusy(state)
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
        const {packages, useThreePaneView, useSmallerFont, isMenuOpen, isErrorsOpen, toggleMenu, toggleErrors, model, profile, busy, baseUrls} = this.props;

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
                                       <span>{ model.name }</span>
                                   </div> }
                        { model && profile && <div className="navbar-text px-3">
                                                  <FontAwesome name="id-card" className="pr-2" />
                                                  <span>{ model.profiles[profile].name }</span>
                                              </div> }
                        { model && profile && <div className="navbar-text ml-auto">
                                                  { busy ? <FontAwesome name="spinner" pulse />
                                                    : model.profiles[profile].errors.length > 0
                                                    ? <div>
                                                          <Link id="errors"
                                                              href={ '' }
                                                              title="Show Errors"
                                                              onClick={ (e) => {
                                                                            e.preventDefault();
                                                                            toggleErrors();
                                                                        } }>
                                                          <Badge color="danger" className="rounded-circle">
                                                              { model.profiles[profile].errors.length }
                                                          </Badge>
                                                          </Link>
                                                          <Popover placement="bottom right"
                                                              isOpen={ isErrorsOpen }
                                                              target="errors"
                                                              toggle={ toggleErrors }>
                                                              <PopoverTitle>
                                                                  Errors
                                                              </PopoverTitle>
                                                              <PopoverContent className="p-0">
                                                                  <ListGroup className="border-0 rounded-0">
                                                                      { model.profiles[profile].errors.map((err, i) => <ListGroupItem key={ i } className={ `rounded-0 border-left-0 border-right-0 border-bottom-0 ${i === 0 && 'border-top-0'}` }>
                                                                                                                           <Link href={ `${baseUrls['cls']}/${err._id}` } title={ err.name } className="text-danger">
                                                                                                                           { `Consistency error in class "${err.name}":` }
                                                                                                                           <br/>
                                                                                                                           { err.msg }
                                                                                                                           </Link>
                                                                                                                       </ListGroupItem>
                                                                        ) }
                                                                  </ListGroup>
                                                              </PopoverContent>
                                                          </Popover>
                                                      </div>
                                                    : <FontAwesome name="check" className="text-success" /> }
                                              </div> }
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
