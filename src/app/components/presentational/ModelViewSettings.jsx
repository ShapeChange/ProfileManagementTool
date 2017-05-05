import React, { Component } from 'react';
import Toggle from '../common/Toggle'


class ModelViewSettings extends Component {

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

        return (
            <div>
                <div className="mb-1">
                    <Toggle name="inheritance"
                        size="1x"
                        color="info"
                        checked={ this.state.checked['inheritance'] || false }
                        onToggle={ this._toggle }>
                        Flatten inheritance tree
                    </Toggle>
                </div>
                <Toggle name="onina"
                    size="1x"
                    color="info"
                    checked={ this.state.checked['onina'] || false }
                    onToggle={ this._toggle }>
                    Flatten ONINAs
                </Toggle>
            </div>
        );
    }
}
;

export default ModelViewSettings
