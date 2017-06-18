import React, { Component, PropTypes } from 'react';

import { Button, Form, FormGroup, FormFeedback, Label, Input, Progress } from 'reactstrap';


class ModelProfileEdit extends Component {

    _changeName = (e, profile, model) => {
        const {requestProfileEdit, fetch, oldName} = this.props;

        if (e && e.target) {
            const name = e.target.value;
            const profiles = Object.keys(model.profiles).concat(Object.values(model.profiles).map(p => p.name))

            requestProfileEdit({
                _id: profile,
                name: name,
                model: model._id,
                valid: this._isNameValid(name, profiles, oldName),
                oldName: oldName,
                //TODO
                owner: 'unknown',
                fetch: fetch
            });
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

        confirmProfileEdit(profileEdit);
    }

    _cancelProfileEdit = (e, profile) => {
        const {cancelProfileEdit} = this.props;

        cancelProfileEdit({
            _id: profile
        });
    }

    render() {
        const {profileEdit, profile, model, title, children, oldName} = this.props;
        if (!profileEdit[profile])
            return <div>
                       { children[0] }
                       { !oldName
                         ? <a href="" onClick={ (e) => this._requestProfileEdit(e, profile) }>
                               { children[1] }
                               { title }
                           </a>
                         : <span>{ children[1] } { title }</span> }
                   </div>

        return (
            <div>
                <FormGroup color={ profileEdit[profile].valid ? 'success' : 'danger' } className="m-0">
                    <div className="d-flex flex-row align-items-center">
                        { children }
                        <Input type="text"
                            name="newModel"
                            value={ profileEdit[profile].name }
                            state={ profileEdit[profile].valid ? 'success' : 'danger' }
                            className="sidemenu-active p-1 rounded-0"
                            autoFocus
                            onChange={ (e) => this._changeName(e, profile, model) } />
                    </div>
                    <FormFeedback className="mt-0 mb-1 text-right">
                        { profileEdit[profile].valid
                          ? ''
                          : 'This name is not valid' }
                    </FormFeedback>
                </FormGroup>
                <div className="d-flex flex-row justify-content-end my-1">
                    <Button size="sm"
                        color="info"
                        outline
                        className="rounded-0 ml-1 py-0"
                        disabled={ !profileEdit[profile].valid }
                        onClick={ (e) => this._confirmProfileEdit(e, profileEdit[profile]) }>
                        Add
                    </Button>
                    <Button size="sm"
                        color="danger"
                        outline
                        className="rounded-0 ml-1 py-0"
                        onClick={ (e) => this._cancelProfileEdit(e, profile) }>
                        Cancel
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