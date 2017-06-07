import React, { Component } from 'react';
import { Table } from 'reactstrap';
import { Link } from 'redux-little-router';


class ModelBrowserInfos extends Component {

    render() {
        const {infos, baseUrl, urlSuffix, filter} = this.props;

        return (infos &&
            <Table>
                <tbody>
                    { Object.keys(infos).map((key, i) => {
                          let value = infos[key]
                          if (key === 'supertypes' && infos[key]) {
                              value = infos[key].map((st, j) => <span key={ st._id }><Link href={ `${baseUrl}/${st._id}/${urlSuffix || ''}` }> { st.name } </Link><br/></span>
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
                </tbody>
            </Table>
        );
    }
}
;

export default ModelBrowserInfos
