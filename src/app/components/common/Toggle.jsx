import React, { Component, PropTypes } from 'react';
import { FormGroup, Label, Input } from 'reactstrap';
import FontAwesome from 'react-fontawesome';


class Toggle extends Component {

    render() {
        const {name, label, children, checked, onToggle, size} = this.props;

        const icon = checked ? 'toggle-on' : 'toggle-off'

        return (
            <FormGroup check className="m-0">
                <Label check className="d-flex flex-row p-0">
                    <Input type="checkbox"
                        name={ name }
                        checked={ checked }
                        onChange={ onToggle }
                        className="hidden-xl-down" />
                    <FontAwesome name={ icon }
                        size={ size }
                        fixedWidth={ true }
                        className="mr-2 text-primary align-self-center" />
                    { children
                      ? children
                      : <span className="align-self-center">{ label }</span> }
                </Label>
            </FormGroup>
        );
    }
}
;

Toggle.propTypes = {
    size: PropTypes.string
};

Toggle.defaultProps = {
    size: 'lg'
};

export default Toggle
