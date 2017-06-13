import React, { Component } from 'react';
import { Table } from 'reactstrap';
import { Link } from 'redux-little-router';
import Warning from '../common/Warning'


class ModelBrowserInfos extends Component {

    render() {
        const {infos, taggedValues, baseUrl, urlSuffix, filter, isFlattenInheritance, isFlattenOninas} = this.props;

        return (infos &&
            <Table>
                <tbody>
                    { Object.keys(infos).map((key, i) => {
                          let value = infos[key]
                          if ((key === 'supertypes' || key === 'subtypes') && isFlattenInheritance) {
                              return;
                          }
                          if ((key === 'supertypes' || key === 'subtypes') && infos[key]) {
                              value = infos[key].map((st, j) => <span key={ st._id }>{ isFlattenOninas && (st.isMeta || st.isReason)
                                             ? <span>{ st.name } <Warning id={ `${st._id}-type-warning` } className="ml-1" placement="left"> This class is hidden due to the view settings </Warning></span>
                                             : <Link href={ `${baseUrl}/${st.localId}/${urlSuffix || ''}` } title={ st.name }>
                                               { st.name }
                                               </Link> }<br/></span>
                              )
                          } else if (key === 'type' && infos[key]) {
                              value = <Link href={ `${baseUrl}/${infos[key]._id}/${urlSuffix || ''}` }>
                                      { infos[key].name }
                                      </Link>
                          } else if (key === 'association' && infos[key]) {
                              value = <Link href={ `${baseUrl}/${infos[key].localId}/${urlSuffix || ''}` }>
                                      { infos[key].name }
                                      </Link>
                          } else if (key === 'alias' && filter !== '' && infos[key] && infos[key].toLowerCase().indexOf(filter) > -1) {
                              const b = infos[key].toLowerCase().indexOf(filter)
                              const e = b + filter.length
                              value = <span>{ infos[key].substring(0, b) }<span className="bg-highlight">{ infos[key].substring(b, e) }</span>
                                      { infos[key].substring(e) }
                                      </span>
                          }
                          return <tr key={ key }>
                                     <th scope="row" className={ 'pl-0' + (i === 0 ? ' border-top-0' : '') }>
                                         { key }
                                     </th>
                                     <td className={ 'pr-0' + (i === 0 ? ' border-top-0' : '') }>
                                         { value }
                                     </td>
                                 </tr>
                      }
                      ) }
                    { taggedValues &&
                      <tr>
                          <th colSpan="2" className={ 'pl-0' }>
                              tagged values
                          </th>
                      </tr> }
                    { taggedValues &&
                      Object.keys(taggedValues).map((key, i) => {
                          let value = taggedValues[key]
                          return <tr key={ key }>
                                     <td className={ 'pl-0' + (i === 0 ? ' border-top-0' : '') }>
                                         { key }
                                     </td>
                                     <td className={ 'pr-0' + (i === 0 ? ' border-top-0' : '') }>
                                         { value }
                                     </td>
                                 </tr>
                      }
                      ) }
                </tbody>
            </Table>
        );
    }
}
;

export default ModelBrowserInfos
