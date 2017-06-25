import React, { Component } from 'react';
import { Row, Col, Card, CardHeader, Nav, NavItem, NavLink, Table } from 'reactstrap';
import { Link } from 'redux-little-router';
import ModelBrowserActions from './ModelBrowserActions'
import ModelBrowserItems from './ModelBrowserItems'
import ModelBrowserParameters from './ModelBrowserParameters'
import ModelBrowserInfos from './ModelBrowserInfos'


class ModelBrowserDetails extends Component {

    _updateProfileForElement = (item) => {
        const {selectedProfile} = this.props;

        this._updateProfile(item, {
            include: item.profiles.indexOf(selectedProfile) === -1
        });
    }

    _updateEditableForElement = (item) => {
        const {editable} = this.props;

        this._updateEditable(item, {
            editable: !item.editable,
            recursive: true
        });
    }

    _updateProfileForChildren = (item, include, onlyMandatory, recursive) => {

        this._updateProfile(item, {
            include: include,
            onlyMandatory: onlyMandatory,
            recursive: recursive,
            onlyChildren: true
        });
    }

    _updateEditableForChildren = (item, editable) => {

        this._updateEditable(item, {
            editable: editable,
            recursive: true
        });
    }

    _updateProfileParameter = (item, key, value) => {
        const {updateProfile, selectedModel, selectedProfile} = this.props;

        updateProfile({
            id: item._id,
            modelId: selectedModel,
            type: item.type,
            parent: item.parent,
            profile: selectedProfile,
            profileParameters: {
                [key]: value
            }
        });
    }

    _updateProfile = (item, update) => {
        const {updateProfile, selectedModel, selectedProfile} = this.props;

        updateProfile({
            id: item._id,
            modelId: selectedModel,
            type: item.type,
            parent: item.parent,
            profile: selectedProfile,
            ...update
        });
    }

    _updateEditable = (item, update) => {
        const {updateEditable, selectedModel} = this.props;

        updateEditable({
            id: item._id,
            modelId: selectedModel,
            ...update
        });
    }

    render() {
        const {_id, name, type, items, infos, taggedValues, parameters, selectedTab, baseUrls, urlSuffix, filter, isFlattenInheritance, isFlattenOninas, busy, t} = this.props;

        const baseUrl = `${baseUrls[type]}/${_id}`;
        const isInfo = infos && selectedTab === 'info'
        const isItems = items && selectedTab === 'items'
        const isParameters = parameters && selectedTab === 'parameters'
        const isProfile = !selectedTab || (!isInfo && !isItems && !isParameters) || selectedTab === 'profile'

        return (_id &&
            <div className="p-3" style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                <Nav pills className="mb-3">
                    { type !== 'asc' &&
                      <NavItem>
                          <NavLink tag={ Link } href={ `${baseUrl}/profile${urlSuffix}` } active={ isProfile }>
                              { t('profile') }
                          </NavLink>
                      </NavItem> }
                    { items &&
                      <NavItem>
                          <NavLink tag={ Link } href={ `${baseUrl}/items${urlSuffix}` } active={ selectedTab === 'items' }>
                              { type === 'pkg' ? t('classes') : t('properties') }
                          </NavLink>
                      </NavItem> }
                    { infos &&
                      <NavItem>
                          <NavLink tag={ Link }
                              href={ selectedTab !== 'info' ? `${baseUrl}/info${urlSuffix}` : '' }
                              active={ selectedTab === 'info' }
                              disabled={ !infos || selectedTab === 'info' }>
                              { t('info') }
                          </NavLink>
                      </NavItem> }
                </Nav>
                { isProfile &&
                  <ModelBrowserActions {...this.props}
                      updateProfile={ this._updateProfileForElement }
                      updateProfileForChildren={ this._updateProfileForChildren }
                      updateEditable={ this._updateEditableForElement }
                      updateEditableForChildren={ this._updateEditableForChildren }
                      updateProfileParameter={ this._updateProfileParameter } /> }
                { isInfo &&
                  <ModelBrowserInfos infos={ infos }
                      taggedValues={ taggedValues }
                      baseUrl={ baseUrls['cls'] }
                      baseUrlPrp={ baseUrls['prp2'] }
                      urlSuffix={ selectedTab }
                      filter={ filter }
                      isFlattenInheritance={ isFlattenInheritance }
                      isFlattenOninas={ isFlattenOninas }
                      t={ t } /> }
                { isItems &&
                  <ModelBrowserItems {...this.props} urlSuffix={ selectedTab } updateProfile={ this._updateProfileForElement } /> }
                { isParameters &&
                  <ModelBrowserParameters disabled={ busy } parameters={ parameters } t={ t } /> }
            </div>
        );
    }
}
;

export default ModelBrowserDetails
