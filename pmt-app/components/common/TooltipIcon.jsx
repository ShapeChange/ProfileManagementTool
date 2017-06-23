import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import FontAwesome from 'react-fontawesome';


class TooltipIcon extends Component {

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
        const {id, placement, className, icon, color, children} = this.props;

        return (
            <span className={ className }><FontAwesome id={ id } name={ icon } className={ `${color && 'text-'+color}` } /> <Tooltip placement={ placement }
                                                                                                                                                      target={ id }
                                                                                                                                                      isOpen={ this.state.tooltipOpen }
                                                                                                                                                      toggle={ this._toggle }> { children } </Tooltip></span>
        );
    }
}
;

TooltipIcon.propTypes = {
    id: PropTypes.string.isRequired,
    icon: PropTypes.string,
    color: PropTypes.string,
    placement: PropTypes.string,
    className: PropTypes.string
};

TooltipIcon.defaultProps = {
    icon: 'info',
    color: null,
    placement: 'right',
    className: ''
};

export default TooltipIcon






