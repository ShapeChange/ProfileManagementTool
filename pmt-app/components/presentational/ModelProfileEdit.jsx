import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button, Form, FormGroup, FormFeedback, Label, Input, Progress } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import TooltipIcon from '../common/TooltipIcon'


class ModelProfileEdit extends Component {

    _changeName = (e, profile, model, other, isDescription) => {
        const {profileEdit, requestProfileEdit, fetch, oldName, user} = this.props;

        if (e && e.target) {
            const name = isDescription ? other : e.target.value;
            const description = isDescription ? e.target.value : other;
            const profiles = Object.keys(model.profilesInfo).concat(Object.values(model.profilesInfo).map(p => p.name))

            requestProfileEdit(Object.assign({}, profileEdit[profile], {
                _id: profile,
                name: name,
                description: description,
                oldName: oldName,
                valid: this._isNameValid(name, profiles, oldName),
                model: model._id,
                owner: user._id,
                fetch: fetch
            }));
        }
    }

    // TODO: to reducer
    _isNameValid = (name, profiles, oldName) => {
        if (!name || name.length === 0)
            return false
        if (oldName && name === oldName)
            return true

        const taken = profiles.findIndex((p) => p === name);

        return taken === -1
    }

    _requestProfileEdit = (e, profile) => {
        const {requestProfileEdit} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        requestProfileEdit({
            _id: profile,
            name: ''
        });
    }

    _confirmProfileEdit = (e, profileEdit) => {
        const {confirmProfileEdit} = this.props;

        confirmProfileEdit({
            ...profileEdit
        });
    }

    _cancelProfileEdit = (e, profile) => {
        const {cancelProfileEdit} = this.props;

        cancelProfileEdit({
            _id: profile
        });
    }

    render() {
        const {profileEdit, profile, model, title, children, oldName, description, t, indent} = this.props;
        if (!profileEdit[profile])
            return <div className="truncate">
                       { indent }
                       { !oldName
                         ? <a href="" onClick={ (e) => this._requestProfileEdit(e, profile) }>
                               { children }
                               { title }
                           </a>
                         : <span className="truncate">{ children } <span className="truncate">{ title }</span>
                           { description && <TooltipIcon id={ `${profile}-type-info` }
                                                className="ml-2"
                                                placement="bottom"
                                                icon="info-circle">
                                                { description }
                                            </TooltipIcon> }
                           </span> }
                   </div>

        return (
            <div>
                <FormGroup color={ profileEdit[profile].valid ? 'success' : 'danger' } className="m-0">
                    <div className="d-flex flex-row align-items-center">
                        { indent }
                        { children }
                        <Input type="text"
                            name="newModel"
                            value={ profileEdit[profile].name }
                            state={ profileEdit[profile].valid ? 'success' : 'danger' }
                            className="sidemenu-active p-1 rounded-0"
                            autoFocus
                            onChange={ (e) => this._changeName(e, profile, model, profileEdit[profile].description) } />
                    </div>
                    <FormFeedback className="mt-0 mb-1 text-right">
                        { profileEdit[profile].valid
                          ? ''
                          : t('nameNotValid') }
                    </FormFeedback>
                </FormGroup>
                <div className="d-flex flex-row align-items-center">
                    { indent }
                    <FontAwesome name="info-circle" fixedWidth={ true } className="mr-1" />
                    <Input type="textarea"
                        name="description"
                        value={ profileEdit[profile].description }
                        placeholder="description"
                        className="sidemenu-active p-1 rounded-0"
                        onChange={ (e) => this._changeName(e, profile, model, profileEdit[profile].name, true) } />
                </div>
                <div className="d-flex flex-row justify-content-end my-1">
                    <Button size="sm"
                        color="info"
                        outline
                        className="rounded-0 ml-1 py-0"
                        disabled={ !profileEdit[profile].valid }
                        onClick={ (e) => this._confirmProfileEdit(e, profileEdit[profile]) }>
                        { oldName ? t('save') : t('add') }
                    </Button>
                    <Button size="sm"
                        color="danger"
                        outline
                        className="rounded-0 ml-1 py-0"
                        onClick={ (e) => this._cancelProfileEdit(e, profile) }>
                        { t('cancel') }
                    </Button>
                </div>
            </div>
        );
    }
}
;


ModelProfileEdit.propTypes = {
};

ModelProfileEdit.defaultProps = {
};

export default ModelProfileEdit