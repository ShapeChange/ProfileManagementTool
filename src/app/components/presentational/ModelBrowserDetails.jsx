import React, { Component } from 'react';
import { Row, Col, Card, CardHeader, Nav, NavItem, NavLink, Table } from 'reactstrap';
import { Link } from 'redux-little-router';
import ModelBrowserActions from './ModelBrowserActions'
import ModelBrowserItems from './ModelBrowserItems'
import ModelBrowserParameters from './ModelBrowserParameters'
import ModelBrowserInfos from './ModelBrowserInfos'


class ModelBrowserDetails extends Component {

    _updateProfile = (item) => {
        const {updateProfile, selectedModel, selectedProfile} = this.props;

        updateProfile({
            id: item._id,
            modelId: selectedModel,
            type: item.type,
            parent: item.parent,
            //index: index,
            include: item.profiles.indexOf(selectedProfile) === -1,
            profile: selectedProfile
        });
    }

    render() {
        const {_id, name, type, items, infos, parameters, selectedTab, baseUrls, urlSuffix} = this.props;

        const baseUrl = `${baseUrls[type]}/${_id}`;
        const isInfo = infos && selectedTab === 'info'
        const isItems = items && selectedTab === 'items'
        const isParameters = parameters && selectedTab === 'parameters'
        const isProfile = !selectedTab || (!isInfo && !isItems && !isParameters) || selectedTab === 'profile'

        return (_id &&
            <div className="p-3" style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                <Nav pills className="mb-3">
                    <NavItem>
                        <NavLink tag={ Link } href={ `${baseUrl}/profile${urlSuffix}` } active={ isProfile }>
                            Actions
                        </NavLink>
                    </NavItem>
                    { items &&
                      <NavItem>
                          <NavLink tag={ Link } href={ `${baseUrl}/items${urlSuffix}` } active={ selectedTab === 'items' }>
                              { type === 'pkg' ? 'Classes' : 'Properties' }
                          </NavLink>
                      </NavItem> }
                    { infos &&
                      <NavItem>
                          <NavLink tag={ Link }
                              href={ `${baseUrl}/info${urlSuffix}` }
                              active={ selectedTab === 'info' }
                              disabled={ !infos }>
                              Info
                          </NavLink>
                      </NavItem> }
                    { parameters &&
                      <NavItem>
                          <NavLink tag={ Link } disabled href={ `${baseUrl}/parameters${urlSuffix}` }>
                              Parameters
                          </NavLink>
                      </NavItem> }
                </Nav>
                { isProfile &&
                  <ModelBrowserActions {...this.props} updateProfile={ this._updateProfile } /> }
                { isInfo &&
                  <ModelBrowserInfos infos={ infos } baseUrl={ baseUrls['cls'] } urlSuffix={ selectedTab } /> }
                { isItems &&
                  <ModelBrowserItems {...this.props} urlSuffix={ selectedTab } updateProfile={ this._updateProfile } /> }
                { isParameters &&
                  <ModelBrowserParameters parameters={ parameters } /> }
            </div>
        );
    }
}
;

export default ModelBrowserDetails
