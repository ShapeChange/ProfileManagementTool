import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import { Card, CardHeader } from 'reactstrap';
import { translate } from 'react-i18next';

import { useThreePaneView, useSmallerFont, getPendingFilter, getFilter, getBrowserDisabled, isFlattenInheritance, isFlattenOninas, getAllowedGeometries, Font, View, actions } from '../../reducers/app'
import { getSelectedModel, getSelectedProfile, getSelectedPackage, getSelectedClass, getSelectedProperty, getSelectedTab, getDetails, getPackages, getPackage, getClasses, getClass, getProperties, getExpandedItems, actions as modelActions } from '../../reducers/model'

import ModelBrowserPanes from '../presentational/ModelBrowserPanes'
import ModelBrowserTree from '../presentational/ModelBrowserTree'
import ModelBrowserDetails from '../presentational/ModelBrowserDetails'
import ModelElement from '../presentational/ModelElement'


@connect(
    (state, props) => {
        return {
            pkg: getPackage(state),
            packages: getPackages(state),
            cls: getClass(state),
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
                prp: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/property/${state.model.fetchedClass}`,
                prp2: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/property`
            },
            query: state.router.search,
            title: state.model.mdl ? state.model.mdl.name : '',
            pendingFilter: getPendingFilter(state).filter,
            isFilterPending: getPendingFilter(state).pending > 0,
            filter: getFilter(state),
            disabled: getBrowserDisabled(state),
            isFlattenInheritance: isFlattenInheritance(state),
            isFlattenOninas: isFlattenOninas(state),
            allowedGeometries: getAllowedGeometries(state)
        }
    },
    (dispatch) => {
        return {
            ...bindActionCreators(actions, dispatch),
            ...bindActionCreators(modelActions, dispatch)
        }
    })

@translate()

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

    _setFilter = (e) => {
        const {selectedModel, setFilter, applyFilter} = this.props;

        const filter = e ? e.target.value : '';

        /*clearTimeout(this._timer);
        this._timer = setTimeout(() => {
            setFilter(filter);
        }, 500);*/

        setFilter(filter);
    }

    _getTrees = (separate) => {
        const {pkg, packages, classes, properties, selectedPackage, selectedClass} = this.props;

        const classTree = selectedPackage && classes ? classes.filter(cls => cls.parent === selectedPackage).map(cls => Object.assign({}, cls, {
            editable: !pkg || pkg.editable
        })) : [];

        const propertyTree = selectedClass && properties ? properties.map(prp => Object.assign({}, prp, {
            editable: !pkg || pkg.editable
        })) : [];


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

    _getItems = () => {
        const {details, selectedPackage, selectedClass, classes, properties} = this.props;

        let items
        if (details.type === 'pkg') {
            items = classes.filter(cls => cls.parent === selectedPackage)
        } else if (details.type === 'cls' && properties) {
            items = properties
        }

        return items
    }

    render() {
        const {useThreePaneView, details, query, pendingFilter, isFilterPending, filter} = this.props;

        const handlers = {
            onSetSinglePaneView: this._setSinglePaneView,
            onSetThreePaneView: this._setThreePaneView,
            onSetNormalFont: this._setNormalFont,
            onSetSmallFont: this._setSmallFont,
            onSearch: this._setFilter
        }

        const TreeComponent = useThreePaneView ? ModelBrowserPanes : ModelBrowserTree

        const trees = this._getTrees(useThreePaneView)

        const items = this._getItems()

        return this._render(TreeComponent, trees, items, handlers, details, query, pendingFilter, isFilterPending, filter)
    }

    _render = (TreeComponent, trees, items, handlers, details, query, pendingFilter, isFilterPending, filter) => <TreeComponent {...this.props}
                                                                                                                     {...handlers}
                                                                                                                     {...trees}
                                                                                                                     pendingFilter={ pendingFilter }
                                                                                                                     isFilterPending={ isFilterPending }>
                                                                                                                     <Card className="h-100 border-0">
                                                                                                                         <CardHeader className="text-nowrap d-flex flex-row" style={ { minHeight: '50px', height: '50px' } }>
                                                                                                                             { details.name && <ModelElement element={ { ...details.infos, ...details } } color="default" filter={ filter } /> }
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

//const ConnectedModelBrowser = connect(mapStateToProps, mapDispatchToProps)(ModelBrowser)

export default ModelBrowser
