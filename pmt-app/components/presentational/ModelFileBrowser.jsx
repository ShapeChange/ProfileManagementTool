import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem, Button } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
//import { Link } from 'react-router-dom'
import { Link } from 'redux-little-router';
import TreeList from '../common/TreeListStateful'
import ModelFileExport from './ModelFileExport'
import ModelProfileEdit from './ModelProfileEdit'

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

    _requestDelete = (e, leaf) => {
        const {requestDelete} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        requestDelete(leaf._id);
    }

    _confirmDelete = (e, leaf) => {
        const {confirmDelete, selectedModel, selectedProfile, user} = this.props;

        if (e && (selectedModel !== leaf.dropId && selectedProfile !== leaf.dropId)) {
            e.preventDefault();
            e.stopPropagation();
        }

        let id = leaf.dropId
        if (leaf.dropType === 'prf')
            id = leaf.parent + id

        const mdlId = leaf.dropType === 'prf' ? leaf.parent : id
        const prfId = leaf.dropType === 'prf' ? leaf.dropId : null

        confirmDelete({
            deleteId: id,
            type: leaf.dropType,
            mdlId: mdlId,
            prfId: prfId,
            owner: user._id,
            fetch: leaf.dropType === 'prf' && selectedProfile !== leaf.dropId && selectedModel === mdlId
        });
    }

    _cancelDelete = (e, leaf) => {
        const {cancelDelete} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        let id = leaf.dropId
        if (leaf.dropType === 'prf')
            id = leaf.parent + id

        cancelDelete(id);
    }

    _requestProfileEdit = (e, profile, name) => {
        const {requestProfileEdit} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        requestProfileEdit({
            _id: profile,
            name: name,
            oldName: name,
            valid: true
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
        const {focus, showExpansionIcons, useSmallerFont, baseUrls, selected, selectedModel, toggleMenu, startFileExport, isExporting, hasExport, exportStats, hasImport, clearFileExport, profileEdit, requestProfileEdit, confirmProfileEdit, cancelProfileEdit, models, user} = this.props;

        let classNames = 'border-left-0 border-right-0 rounded-0 sidemenu-active'
        if (isFirst || leaf.type === 'export' || leaf.type === 'drop')
            classNames += ' border-top-0'
        if (isSelected || (leaf.type === 'mdl' && selected && selected.indexOf(leaf._id) === 0))
            classNames += ' active'
        if (!focus)
            classNames += ' nofocus'
        if (leaf.type !== 'export' && leaf.type !== 'drop' && leaf.type !== 'add')
            classNames += ' file-browser-item text-nowrap'
        else
            classNames += ' file-browser-item-passive'
        classNames += ' border-bottom-0'
        classNames += ' px-0 py-2'

        let expansionIconType = 'blank'
        let leafIconType = leaf.type === 'prf' ? 'id-card' : leaf.type === 'add' ? 'plus' : null

        let leafIcon = leafIconType ? <FontAwesome name={ leafIconType } fixedWidth={ true } className="mr-1" /> : null
        //if (hasChildren)
        if (leaf.type !== 'prp')
            expansionIconType = isExpanded ? 'angle-down' : 'angle-right'
        const expansionIcon = showExpansionIcons && hasChildren ? <FontAwesome name={ expansionIconType } fixedWidth={ true } className="pr-4" /> : null

        let rendered = null

        if (leaf.type === 'export') {
            rendered = <ListGroupItem key={ leaf._id } className={ classNames }>
                           <div className="w-100 d-flex flex-row">
                               { depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }
                               <ModelFileExport isExporting={ isExporting }
                                   hasExport={ hasExport }
                                   exportStats={ exportStats }
                                   clearFileExport={ clearFileExport } />
                           </div>
                       </ListGroupItem>
        } else if (leaf.type === 'add') {
            rendered = <ListGroupItem key={ leaf._id } className={ classNames }>
                           <div className="w-100 d-flex flex-row">
                               <div className="truncate">
                                   <ModelProfileEdit profileEdit={ profileEdit }
                                       profile={ leaf._id }
                                       model={ models.find(mdl => mdl._id === leaf.parent) }
                                       fetch={ selectedModel === leaf.parent }
                                       title={ leaf.name }
                                       requestProfileEdit={ requestProfileEdit }
                                       confirmProfileEdit={ confirmProfileEdit }
                                       cancelProfileEdit={ cancelProfileEdit }
                                       user={ user }>
                                       { depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }
                                       { leafIcon }
                                   </ModelProfileEdit>
                               </div>
                           </div>
                       </ListGroupItem>
        } else if (leaf.type === 'drop') {
            rendered = <ListGroupItem key={ leaf._id } className={ classNames }>
                           <div className="w-100 d-flex flex-row">
                               { depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }
                               <div>
                                   <div>
                                       Do you really want to delete this
                                       { leaf.dropType === 'mdl' ? ' model' : ' profile' }?
                                   </div>
                                   <div className="d-flex flex-row justify-content-end my-1">
                                       <Button tag={ Link }
                                           href="/"
                                           size="sm"
                                           color="info"
                                           outline
                                           className="rounded-0 ml-1 py-0"
                                           onClick={ (e) => this._confirmDelete(e, leaf) }>
                                           Delete
                                       </Button>
                                       <Button size="sm"
                                           color="danger"
                                           outline
                                           className="rounded-0 ml-1 py-0"
                                           onClick={ (e) => this._cancelDelete(e, leaf) }>
                                           Cancel
                                       </Button>
                                   </div>
                               </div>
                           </div>
                       </ListGroupItem>
        } else if (leaf.type === 'prf') {
            rendered = <ListGroupItem tag={ Link }
                           href={ `/profile/${leaf.parent}/${leaf.prfId}/` }
                           key={ leaf._id }
                           title={ leaf.name }
                           className={ classNames }
                           onClick={ (e) => profileEdit[leaf._id] ? e.preventDefault() : toggleMenu() }>
                           <div className="w-100 d-flex flex-row justify-content-between">
                               <div className="truncate">
                                   <ModelProfileEdit profileEdit={ profileEdit }
                                       profile={ leaf._id }
                                       model={ models.find(mdl => mdl._id === leaf.parent) }
                                       fetch={ selectedModel === leaf.parent }
                                       title={ leaf.name }
                                       description={ 'bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla ' }
                                       oldName={ leaf.name }
                                       requestProfileEdit={ requestProfileEdit }
                                       confirmProfileEdit={ confirmProfileEdit }
                                       cancelProfileEdit={ cancelProfileEdit }
                                       user={ user }>
                                       { depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }
                                       { leafIcon }
                                   </ModelProfileEdit>
                               </div>
                               { !profileEdit[leaf._id] && <div className="">
                                                               <Button size="sm"
                                                                   color="info"
                                                                   title="Copy Profile"
                                                                   disabled={ hasExport || hasImport }
                                                                   className="rounded-0 py-0"
                                                                   onClick={ (e) => this._requestProfileEdit(e, leaf._id, leaf.name) }>
                                                                   Copy
                                                               </Button>
                                                               <Button size="sm"
                                                                   color="secondary"
                                                                   title="Edit Profile"
                                                                   disabled={ hasExport || hasImport }
                                                                   className="rounded-0 ml-1 py-0"
                                                                   onClick={ (e) => this._requestProfileEdit(e, leaf._id, leaf.name) }>
                                                                   Edit
                                                               </Button>
                                                               <Button size="sm"
                                                                   color="danger"
                                                                   title="Remove Profile"
                                                                   disabled={ hasExport || hasImport }
                                                                   className="rounded-0 ml-1 py-0"
                                                                   onClick={ (e) => this._requestDelete(e, leaf) }>
                                                                   Drop
                                                               </Button>
                                                           </div> }
                           </div>
                       </ListGroupItem>
        } else {
            rendered = <ListGroupItem tag={ Link }
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
                                                                disabled={ hasExport || hasImport }
                                                                className="rounded-0 ml-1 py-0"
                                                                onClick={ (e) => this._requestDelete(e, leaf) }>
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
                                                                disabled={ hasExport || hasImport }
                                                                className="rounded-0 ml-1 py-0"
                                                                onClick={ (e) => this._requestDelete(e, leaf) }>
                                                                Drop
                                                            </Button>
                                                        </div> }
                           </div>
                       </ListGroupItem>
        }

        return rendered
    }

    render() {
        const {models, hasExport, exportStats, deleteRequested} = this.props;

        let tree = models.map(mdl => {
            return {
                ...mdl,
                type: 'mdl',
                parent: null
            }
        });

        models.forEach(mdl => {
            if (hasExport && exportStats.id === mdl._id) {
                tree.push({
                    _id: mdl._id + 'export',
                    type: 'export',
                    parent: mdl._id
                })
            }
            if (deleteRequested && deleteRequested.indexOf(mdl._id) > -1) {
                tree.push({
                    _id: mdl._id + 'drop',
                    dropId: mdl._id,
                    dropType: 'mdl',
                    name: mdl.name,
                    type: 'drop',
                    parent: mdl._id
                })
            }
            tree = tree.concat(Object.values(mdl.profilesInfo).reduce((arr, prf) => {
                arr.push({
                    _id: mdl._id + prf._id,
                    prfId: prf._id,
                    name: prf.name,
                    type: 'prf',
                    parent: mdl._id
                })
                if (deleteRequested && deleteRequested.indexOf(mdl._id + prf._id) > -1) {
                    arr.push({
                        _id: mdl._id + prf._id + 'drop',
                        dropId: prf._id,
                        dropType: 'prf',
                        name: prf.name,
                        type: 'drop',
                        parent: mdl._id
                    })
                }
                return arr
            }, []).sort((a, b) => a.name > b.name ? 1 : -1))
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
