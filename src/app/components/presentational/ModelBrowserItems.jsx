import React, { Component } from 'react';
import { Table, Badge, Tooltip } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelElement from './ModelElement'
import Warning from '../common/Warning'


class ModelBrowserItems extends Component {

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.state = {
            tooltipOpen: false
        };
    }

    toggle() {
        this.setState({
            tooltipOpen: !this.state.tooltipOpen
        });
    }

    render() {
        const {_id, items, type, profiles, baseUrls, urlSuffix, selectedProfile, updateProfile, filter, isFlattenInheritance} = this.props;

        let itemClassNames = 'p-0'

        return (
            <div>
                <div className="font-weight-bold py-1">
                    Included in profile
                </div>
                <Table>
                    <tbody>
                        { items && items.map((item, i) => {
                              const active = item.profiles.indexOf(selectedProfile) > -1
                              const parentActive = type === 'cls' && profiles.indexOf(selectedProfile) > -1
                              const disabled = !item.editable || (type === 'cls' && !parentActive) || (type === 'cls' && parentActive && !item.optional)
                              const showWarning = isFlattenInheritance && item.type === 'prp' && _id !== item.parent && !disabled
                          
                              return <tr key={ item._id } className={ itemClassNames + (!active ? ' model-element-disabled' : '') }>
                                         <td className={ `py-0 px-0 ${i === 0 && 'border-0'}` }>
                                             <Toggle name={ item._id }
                                                 checked={ active }
                                                 disabled={ disabled }
                                                 onToggle={ e => updateProfile(item) }>
                                                 { showWarning &&
                                                   <Warning id={ `${item._id}-warning` } placement="right">
                                                       Changing this property will affect other classes
                                                   </Warning> }
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
                                             { item.type === 'prp' && item.typeId && <div className="truncate">
                                                                                         { isFlattenInheritance && item.typeId.isAbstract
                                                                                           ? <div>
                                                                                                 { item.typeId.name }
                                                                                                 <Warning id={ `${item._id}-type-warning` } className="ml-1" placement="left">
                                                                                                     This class is hidden due to the view settings
                                                                                                 </Warning>
                                                                                             </div>
                                                                                           : <Link href={ `${baseUrls['cls']}/${item.typeId.localId}/${urlSuffix ? urlSuffix : ''}` } title={ item.typeId.name }>
                                                                                             { item.typeId.name }
                                                                                             </Link> }
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
