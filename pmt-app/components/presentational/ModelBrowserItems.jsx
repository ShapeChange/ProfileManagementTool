import React, { Component } from 'react';
import { Table, Badge, Tooltip } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelElement from './ModelElement'
import TooltipIcon from '../common/TooltipIcon'


class ModelBrowserItems extends Component {

    render() {
        const {_id, items, type, profiles, infos, baseUrls, urlSuffix, selectedProfile, updateProfile, filter, isFlattenInheritance, busy, t} = this.props;

        let itemClassNames = 'p-0'

        return (
            <div>
                <div className="font-weight-bold py-1">
                    { t('included') }
                </div>
                <Table>
                    <tbody>
                        { items && items.map((item, i) => {
                              const active = item.profiles.indexOf(selectedProfile) > -1
                              const parentActive = type === 'cls' && profiles.indexOf(selectedProfile) > -1
                              const isCodelistOrEnum = infos.stereotypes && (infos.stereotypes === 'enumeration' || infos.stereotypes === 'codelist')
                              const disabled = !item.editable || busy || (type === 'cls' && !parentActive) || (type === 'cls' && parentActive && (!item.optional && active && !isCodelistOrEnum))
                              const showWarning = isFlattenInheritance && item.type === 'prp' && (_id !== item.parent || infos.subtypes) && !disabled
                              const showWarning2 = isFlattenInheritance && item.type === 'prp' && _id !== item.parent && !item.editable && item.optional
                          
                              return <tr key={ item._id } className={ itemClassNames + (!active ? ' model-element-disabled' : '') }>
                                         <td className={ `py-0 px-0 ${i === 0 && 'border-0'}` }>
                                             <Toggle name={ item._id }
                                                 checked={ active }
                                                 disabled={ disabled }
                                                 onToggle={ e => updateProfile(item) }>
                                                 { showWarning &&
                                                   <TooltipIcon id={ `${item._id}-warning` }
                                                       placement="right"
                                                       icon="warning"
                                                       color="warning">
                                                       { t('changingAffectOther') }
                                                   </TooltipIcon> }
                                                 { showWarning2 &&
                                                   <TooltipIcon id={ `${item._id}-warning2` }
                                                       placement="right"
                                                       icon="warning"
                                                       color="warning">
                                                       { t('propNotEditable') }
                                                   </TooltipIcon> }
                                             </Toggle>
                                         </td>
                                         <td className={ `py-0 px-0 ${i === 0 && 'border-0'}` }>
                                             <ModelElement tag={ Link }
                                                 element={ item }
                                                 color={ active ? 'primary' : 'muted' }
                                                 href={ `${baseUrls[item.type]}/${item._id}/${urlSuffix ? urlSuffix : ''}` }
                                                 className={ `mr-1 ${!item.editable && 'model-element-not-editable'}` }
                                                 filter={ filter } />
                                         </td>
                                         <td className={ `py-0 pr-0 ${i === 0 && 'border-0'}` }>
                                             { item.type === 'prp' && item.cardinality }
                                         </td>
                                         <td className={ `py-0 pr-0 ${i === 0 && 'border-0'}` }>
                                             { item.type === 'prp' && <div className="truncate">
                                                                          { isFlattenInheritance && item.typeId && item.typeId.isAbstract
                                                                            ? <div>
                                                                                  { item.typeId.name }
                                                                                  <TooltipIcon id={ `${item._id}-type-warning` }
                                                                                      className="ml-1"
                                                                                      placement="left"
                                                                                      icon="warning"
                                                                                      color="warning">
                                                                                      { t('hiddenView') }
                                                                                  </TooltipIcon>
                                                                              </div>
                                                                            : (item.typeId
                                                                                ? <Link href={ `${baseUrls['cls']}/${item.typeId.localId}/${urlSuffix ? urlSuffix : ''}` } title={ item.typeId.name }>
                                                                                  { item.typeId.name }
                                                                                  </Link>
                                                                                : <div>
                                                                                      { item.typeName }
                                                                                  </div>) }
                                                                      </div> }
                                         </td>
                                     </tr>
                          }) }
                    </tbody>
                </Table>
            </div>
        );
    }
}
;

export default ModelBrowserItems
