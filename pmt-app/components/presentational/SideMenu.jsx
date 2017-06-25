import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
import { translate } from 'react-i18next';

import { isMenuOpen, getSubmenusOpen, hasFileImport, hasPendingFileImport, getFileImport, hasFileExport, hasPendingFileExport, getFileExport, isFlattenInheritance, isFlattenOninas, getDeleteRequested, getProfileEdit, actions } from '../../reducers/app'
import { getModels, getSelectedModel, getSelectedProfile } from '../../reducers/model'
import { actions as authActions, getUser } from '../../reducers/auth'

import { Card, CardHeader, CardBlock, CardText, ModalHeader, ModalBody, ModalFooter, Button, ListGroup, ListGroupItem, Collapse } from 'reactstrap';
import { Link } from 'redux-little-router';
import FontAwesome from 'react-fontawesome';
import ModalSideMenu from '../common/ModalSideMenu'
import Accordion from '../common/Accordion'
import AccordionItem from '../common/AccordionItem'
import ModelFileBrowser from './ModelFileBrowser'
import ModelFileImport from './ModelFileImport'
import ModelFileExport from './ModelFileExport'
import ModelViewSettings from './ModelViewSettings'

import styles from './SideMenu.scss'


@connect(
    (state, props) => {
        return {
            isMenuOpen: isMenuOpen(state),
            submenusOpen: getSubmenusOpen(state),
            isFlattenInheritance: isFlattenInheritance(state),
            isFlattenOninas: isFlattenOninas(state),
            models: getModels(state),
            selectedModel: getSelectedModel(state),
            selectedProfile: getSelectedProfile(state),
            isImporting: hasPendingFileImport(state),
            hasImport: hasFileImport(state),
            importStats: getFileImport(state),
            isExporting: hasPendingFileExport(state),
            hasExport: hasFileExport(state),
            exportStats: getFileExport(state),
            deleteRequested: getDeleteRequested(state),
            profileEdit: getProfileEdit(state),
            user: getUser(state)
        }
    },
    (dispatch) => {
        return {
            ...bindActionCreators(actions, dispatch),
            ...bindActionCreators(authActions, dispatch)
        }
    })

@translate()

class SideMenu extends Component {

    componentWillReceiveProps = (nextProps) => {
        if (nextProps.hasImport && !this.props.hasImport && this.accordion)
            this.accordion.open('Model Files')
    }

    chooseFile = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (this.fileImport)
            this.fileImport.chooseFile()
    }

    onFileImportLoad = (fileImport) => {
        if (fileImport)
            this.fileImport = fileImport
    }

    onAccordionLoad = (accordion) => {
        const {hasImport} = this.props;

        if (accordion)
            this.accordion = accordion
    }

    render() {
        const {isMenuOpen, submenusOpen, setSubmenusOpen, toggleMenu, isFlattenInheritance, toggleFlattenInheritance, isFlattenOninas, toggleFlattenOninas, models, selectedModel, selectedProfile, user, logoutUser, t} = this.props;
        const {createFileImport, startFileImport, clearFileImport, isImporting, hasImport, importStats, startFileExport, clearFileExport, isExporting, hasExport, exportStats, deleteRequested, requestDelete, confirmDelete, cancelDelete, profileEdit, requestProfileEdit, confirmProfileEdit, cancelProfileEdit} = this.props;

        let expanded = []
        if (selectedModel) expanded.push(selectedModel)
        if (importStats.model) expanded.push(importStats.model)
        if (exportStats.id) expanded.push(exportStats.id)
        if (deleteRequested)
            expanded = expanded.concat(deleteRequested)
        const selected = selectedModel && selectedProfile ? (selectedModel + selectedProfile) : null

        return (
            <ModalSideMenu side="left"
                size="sm"
                isOpen={ isMenuOpen }
                onToggle={ toggleMenu }
                className="sidemenu">
                <ModalBody className="sidemenu-content h-100 p-0">
                    <Card inverse className="h-100 border-top-0 border-bottom-0 border-left-0 rounded-0" style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                        <CardHeader className="sidemenu-header rounded-0 my-3 py-4 px-4">
                            <div className="d-flex flex-row">
                                <div>
                                    <FontAwesome name="user"
                                        size='lg'
                                        fixedWidth={ true }
                                        className="pr-4 text-info" />
                                    <span className="">{ user.name }</span>
                                </div>
                                <div className="ml-auto">
                                    <Link href={ '/login' } title={ t('logout') } onClick={ e => logoutUser({
                                                                                                dummy: null
                                                                                            }) }>
                                    <FontAwesome name="sign-out" size='lg' fixedWidth={ true } />
                                    </Link>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBlock className="px-0 pt-0">
                            <Accordion multi={ true }
                                open={ submenusOpen }
                                onChange={ setSubmenusOpen }
                                ref={ this.onAccordionLoad }>
                                <AccordionItem header={ <div className="w-100 d-flex flex-row">
                                                            <FontAwesome name="eye" fixedWidth={ true } className="mr-2 align-self-center" />
                                                            <span className="">{ t('view') }</span>
                                                        </div> } title="View">
                                    <ModelViewSettings isFlattenInheritance={ isFlattenInheritance }
                                        isFlattenOninas={ isFlattenOninas }
                                        toggleFlattenInheritance={ toggleFlattenInheritance }
                                        toggleFlattenOninas={ toggleFlattenOninas }
                                        t={ t } />
                                </AccordionItem>
                                <AccordionItem header={ <div className="w-100 d-flex flex-row justify-content-between">
                                                            <span><FontAwesome name="sitemap" fixedWidth={ true } className="pr-4" />{ t('modelFiles') }</span>
                                                            <Button size="sm"
                                                                color="info"
                                                                className="rounded-0 py-0"
                                                                disabled={ hasImport || hasExport }
                                                                onClick={ this.chooseFile }>
                                                                { t('addFile') }
                                                            </Button>
                                                        </div> } title="Model Files">
                                    <ModelFileImport models={ models }
                                        createFileImport={ createFileImport }
                                        startFileImport={ startFileImport }
                                        clearFileImport={ clearFileImport }
                                        isImporting={ isImporting }
                                        hasImport={ hasImport }
                                        importStats={ importStats }
                                        t={ t }
                                        ref={ this.onFileImportLoad } />
                                    <ModelFileBrowser models={ models }
                                        selectedModel={ selectedModel }
                                        selectedProfile={ selectedProfile }
                                        expanded={ expanded }
                                        selected={ selected }
                                        toggleMenu={ toggleMenu }
                                        startFileExport={ startFileExport }
                                        isExporting={ isExporting }
                                        hasImport={ hasImport }
                                        hasExport={ hasExport }
                                        exportStats={ exportStats }
                                        deleteRequested={ deleteRequested }
                                        profileEdit={ profileEdit }
                                        requestDelete={ requestDelete }
                                        confirmDelete={ confirmDelete }
                                        cancelDelete={ cancelDelete }
                                        requestProfileEdit={ requestProfileEdit }
                                        confirmProfileEdit={ confirmProfileEdit }
                                        cancelProfileEdit={ cancelProfileEdit }
                                        clearFileExport={ clearFileExport }
                                        user={ user }
                                        t={ t } />
                                </AccordionItem>
                            </Accordion>
                        </CardBlock>
                    </Card>
                </ModalBody>
            </ModalSideMenu>
        );
    }
}
;


SideMenu.propTypes = {
};

SideMenu.defaultProps = {
};

export default SideMenu