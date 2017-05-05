import React, { Component, PropTypes } from 'react';
import { ListGroup, ListGroupItem, Button } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
//import { Link } from 'react-router-dom'
import { Link } from 'redux-little-router';
import TreeList from '../common/TreeListStateful'
import ModelFileExport from './ModelFileExport'

class ModelFileBrowser extends Component {

    _fileExport = (e, leaf) => {
        const {startFileExport} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        startFileExport({
            id: leaf._id,
            name: leaf.name
        });
    }

    _renderTree = (leafList) => {
        const {placeHolder, useSmallerFont} = this.props;

        let classNames = 'border-0 text-nowrap py-2 px-0 sidemenu-inactive'

        return <ListGroup className="pb-3">
                   { leafList && leafList.length
                     ? leafList
                     : <ListGroupItem tag="div" className={ classNames }>
                           { placeHolder }
                       </ListGroupItem> }
               </ListGroup>
    }

    _renderLeaf = (leaf, isFirst, isLast, isSelected, isExpanded, hasChildren, depth, onSelect, onExpand) => {
        const {focus, showExpansionIcons, useSmallerFont, baseUrls, selected, toggleMenu, startFileExport, isExporting, hasExport, exportStats, hasImport} = this.props;

        let classNames = 'border-left-0 border-right-0 rounded-0 text-nowrap file-browser-item sidemenu-active'
        if (isFirst)
            classNames += ' border-top-0'
        if (isSelected || (leaf.type === 'mdl' && selected && selected.indexOf(leaf._id) === 0))
            classNames += ' active'
        if (!focus)
            classNames += ' nofocus'
        //else if (i === packages.length - 1)
        classNames += ' border-bottom-0'
        classNames += ' px-0 py-2'

        let expansionIconType = 'blank'
        let leafIconType = leaf.type === 'prf' ? 'id-card' : leaf.type === 'add' ? 'plus' : null

        let leafIcon = leafIconType ? <FontAwesome name={ leafIconType } fixedWidth={ true } className="pr-4" /> : null
        //if (hasChildren)
        if (leaf.type !== 'prp')
            expansionIconType = isExpanded ? 'angle-down' : 'angle-right'
        const expansionIcon = showExpansionIcons && hasChildren ? <FontAwesome name={ expansionIconType } fixedWidth={ true } className="pr-4" /> : null

        return <ListGroupItem tag={ Link }
                   href={ /*`${baseUrls[leaf.type]}/${leaf._id}/`*/leaf.type === 'prf' ? `/profile/${leaf.parent}/${leaf.name}/` : '' }
                   key={ leaf._id }
                   title={ leaf.name }
                   className={ classNames }
                   onClick={ (e) => {
                                 if (leaf.type === 'prf') {
                                     toggleMenu();
                                 } else {
                                     e.preventDefault();
                                     if (leaf.type === 'mdl') {
                                         if (hasChildren)
                                             onExpand(leaf)
                                         onSelect(leaf)
                                     }
                                 }
                             } }>
                   <div className="w-100 d-flex flex-row">
                       <div className="truncate">
                           { expansionIcon }
                           { depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }
                           { leafIcon }
                           { leaf.name }
                       </div>
                       { leaf.type === 'prf' && <div className="ml-auto">
                                                    <Button size="sm"
                                                        color="secondary"
                                                        title="Edit Profile"
                                                        disabled={ true }
                                                        className="rounded-0 py-0">
                                                        Edit
                                                    </Button>
                                                    <Button size="sm"
                                                        color="danger"
                                                        title="Remove Profile"
                                                        disabled={ true }
                                                        className="rounded-0 ml-1 py-0">
                                                        Drop
                                                    </Button>
                                                </div> }
                       { leaf.type === 'mdl' && <div className="ml-auto">
                                                    <Button size="sm"
                                                        color="info"
                                                        title="Export Model File"
                                                        disabled={ hasExport || hasImport }
                                                        className="rounded-0 ml-1 py-0"
                                                        onClick={ (e) => this._fileExport(e, leaf) }>
                                                        Export
                                                    </Button>
                                                    <Button size="sm"
                                                        color="danger"
                                                        title="Drop Model File"
                                                        disabled={ true }
                                                        className="rounded-0 ml-1 py-0">
                                                        Drop
                                                    </Button>
                                                </div> }
                   </div>
               </ListGroupItem>
    }

    render() {
        const {models} = this.props;

        let tree = models.map(mdl => {
            return {
                ...mdl,
                type: 'mdl',
                parent: null
            }
        });

        models.forEach(mdl => {
            tree = tree.concat(mdl.profiles.map(prf => {
                return {
                    _id: mdl._id + prf,
                    name: prf,
                    type: 'prf',
                    parent: mdl._id
                }
            }))
            tree.push({
                _id: mdl._id + 'add',
                name: 'Add Profile',
                type: 'add',
                parent: mdl._id
            })
        })


        return <TreeList {...this.props}
                   tree={ tree }
                   doRenderRoot={ true }
                   placeHolder='No Files'
                   renderTree={ this._renderTree }
                   renderLeaf={ this._renderLeaf }
                   onSelect={ () => {
                              } } />
    }
}

ModelFileBrowser.propTypes = {
    focus: PropTypes.bool,
    showExpansionIcons: PropTypes.bool,
    useSmallerFont: PropTypes.bool
};

ModelFileBrowser.defaultProps = {
    focus: true,
    showExpansionIcons: true,
    useSmallerFont: false
};

export default ModelFileBrowser;
