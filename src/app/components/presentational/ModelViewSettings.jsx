import React, { Component } from 'react';
import Toggle from '../common/Toggle'


class ModelViewSettings extends Component {

    render() {
        const {isFlattenInheritance, toggleFlattenInheritance, isFlattenOninas, toggleFlattenOninas} = this.props;
        return (
            <div>
                <div className="mb-1">
                    <Toggle name="inheritance"
                        size="1x"
                        color="info"
                        checked={ isFlattenInheritance }
                        onToggle={ e => toggleFlattenInheritance() }>
                        Flatten inheritance tree
                    </Toggle>
                </div>
                <Toggle name="onina"
                    size="1x"
                    color="info"
                    checked={ isFlattenOninas }
                    onToggle={ e => toggleFlattenOninas() }>
                    Flatten ONINAs
                </Toggle>
            </div>
        );
    }
}
;

export default ModelViewSettings
