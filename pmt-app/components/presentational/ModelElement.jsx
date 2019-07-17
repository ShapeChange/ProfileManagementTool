import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
    [ItemType.ASC]: 'exchange',
    [ItemType.PRP]: 'hashtag'
}

class ModelElement extends Component {

    _highlight = (element, filter, classNames) => {
        if (filter && filter !== '') {
            const start = element.name.toLowerCase().indexOf(filter)
            if (start > -1) {
                const end = start + filter.length
                return <span className={classNames}>{element.name.substring(0, start)}<span className="bg-highlight">{element.name.substring(start, end)}</span>
                    {element.name.substring(end)}
                </span>
            } else if (element.filterMatch) {
                classNames += ' underscore-highlight'
            }
        }

        return <span className={classNames}>{element.name}</span>
    }

    render() {
        const { tag: Tag, className, element, depth, color, showExpansionIcons, isExpanded, filter, ...attributes } = this.props;

        let elementIcon;

        if (element.stereotypes) {
            const iconType = Icons[element.stereotypes[0]] || Icons[element.stereotypes]
            if (iconType) {
                let iconClassNames = 'badge-fw mr-1 px-0'

                elementIcon = <Badge color={color || 'primary'} className={iconClassNames}>
                    {iconType}
                </Badge>;
            }
        }

        if (!elementIcon) {
            let iconName = Icons[element.type] + (isExpanded && element.type === ItemType.PKG ? '-open' : '')
            if (element.type === ItemType.PRP && !element.isAttribute)
                iconName = Icons[StereoType.AR]
            elementIcon = <FontAwesome name={iconName} fixedWidth={true} className="mr-1" />
        }

        let elementName = this._highlight(element, filter, 'model-element-name' + (element.isAbstract ? ' font-italic' : ''))

        let expansionIconType = 'blank'
        //if (hasChildren)
        if (element.type !== 'prp')
            expansionIconType = isExpanded ? 'angle-down' : 'angle-right'
        const expansionIcon = showExpansionIcons ? <FontAwesome name={expansionIconType} fixedWidth={true} className="" /> : null

        return <Tag {...attributes} className={`model-element d-flex flex-row align-items-center text-nowrap ${color && 'text-' + color} ${className}`}>
            {expansionIcon}
            {depth > 0 && Array(depth).fill(0).map((v, i) => <span key={i} className="pl-4" />)}
            {elementIcon}
            {elementName}
            {element.type === 'cls' && element.associationId && <Badge color={color || 'primary'} className={'badge-fw ml-1 px-0'}>
                {'AC'}
            </Badge>}
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
    color: null,
    tag: 'div',
    className: ''
};

export default ModelElement;
