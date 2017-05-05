import React, { Component, PropTypes } from 'react';
import { Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import { StereoType } from '../../reducers/model'
import { ItemType } from '../../reducers/app'

const Icons = {
    [StereoType.FT]: 'FT',
    [StereoType.T]: 'T',
    [StereoType.DT]: 'DT',
    [StereoType.CL]: 'CL',
    [StereoType.E]: 'E',
    [StereoType.U]: 'U',
    [StereoType.AT]: 'AT',
    [StereoType.AR]: 'exchange',
    [ItemType.PKG]: 'folder',
    [ItemType.CLS]: 'list-alt',
    [ItemType.PRP]: 'hashtag'
}

class ModelElement extends Component {

    render() {
        const {tag: Tag, className, element, depth, color, showExpansionIcons, isExpanded, ...attributes} = this.props;

        let elementIcon;

        if (element.stereotypes && Icons[element.stereotypes[0]]) {
            let iconClassNames = 'badge-fw mr-1 px-0'

            elementIcon = <Badge color={ color } className={ iconClassNames }>
                              { Icons[element.stereotypes[0]] }
                          </Badge>;
        }

        if (!elementIcon) {
            let iconName = Icons[element.type] + (isExpanded && element.type === ItemType.PKG ? '-open' : '')
            if (element.isAttribute && element.isAttribute === 'false')
                iconName = Icons[StereoType.AR]
            elementIcon = <FontAwesome name={ iconName } fixedWidth={ true } className="mr-1" />
        }

        let expansionIconType = 'blank'
        //if (hasChildren)
        if (element.type !== 'prp')
            expansionIconType = isExpanded ? 'angle-down' : 'angle-right'
        const expansionIcon = showExpansionIcons ? <FontAwesome name={ expansionIconType } fixedWidth={ true } className="" /> : null

        return <Tag {...attributes} className={ `d-flex flex-row align-items-center text-nowrap text-${color} ${className}` }>
                   { expansionIcon }
                   { depth > 0 && Array(depth).fill(0).map((v, i) => <span key={ i } className="pl-4" />) }
                   { elementIcon }
                   { element.name }
               </Tag>
    }
}

ModelElement.propTypes = {
    depth: PropTypes.number,
    color: PropTypes.string,
    tag: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    className: PropTypes.string
};

ModelElement.defaultProps = {
    depth: 0,
    color: 'primary',
    tag: 'div',
    className: ''
};

export default ModelElement;
