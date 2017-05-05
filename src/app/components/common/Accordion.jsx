import React, { Component, PropTypes } from 'react';

import { ListGroup } from 'reactstrap';



class Accordion extends Component {

    open = (item) => {
        const {multi, open} = this.props;

        if (multi && !open[item])
            this.toggle(null, item)
        else if (!multi && open !== item)
            this.toggle(null, item)
    }

    toggle = (e, item) => {
        const {multi, open, onChange} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (multi)
            onChange({
                ...open,
                [item]: !open[item]
            });
        else
            onChange(open === item ? null : item);
    }

    render() {
        const {multi, open} = this.props;

        return (
            <ListGroup className="accordion">
                { React.Children.map(this.props.children, child => React.cloneElement(child, {
                      opened: multi ? open[child.props.title] : (open === child.props.title),
                      onToggle: this.toggle
                  })) }
            </ListGroup>
        );
    }
}
;


Accordion.propTypes = {
    multi: PropTypes.bool,
    open: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.bool
    ]),
    onChange: PropTypes.func
};

Accordion.defaultProps = {
    multi: false
};

export default Accordion