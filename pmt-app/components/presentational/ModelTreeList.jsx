import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'reactstrap';
import { Link } from 'redux-little-router';

import TreeList from '../common/TreeList';
import ModelElement from './ModelElement'


class ModelTreeList extends Component {

    _renderTree = (leafList) => {
        const {placeHolder, useSmallerFont} = this.props;

        let classNames = 'border-0 text-nowrap text-muted text-really-muted p-2 justify-content-center'
        if (useSmallerFont)
            classNames += ' small'

        return <ListGroup className="pb-5">
                   { leafList && leafList.length
                     ? leafList
                     : <ListGroupItem tag="div" className={ classNames }>
                           { placeHolder }
                       </ListGroupItem> }
               </ListGroup>
    }

    _renderLeaf = (leaf, isFirst, isLast, isSelected, isExpanded, hasChildren, depth, onSelect, onExpand) => {
        const {focus, showExpansionIcons, useSmallerFont, baseUrls, urlSuffix, selectedProfile, filter} = this.props;

        let classNames = 'border-left-0 border-right-0 border-bottom-0 rounded-0 list-group-item-action text-nowrap'
        if (isFirst)
            classNames += ' border-top-0'
        if (isSelected)
            classNames += ' active'
        else if (leaf.profiles && leaf.profiles.indexOf(selectedProfile) === -1)
            classNames += ' text-muted'
        else
            classNames += ' text-primary'
        if (leaf.profiles && leaf.profiles.indexOf(selectedProfile) === -1)
            classNames += ' model-element-disabled'
        if (!leaf.editable)
            classNames += ' model-element-not-editable'
        if (!focus)
            classNames += ' nofocus'
        if (useSmallerFont)
            classNames += ' px-1 py-1 small'
        else
            classNames += ' px-2 py-2'

        return <ListGroupItem tag={ Link }
                   href={ `${baseUrls[leaf.type]}/${leaf._id}/${urlSuffix ? urlSuffix : ''}${isExpanded && hasChildren ? '?closed=true' : ''}` }
                   key={ leaf._id }
                   title={ leaf.name }
                   className={ classNames }>
                   <ModelElement element={ leaf }
                       depth={ depth }
                       isExpanded={ isExpanded }
                       filter={ filter } />
               </ListGroupItem>
    }

    render() {
        return <TreeList {...this.props} renderTree={ this._renderTree } renderLeaf={ this._renderLeaf } />
    }
}

ModelTreeList.propTypes = {
    focus: PropTypes.bool,
    showExpansionIcons: PropTypes.bool,
    useSmallerFont: PropTypes.bool
};

ModelTreeList.defaultProps = {
    focus: true,
    showExpansionIcons: false,
    useSmallerFont: false
};

export default ModelTreeList;
