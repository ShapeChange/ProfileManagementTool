import React, { Component } from 'react';
import { Table } from 'reactstrap';
import { Link } from 'redux-little-router';
import TooltipIcon from '../common/TooltipIcon'


class ModelBrowserInfos extends Component {

    render() {
        const {infos, taggedValues, baseUrl, baseUrlPrp, urlSuffix, filter, isFlattenInheritance, isFlattenOninas} = this.props;

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
                                             ? <span>{ st.name } <TooltipIcon id={ `${st._id}-type-warning` }
                                                                                 className="ml-1"
                                                                                 placement="left"
                                                                                 icon="warning"
                                                                                 color="warning"> This class is hidden due to the view settings </TooltipIcon></span>
                                             : <Link href={ `${baseUrl}/${st.localId}/${urlSuffix || ''}` } title={ st.name }>
                                               { st.name }
                                               </Link> }<br/></span>
                              )
                          } else if (key === 'type' && infos[key]) {
                              value = isFlattenInheritance && infos[key].isAbstract
                                  ? <div>
                                        { infos[key].name }
                                        <TooltipIcon id={ `${infos[key]._id}-type-warning` }
                                            className="ml-1"
                                            placement="left"
                                            icon="warning"
                                            color="warning">
                                            This class is hidden due to the view settings
                                        </TooltipIcon>
                                    </div>
                                  : <Link href={ `${baseUrl}/${infos[key]._id}/${urlSuffix || ''}` }>
                                    { infos[key].name }
                                    </Link>
                          } else if (key === 'association' && infos[key]) {
                              value = <Link href={ `${baseUrl}/${infos[key].localId}/${urlSuffix || ''}` }>
                                      { infos[key].name }
                                      </Link>
                          } else if ((key === 'end1' || key === 'end2') && infos[key]) {
                              value = <Link href={ `${baseUrlPrp}/${infos[key].localId}/${infos[key].properties[0].localId}/${urlSuffix || ''}` }>
                                      { infos[key].properties[0].name }
                                      </Link>
                          } else if (filter && filter !== '' && infos[key]) {
                              if (key === 'alias' || key === 'description' || key === 'definition') {
                                  const start = infos[key].toLowerCase().indexOf(filter)
                                  if (start > -1) {
                                      const end = start + filter.length
                                      value = <span>{ infos[key].substring(0, start) }<span className="bg-highlight">{ infos[key].substring(start, end) }</span>
                                              { infos[key].substring(end) }
                                              </span>
                                  }
                              }
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
