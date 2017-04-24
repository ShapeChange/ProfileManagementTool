import React, { Component } from 'react';
import { Table } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { Link } from 'redux-little-router';
import Toggle from '../common/Toggle'


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

    render() {
        const {items, baseUrls} = this.props;

        return (
            <div>
                <div className="font-weight-bold py-1">
                    Included in profile
                </div>
                { items.map(item => <Toggle key={ item._id }
                                        name={ item._id }
                                        checked={ this.state.checked[item._id] || false }
                                        onToggle={ this._toggle }>
                                        <span className="align-self-center d-flex w-100 font-italic">{ item.name } <Link href={ `${baseUrls[item.type]}/${item._id}/` } className="ml-auto text-primary align-self-center"> <FontAwesome name="share" fixedWidth={ true } /> </Link></span>
                                    </Toggle>) }
            </div>
        );
    }
}
;

export default ModelBrowserItems
