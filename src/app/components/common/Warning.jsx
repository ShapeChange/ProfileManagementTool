import React, { Component } from 'react';
import { Tooltip } from 'reactstrap';
import FontAwesome from 'react-fontawesome';


class Warning extends Component {

    constructor(props) {
        super(props);

        this.state = {
            tooltipOpen: false
        };
    }

    _toggle = () => {
        this.setState({
            tooltipOpen: !this.state.tooltipOpen
        });
    }

    render() {
        const {id, placement, className, children} = this.props;

        return (
            <span className={ className }><FontAwesome id={ id } name="warning" className="text-warning" /> <Tooltip placement={ placement }
                                                                                                                                     target={ id }
                                                                                                                                     isOpen={ this.state.tooltipOpen }
                                                                                                                                     toggle={ this._toggle }> { children } </Tooltip></span>
        );
    }
}
;

export default Warning






