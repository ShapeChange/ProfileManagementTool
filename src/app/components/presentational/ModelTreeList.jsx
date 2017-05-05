import React, { Component, PropTypes } from 'react';
import { ListGroup, ListGroupItem, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
//import { Link } from 'react-router-dom'
import { Link } from 'redux-little-router';
import TreeList from '../common/TreeList'

import { StereoType } from '../../reducers/model'
import { ItemType } from '../../reducers/app'

import './ModelTreeList.scss'

const Icons = {
    [StereoType.FT]: 'FT',
    [StereoType.T]: 'T',
    [StereoType.DT]: 'DT',
    [StereoType.CL]: 'CL',
    [StereoType.E]: 'E',
    [StereoType.U]: 'U',
    [StereoType.AT]: 'AT',
    [StereoType.AR]: 'exchange',
    [ItemType.PKG]: 'folder',
    [ItemType.CLS]: 'list-alt',
    [ItemType.PRP]: 'hashtag'
}

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
        const {focus, showExpansionIcons, useSmallerFont, baseUrls, urlSuffix} = this.props;

        let classNames = 'border-left-0 border-right-0 rounded-0 list-group-item-action text-nowrap'
        if (isFirst)
            classNames += ' border-top-0'
        if (isSelected)
            classNames += ' active'
        else
            classNames += ' text-primary'
        if (!focus)
            classNames += ' nofocus'
        //else if (i === packages.length - 1)
        classNames += ' border-bottom-0'
        if (useSmallerFont)
            classNames += ' px-1 py-1 small'
        else
            classNames += ' px-2 py-2'

        let leafIcon
        if (leaf.stereotypes && Icons[leaf.stereotypes[0]]) {
            let iconClassNames = 'mr-1 px-0 align-self-center tree-list-icon' + (isSelected ? ' text-primary active' : '')
            leafIcon = <Badge color="primary" className={ iconClassNames }>
                           { Icons[leaf.stereotypes[0]] }
                       </Badge>;
        }
        if (!leafIcon) {
            let iconName = Icons[leaf.type] + (isExpanded && leaf.type === ItemType.PKG ? '-open' : '')
            if (leaf.isAttribute && leaf.isAttribute === 'false')
                iconName = Icons[StereoType.AR]
            leafIcon = <FontAwesome name={ iconName } fixedWidth={ true } className="mr-1 align-self-center" />
        //= leaf.type === 'prp' ? 'hashtag' : leaf.type === 'cls' ? 'list-alt' : isExpanded ? 'folder-open' : 'folder'
        }

        let expansionIconType = 'blank'
        //if (hasChildren)
        if (leaf.type !== 'prp')
            expansionIconType = isExpanded ? 'angle-down' : 'angle-right'
        const expansionIcon = showExpansionIcons ? <FontAwesome name={ expansionIconType } fixedWidth={ true } className="" /> : null

        return <ListGroupItem tag={ Link }
                   href={ `${baseUrls[leaf.type]}/${leaf._id}/${urlSuffix ? urlSuffix : ''}${isExpanded && hasChildren ? '?closed=true' : ''}` }
                   key={ leaf._id }
                   title={ leaf.name }
                   className={ classNames } /*onClick={
                   (e)=>
                   { e.preventDefault(); //if (children.length > 0) onExpand(leaf) onSelect(leaf) } }*/ >
                   <span className="d-flex flex-row">{ expansionIcon }{ depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }{ leafIcon }{ leaf.name }</span>
               </ListGroupItem>
    }

    render() {
        return <TreeList renderTree={ this._renderTree } renderLeaf={ this._renderLeaf } {...this.props}/>
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
