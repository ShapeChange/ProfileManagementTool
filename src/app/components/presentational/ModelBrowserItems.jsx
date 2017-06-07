import React, { Component } from 'react';
import { Table, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelElement from './ModelElement'


class ModelBrowserItems extends Component {

    render() {
        const {items, type, pkg, profiles, baseUrls, urlSuffix, selectedProfile, updateProfile} = this.props;

        let itemClassNames = 'p-0'
        const editable = pkg && pkg.editable

        return (
            <div>
                <div className="font-weight-bold py-1">
                    Included in profile
                </div>
                <Table>
                    <tbody>
                        { items && items.map((item, i) => <tr key={ item._id } className={ itemClassNames + (item.profiles.indexOf(selectedProfile) === -1 ? ' model-element-disabled' : '') }>
                                                              <td className={ `py-0 px-0 ${i === 0 && 'border-0'}` }>
                                                                  <Toggle name={ item._id }
                                                                      checked={ item.profiles.indexOf(selectedProfile) > -1 }
                                                                      disabled={ !editable || (type === 'cls' && profiles.indexOf(selectedProfile) > -1 && !item.optional) }
                                                                      onToggle={ e => updateProfile(item) }>
                                                                  </Toggle>
                                                              </td>
                                                              <td className={ `py-0 px-0 ${i === 0 && 'border-0'}` }>
                                                                  <ModelElement tag={ Link }
                                                                      element={ item }
                                                                      color={ item.profiles.indexOf(selectedProfile) === -1 ? 'muted' : 'primary' }
                                                                      href={ `${baseUrls[item.type]}/${item._id}/${urlSuffix ? urlSuffix : ''}` }
                                                                      className={ `mr-1 ${!editable && 'model-element-not-editable'}` } />
                                                              </td>
                                                              <td className={ `py-0 pr-0 ${i === 0 && 'border-0'}` }>
                                                                  { item.type === 'prp' && item.cardinality }
                                                              </td>
                                                              <td className={ `py-0 pr-0 ${i === 0 && 'border-0'}` }>
                                                                  { item.type === 'prp' && item.typeId && <div className="truncate">
                                                                                                              <Link href={ `${baseUrls['cls']}/${item.typeId}/${urlSuffix ? urlSuffix : ''}` } title={ item.typeName }>
                                                                                                              { item.typeName }
                                                                                                              </Link>
                                                                                                          </div> }
                                                              </td>
                                                          </tr>) }
                    </tbody>
                </Table>
            </div>
        );
    }
}
;

export default ModelBrowserItems
