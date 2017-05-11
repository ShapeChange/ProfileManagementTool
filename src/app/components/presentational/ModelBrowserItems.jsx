import React, { Component } from 'react';
import { Table, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelElement from './ModelElement'


class ModelBrowserItems extends Component {

    render() {
        const {items, baseUrls, urlSuffix, selectedProfile, updateProfile} = this.props;

        let itemClassNames = 'd-flex flex-row w-100 align-items-center'

        return (
            <div>
                <div className="font-weight-bold py-1">
                    Included in profile
                </div>
                { items && items.map((item, i) => <div key={ item._id } className={ itemClassNames + (item.profiles.indexOf(selectedProfile) === -1 ? ' model-element-disabled' : '') }>
                                                      <Toggle name={ item._id } checked={ item.profiles.indexOf(selectedProfile) > -1 } onToggle={ e => updateProfile(item) }>
                                                      </Toggle>
                                                      <ModelElement tag={ Link }
                                                          element={ item }
                                                          color={ item.profiles.indexOf(selectedProfile) === -1 ? 'muted' : 'primary' }
                                                          href={ `${baseUrls[item.type]}/${item._id}/${urlSuffix ? urlSuffix : ''}` }
                                                          className="mr-1" />
                                                      { item.type === 'prp' && item.cardinality && <Badge color="primary" className="mx-1">
                                                                                                       { item.cardinality }
                                                                                                   </Badge> }
                                                      { item.type === 'prp' && item.typeId && <Badge color="primary" className="truncate mx-1">
                                                                                                  <Link href={ `${baseUrls['cls']}/${item.typeId}/${urlSuffix ? urlSuffix : ''}` } title={ item.typeName } className="text-white">
                                                                                                  { item.typeName }
                                                                                                  </Link>
                                                                                              </Badge> }
                                                  </div>) }
            </div>
        );
    }
}
;

export default ModelBrowserItems
