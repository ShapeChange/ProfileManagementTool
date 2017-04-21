import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
//import { Route, BrowserRouter as Router } from 'react-router-dom'
//import { ConnectedRouter } from 'react-router-redux'
import { Fragment } from 'redux-little-router';

import { Navbar, NavbarBrand, Container } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import { getPackages } from '../../reducers/model'
import { useThreePaneView, useSmallerFont, Font, View, actions } from '../../reducers/app'
import ModelBrowser from '../container/ModelBrowser'


import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import '../../less/app.css';

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
        model: state.model.mdl ? state.model.mdl.name : '',
        profile: state.model.mdl && state.router.params ? state.router.params.profileId : '',
    }
}

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch)
});

class App extends Component {

    render() {
        const {packages, useThreePaneView, useSmallerFont, model, profile} = this.props;

        const rootPackage = packages.find(leaf => leaf.parent === null);
        const title = rootPackage ? rootPackage.name : 'ProfileManagementTool';

        return (
            <Fragment forRoute='/'>
                <div>
                    <Navbar color="inverse"
                        inverse
                        fixed="top"
                        className="flex-row">
                        <NavbarBrand tag="span">
                            PMT
                        </NavbarBrand>
                        <div className="navbar-text px-3">
                            <FontAwesome name="sitemap" className="pr-2" />
                            <span>{ model }</span>
                        </div>
                        <div className="navbar-text px-3">
                            <FontAwesome name="id-card" className="pr-2" />
                            <span>{ profile }</span>
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
                </div>
            </Fragment>
        );
    }
}
;



const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)

export default ConnectedApp

/*<Button color="primary"
    style={ { marginTop: '1rem' } }
    size="large"
    disabled={ running }
    onClick={ () => this._startTest() }>
    { running ? 'Testing...' : 'Start Test' }
</Button>*/