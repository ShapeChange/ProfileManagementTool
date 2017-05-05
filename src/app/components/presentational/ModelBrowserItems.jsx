import React, { Component } from 'react';
import { Table, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'
import ModelElement from './ModelElement'


class ModelBrowserItems extends Component {

    constructor(props) {
        super(props);
        this.state = {
            checked: {}
        };
    }

    _toggle = (e) => {
        const name = e.currentTarget.name

        this.setState({
            checked: {
                ...this.state.checked,
                [name]: !this.state.checked[name]
            }
        });
    }

    // TODO: create component for element links with icon
    render() {
        const {items, baseUrls, urlSuffix} = this.props;

        return (
            <div>
                <div className="font-weight-bold py-1">
                    Included in profile
                </div>
                { items && items.map(item => <div key={ item._id } className="d-flex flex-row w-100 align-items-center">
                                                 <Toggle name={ item._id } checked={ this.state.checked[item._id] || false } onToggle={ this._toggle }>
                                                 </Toggle>
                                                 <ModelElement tag={ Link }
                                                     element={ item }
                                                     color={ this.state.checked[item._id] ? 'primary' : 'muted' }
                                                     href={ `${baseUrls[item.type]}/${item._id}/${urlSuffix ? urlSuffix : ''}` }
                                                     className="mr-1" />
                                                 { item.type === 'prp' && item.cardinality && <Badge color="primary" className="mx-1">
                                                                                                  { item.cardinality }
                                                                                              </Badge> }
                                                 { item.type === 'prp' && item.typeId && <Badge color="primary" className="truncate mx-1">
                                                                                             <Link href={ `${baseUrls['cls']}/${item.typeId._id}/${urlSuffix ? urlSuffix : ''}` } title={ item.typeName } className="text-white">
                                                                                             { item.typeName }
                                                                                             </Link>
                                                                                         </Badge> }
                                                 { /*<Link href={ `${baseUrls[item.type]}/${item._id}/${urlSuffix ? urlSuffix : ''}` } className="ml-auto text-primary">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <FontAwesome name="share" fixedWidth={ true } />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </Link>*/ }
                                             </div>) }
            </div>
        );
    }
}
;

export default ModelBrowserItems
