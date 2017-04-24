import React, { Component } from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import { Card, CardHeader, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import { useThreePaneView, useSmallerFont, Font, View, actions } from '../../reducers/app'
import { getSelectedModel, getSelectedPackage, getSelectedClass, getSelectedProperty, getSelectedTab, getDetails, getPackages, getClasses, getProperties, getExpandedItems } from '../../reducers/model'


import { StereoType } from '../../reducers/model'
import { ItemType } from '../../reducers/app'

const Icons = {
    [StereoType.FT]: 'FT',
    [StereoType.T]: 'T',
    [StereoType.DT]: 'DT',
    [StereoType.CL]: 'CL',
    [StereoType.E]: 'E',
    [StereoType.U]: 'U',
    [StereoType.AT]: 'AT',
    [StereoType.AR]: 'exchange',
    [ItemType.PKG]: 'folder-o',
    [ItemType.CLS]: 'list-alt',
    [ItemType.PRP]: 'hashtag'
}

import ModelBrowserPanes from '../presentational/ModelBrowserPanes'
import ModelBrowserTree from '../presentational/ModelBrowserTree'
import ModelBrowserDetails from '../presentational/ModelBrowserDetails'

const mapStateToProps = (state, props) => {
    return {
        packages: getPackages(state),
        classes: getClasses(state),
        properties: getProperties(state),
        details: getDetails(state), //isFocusOnPackage(state) ? getPackageDetails(state) : isFocusOnClass(state) ? getClassDetails(state) : isFocusOnProperty(state) ? getPropertyDetails(state, getSelectedProperty(state)) : null,
        selectedModel: getSelectedModel(state),
        selectedPackage: getSelectedPackage(state),
        selectedClass: getSelectedClass(state),
        selectedProperty: getSelectedProperty(state),
        selectedTab: getSelectedTab(state),
        isFocusOnPackage: getDetails(state).type === 'pkg', //isFocusOnPackage(state),
        isFocusOnClass: getDetails(state).type === 'cls', //isFocusOnClass(state),
        isFocusOnProperty: getDetails(state).type === 'prp', //isFocusOnProperty(state),
        useThreePaneView: useThreePaneView(state),
        useSmallerFont: useSmallerFont(state),
        expanded: getExpandedItems(state, getSelectedPackage(state), getSelectedClass(state), getSelectedProperty(state)),
        // TODO: normalize urls in LOCATION_CHANGE handler, use relative Links
        baseUrls: {
            pkg: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/package`,
            cls: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/class`,
            prp: `/profile/${state.router.params.modelId}/${state.router.params.profileId}/property/${state.model.fetchedClass}`
        },
        title: state.model.mdl ? state.model.mdl.name : ''
    }
}

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch)
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

        const classTree = selectedPackage && classes ? [{
            _id: selectedPackage,
            parent: null
        }].concat(classes.filter(cls => cls.parent === selectedPackage)) : null;


        const propertyTree = selectedClass && properties ? [{
            _id: selectedClass,
            parent: null
        }].concat(properties.sort((a, b) => a.name > b.name ? 1 : -1)) : null;

        return {
            packageTree: packages,
            classTree: classTree,
            propertyTree: propertyTree
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
        const {details, selectedTab, selectedPackage, selectedClass, classes, properties, baseUrls} = this.props;

        const detailTitle = details ? details.name : '';
        //const detailIcon = Icons[details.type] ? Icons[details.type] : '' //isFocusOnPackage ? 'folder-o' : isFocusOnClass ? 'list-alt' : isFocusOnProperty ? 'cube' : '';

        let detailIcon
        if (details && details.infos && details.infos.stereotypes) {
            let iconClassNames = 'mr-1 px-0 align-self-center tree-list-icon'
            let iconName = Icons[details.infos.stereotypes]
            detailIcon = iconName && <Badge color="default" className={ iconClassNames }>
                                         { iconName }
                                     </Badge>;
        }
        if (details && details.infos && !detailIcon) {
            let iconName = Icons[details.type]
            if (details.infos.isAttribute && details.infos.isAttribute === 'false')
                iconName = Icons[StereoType.AR]
            detailIcon = iconName && <FontAwesome name={ iconName } fixedWidth={ true } className="mr-1 align-self-center" />
        //= leaf.type === 'prp' ? 'hashtag' : leaf.type === 'cls' ? 'list-alt' : isExpanded ? 'folder-open' : 'folder'
        }

        let items
        if (details.type === 'pkg') {
            items = classes.filter(cls => cls.parent === selectedPackage)
        } else if (details.type === 'cls' && properties) {
            items = properties.filter(prp => prp.parent === selectedClass)
        }

        return (
            <Card className="h-100 border-0">
                <CardHeader className="text-nowrap d-flex flex-row" style={ { minHeight: '50px', height: '50px' } }>
                    { detailIcon }
                    { detailTitle }
                </CardHeader>
                { details._id &&
                  <ModelBrowserDetails selectedTab={ selectedTab }
                      items={ items }
                      baseUrls={ baseUrls }
                      {...details}/> }
            </Card>
        );
    }

    render() {
        const {useThreePaneView} = this.props;

        const tree = useThreePaneView ? this._getSeparateTrees() : this._getSingleTree()

        const modelBrowserDetails = this._renderDetails()

        const handlers = {
            onSetSinglePaneView: this._setSinglePaneView,
            onSetThreePaneView: this._setThreePaneView,
            onSetNormalFont: this._setNormalFont,
            onSetSmallFont: this._setSmallFont
        }

        return (
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
        )
    }
}
;

const ConnectedModelBrowser = connect(mapStateToProps, mapDispatchToProps)(ModelBrowser)

export default ConnectedModelBrowser
