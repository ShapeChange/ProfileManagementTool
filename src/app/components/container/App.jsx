import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
import { getSelectedPackage, getSelectedClass, getSelectedProperty, actions as appActions } from '../../reducers/app'
import { getPackages, getClasses, getPackage, getClass, actions } from '../../reducers/model'
import { Navbar, NavbarBrand, Container, Col, Row, Button, ListGroup, ListGroupItem, Card, CardImg, CardHeader, CardTitle, CardText, CardGroup, CardSubtitle, CardBlock } from 'reactstrap';
import TreeList from '../presentational/TreeList'


import 'bootstrap/dist/css/bootstrap.min.css';
import '../../less/app.css';
//require('./less/app.less')

const mapStateToProps = (state, props) => {
    return {
        packages: getPackages(state),
        classes: getClasses(state),
        packageDetails: getPackage(state),
        classDetails: getClass(state),
        selectedPackage: getSelectedPackage(state),
        selectedClass: getSelectedClass(state),
        selectedProperty: getSelectedProperty(state)
    }
}

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(appActions, dispatch),
    ...bindActionCreators(actions, dispatch),
    dispatch
});

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            focus: ''
        }
    }

    _selectPackage = (selected) => {
        const {selectedPackage, selectPackage, selectClass, selectProperty} = this.props;

        this.setState({
            focus: 'pkg'
        });

        if (selected !== selectedPackage) {
            selectPackage(selected);
            selectClass(null);
            selectProperty(null);
        }
    };

    _selectClass = (selected) => {
        const {selectedClass, selectClass, selectProperty} = this.props;

        this.setState({
            focus: 'cls'
        });

        if (selected !== selectedClass) {
            selectClass(selected);
            selectProperty(null);
        }
    };

    _selectProperty = (selected) => {
        const {selectedClass, selectClass, selectProperty} = this.props;
        this.setState({
            focus: 'prp'
        });
        //selectClass(selectedClass);
        selectProperty(selected);
    };

    _reduceDescriptors = (details) => {
        return details && details.children ? details.children.reduce((attrs, attr) => {
            let key = attr.name.substr(3);

            attrs[key] = attr.children && attr.children[0] && attr.children[0].children[0] && attr.children[0].children[0].children[0] ? attr.children[0].children[0].children[0].value : ''

            return attrs
        }, {}) : null;
    }

    _reduceTaggedValues = (details) => {
        return details && details.children ? details.children.reduce((attrs, attr) => {
            let key = attr.children && attr.children[0] && attr.children[0].children[0] ? attr.children[0].children[0].value : null
            let value = key && attr.children[1] && attr.children[1].children[0] ? attr.children[1].children[0].children[0].value : ''
            if (key)
                attrs[key] = value

            return attrs
        }, {}) : null;
    }

    render() {
        const {packages, classes, packageDetails, classDetails, selectedPackage, selectedClass, selectedProperty} = this.props;
        const {focus} = this.state;

        const rootPackage = packages.find(leaf => leaf.parent === null);
        const title = rootPackage ? rootPackage.name : 'ProfileManagementTool';
        const rootClass = selectedPackage && classes ? [{
            _id: selectedPackage,
            depth: 0,
            parent: null
        }].concat(classes.filter(cls => cls.parent === selectedPackage)) : null;

        let properties = classDetails && classDetails.element.children ? classDetails.element.children.find(child => child && child.name === 'sc:properties') : null

        properties = properties && properties.children ? properties.children.map(prop => {
            let p = prop.children.reduce((attrs, attr) => {
                let key = attr.name.substr(3);
                key = key === 'id' ? '_id' : key

                if (key === 'descriptors' || key === 'taggedValues') {
                    attrs[key] = attr
                } else {
                    attrs[key] = attr.children && attr.children[0] ? attr.children[0].value : ''
                }
                return attrs
            }, {});
            p.parent = selectedClass;
            return p;
        }) : null;

        const rootProperty = selectedClass && properties ? [{
            _id: selectedClass,
            depth: 0,
            parent: null
        }].concat(properties.sort((a, b) => a.name > b.name ? 1 : -1)) : null;


        let descriptors;
        let taggedValues;
        if (focus === 'prp' && properties && selectedProperty) {
            descriptors = this._reduceDescriptors(properties.find(child => child._id === selectedProperty).descriptors);

            taggedValues = this._reduceTaggedValues(properties.find(child => child._id === selectedProperty).taggedValues);
        } else if (focus == 'cls') {
            descriptors = classDetails && classDetails.element.children ? this._reduceDescriptors(classDetails.element.children.find(child => child.name === 'sc:descriptors')) : null;

            taggedValues = classDetails && classDetails.element.children ? this._reduceTaggedValues(classDetails.element.children.find(child => child.name === 'sc:taggedValues')) : null;
        } else if (focus == 'pkg') {
            descriptors = packageDetails && packageDetails.element.children ? this._reduceDescriptors(packageDetails.element.children.find(child => child.name === 'sc:descriptors')) : null;

            taggedValues = packageDetails && packageDetails.element.children ? this._reduceTaggedValues(packageDetails.element.children.find(child => child.name === 'sc:taggedValues')) : null;
        }

        return (
            <div>
                <Navbar color="inverse" inverse fixed="top">
                    <NavbarBrand href="#">
                        { title }
                    </NavbarBrand>
                </Navbar>
                <Container className="px-0 h-100" fluid style={ { paddingTop: '54px' } }>
                    <Row noGutters={ true } className="h-100">
                        <Col md="3">
                        <Card className="h-100 border-top-0 border-bottom-0 border-left-0">
                            <CardHeader>
                                Packages
                            </CardHeader>
                            <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                { rootPackage && <TreeList tree={ packages }
                                                     selected={ selectedPackage }
                                                     expanded={ [rootPackage._id] }
                                                     onSelect={ this._selectPackage }
                                                     focus={ focus === 'pkg' } /> }
                            </div>
                        </Card>
                        </Col>
                        <Col md="2">
                        <Card className="h-100 border-top-0 border-bottom-0 border-left-0">
                            <CardHeader>
                                Classes
                            </CardHeader>
                            <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                { rootClass && <TreeList tree={ rootClass }
                                                   selected={ selectedClass }
                                                   expanded={ [selectedPackage] }
                                                   onSelect={ this._selectClass }
                                                   focus={ focus === 'cls' } /> }
                            </div>
                        </Card>
                        </Col>
                        <Col md="2">
                        <Card className="h-100 border-top-0 border-bottom-0 border-left-0">
                            <CardHeader>
                                Properties
                            </CardHeader>
                            <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                { rootProperty && <TreeList tree={ rootProperty }
                                                      selected={ selectedProperty }
                                                      expanded={ [selectedClass] }
                                                      onSelect={ this._selectProperty }
                                                      focus={ focus === 'prp' } /> }
                            </div>
                        </Card>
                        </Col>
                        <Col md="5">
                        <Card className="h-100 border-0">
                            <CardHeader>
                                Details
                            </CardHeader>
                            <div className="p-3" style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                { descriptors && <div>
                                                     <h4>descriptors</h4>
                                                     { Object.keys(descriptors).map(key => <div key={ key } className="py-2">
                                                                                               <Row>
                                                                                                   <Col className="font-weight-bold">
                                                                                                   { key }
                                                                                                   </Col>
                                                                                                   <Col>
                                                                                                   { descriptors[key] }
                                                                                                   </Col>
                                                                                               </Row>
                                                                                           </div>) }
                                                 </div> }
                                { taggedValues && <div>
                                                      <h4 className="pt-3">tagged values</h4>
                                                      { Object.keys(taggedValues).map(key => <div key={ key } className="py-2">
                                                                                                 <Row>
                                                                                                     <Col className="font-weight-bold">
                                                                                                     { key }
                                                                                                     </Col>
                                                                                                     <Col>
                                                                                                     { taggedValues[key] }
                                                                                                     </Col>
                                                                                                 </Row>
                                                                                             </div>) }
                                                  </div> }
                            </div>
                        </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
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