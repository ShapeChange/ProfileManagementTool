import React, { Component } from 'react';
import { Table } from 'reactstrap';
import { Link } from 'redux-little-router';


class ModelBrowserParameters extends Component {

    render() {
        const {parameters} = this.props;

        return (
            <div>
                Parameters
            </div>
        );
    }
}
;

export default ModelBrowserParameters
