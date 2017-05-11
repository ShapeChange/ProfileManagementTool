import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import { Card, CardHeader } from 'reactstrap';

import { useThreePaneView, useSmallerFont, Font, View, actions } from '../../reducers/app'
import { getSelectedModel, getSelectedProfile, getSelectedPackage, getSelectedClass, getSelectedProperty, getSelectedTab, getDetails, getPackages, getClasses, getProperties, getExpandedItems, actions as modelActions } from '../../reducers/model'

import ModelBrowserPanes from '../presentational/ModelBrowserPanes'
import ModelBrowserTree from '../presentational/ModelBrowserTree'
import ModelBrowserDetails from '../presentational/ModelBrowserDetails'
import ModelElement from '../presentational/ModelElement'

const mapStateToProps = (state, props) => {
    return {
        packages: getPackages(state),
        classes: getClasses(state),
        properties: getProperties(state),
        details: getDetails(state), //isFocusOnPackage(state) ? getPackageDetails(state) : isFocusOnClass(state) ? getClassDetails(state) : isFocusOnProperty(state) ? getPropertyDetails(state, getSelectedProperty(state)) : null,
        selectedModel: getSelectedModel(state),
        selectedProfile: getSelectedProfile(state),
        selectedPackage: getSelectedPackage(state),
        selectedClass: getSelectedClass(state),
        selectedProperty: getSelectedProperty(state),
        selectedTab: getSelectedTab(state),
        isFocusOnPackage: getDetails(state).type === 'pkg', //isFocusOnPackage(state),
        isFocusOnClass: getDetails(state).type === 'cls', //isFocusOnClass(state),
        isFocusOnProperty: getDetails(state).type === 'prp', //isFocusOnProperty(state),
        useThreePaneView: useThreePaneView(state),
        useSmallerFont: useSmallerFont(state),
        expanded: getExpandedItems(state),
        // TODO: normalize urls in LOCATION_CHANGE handler, use relative Links
        baseUrls: {
            pkg: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/package`,
            cls: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/class`,
            prp: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/property/${state.model.fetchedClass}`
        },
        query: state.router.search,
        title: state.model.mdl ? state.model.mdl.name : ''
    }
}

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch),
    ...bindActionCreators(modelActions, dispatch)
});

class ModelBrowser extends Component {

    _setNormalFont = (e) => {
        this._setFont(e, Font.NORMAL);
    }

    _setSmallFont = (e) => {
        this._setFont(e, Font.SMALL);
    }

    _setFont = (e, font) => {
        const {setFont} = this.props;

        e.stopPropagation();
        e.currentTarget.blur();

        setFont(font);
    }

    _setThreePaneView = (e) => {
        this._setView(e, View.THREE_PANE);
    }

    _setSinglePaneView = (e) => {
        this._setView(e, View.SINGLE_PANE);
    }

    _setView = (e, view) => {
        const {setView} = this.props;

        e.stopPropagation();
        e.currentTarget.blur();

        setView(view);
    }

    _getSeparateTrees = () => {
        const {packages, classes, properties, selectedPackage, selectedClass} = this.props;

        const classTree = selectedPackage && classes ? classes.filter(cls => cls.parent === selectedPackage) : null;

        const propertyTree = selectedClass && properties ? properties.filter(prp => prp.parent === selectedClass) : null;

        return {
            packageTree: packages,
            classTree: classTree,
            propertyTree: propertyTree
        }
    }

    _getTrees = (separate) => {
        const {packages, classes, properties, selectedPackage, selectedClass} = this.props;

        const classTree = selectedPackage && classes ? classes.filter(cls => cls.parent === selectedPackage) : [];

        const propertyTree = selectedClass && properties ? properties.filter(prp => prp.parent === selectedClass) : [];


        return separate
            ? {
                packageTree: packages,
                classTree: classTree,
                propertyTree: propertyTree
            }
            : {
                packageTree: packages.concat(classTree).concat(propertyTree)
            }
    }

    _getSingleTree = () => {
        const {packages, classes, properties, selectedPackage, selectedClass} = this.props;

        let packageTree = packages;
        if (classes)
            packageTree = packageTree.concat(classes.filter(cls => cls.parent === selectedPackage))
        if (properties)
            packageTree = packageTree.concat(properties.filter(prp => prp.parent === selectedClass))

        return packageTree
    }

    _renderDetails = () => {
        const {details, selectedModel, selectedProfile, selectedTab, selectedPackage, selectedClass, classes, properties, baseUrls, query, updateProfile} = this.props;

        let items
        if (details.type === 'pkg') {
            items = classes.filter(cls => cls.parent === selectedPackage)
        } else if (details.type === 'cls' && properties) {
            items = properties.filter(prp => prp.parent === selectedClass)
        }

        return (
            <Card className="h-100 border-0">
                <CardHeader className="text-nowrap d-flex flex-row" style={ { minHeight: '50px', height: '50px' } }>
                    { details.name && <ModelElement element={ { ...details.infos, ...details } } color="default" /> }
                </CardHeader>
                { details._id &&
                  <ModelBrowserDetails selectedTab={ selectedTab }
                      selectedModel={ selectedModel }
                      selectedProfile={ selectedProfile }
                      updateProfile={ updateProfile }
                      items={ items }
                      baseUrls={ baseUrls }
                      urlSuffix={ query }
                      {...details}/> }
            </Card>
        );
    }

    _getItems = () => {
        const {details, selectedPackage, selectedClass, classes, properties} = this.props;

        let items
        if (details.type === 'pkg') {
            items = classes.filter(cls => cls.parent === selectedPackage)
        } else if (details.type === 'cls' && properties) {
            items = properties.filter(prp => prp.parent === selectedClass)
        }

        return items
    }

    render() {
        const {useThreePaneView, details, query} = this.props;

        //const tree = useThreePaneView ? this._getSeparateTrees() : this._getSingleTree()

        //const modelBrowserDetails = this._renderDetails()

        const handlers = {
            onSetSinglePaneView: this._setSinglePaneView,
            onSetThreePaneView: this._setThreePaneView,
            onSetNormalFont: this._setNormalFont,
            onSetSmallFont: this._setSmallFont
        }

        /*return (
        useThreePaneView
            ? <ModelBrowserPanes packageTree={ tree.packageTree }
                  classTree={ tree.classTree }
                  propertyTree={ tree.propertyTree }
                  {...this.props}
                  {...handlers}>
                  { modelBrowserDetails }
              </ModelBrowserPanes>
            : <ModelBrowserTree packageTree={ tree } {...this.props} {...handlers}>
                  { modelBrowserDetails }
              </ModelBrowserTree>
        )*/

        const TreeComponent = useThreePaneView ? ModelBrowserPanes : ModelBrowserTree

        const trees = this._getTrees(useThreePaneView)

        const items = this._getItems()

        return this._render(TreeComponent, trees, items, handlers, details, query)
    }

    _render = (TreeComponent, trees, items, handlers, details, query) => <TreeComponent {...this.props} {...handlers} {...trees}>
                                                                             <Card className="h-100 border-0">
                                                                                 <CardHeader className="text-nowrap d-flex flex-row" style={ { minHeight: '50px', height: '50px' } }>
                                                                                     { details.name && <ModelElement element={ { ...details.infos, ...details } } color="default" /> }
                                                                                 </CardHeader>
                                                                                 { details._id &&
                                                                                   <ModelBrowserDetails {...this.props}
                                                                                       items={ items }
                                                                                       urlSuffix={ query }
                                                                                       {...details}/> }
                                                                             </Card>
                                                                         </TreeComponent>
}
;

const ConnectedModelBrowser = connect(mapStateToProps, mapDispatchToProps)(ModelBrowser)

export default ConnectedModelBrowser
