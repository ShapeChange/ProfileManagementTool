import React, { Component } from 'react';
import Toggle from '../common/Toggle'


class ModelViewSettings extends Component {

    render() {
        const {isFlattenInheritance, toggleFlattenInheritance, isFlattenOninas, toggleFlattenOninas, t} = this.props;
        return (
            <div>
                <div className="mb-1">
                    <Toggle name="inheritance"
                        size="1x"
                        color="info"
                        checked={ isFlattenInheritance }
                        onToggle={ e => toggleFlattenInheritance() }>
                        { t('flattenInheritance') }
                    </Toggle>
                </div>
                <Toggle name="onina"
                    size="1x"
                    color="info"
                    checked={ isFlattenOninas }
                    onToggle={ e => toggleFlattenOninas() }>
                    { t('flattenOninas') }
                </Toggle>
            </div>
        );
    }
}
;

export default ModelViewSettings
