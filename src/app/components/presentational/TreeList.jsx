import React, { Component, PropTypes } from 'react';
import { ListGroup, ListGroupItem } from 'reactstrap';

class TreeList extends Component {

    constructor(props) {
        super(props);

        this._initState();
    }

    componentWillReceiveProps(nextProps) {
        this._initState(nextProps);
    }

    _initState = (nextProps) => {
        if (this.state && nextProps) {
            const {expanded} = this.props;
            var expandedChanged = nextProps.expanded && ((nextProps.expanded.length != expanded.length) || nextProps.expanded.every(function(element, index) {
                    return element !== expanded[index];
                }));
            var selectedChanged = /*nextProps.selected &&*/ nextProps.selected !== this.props.selected

            var newState = {}
            if (expandedChanged)
                newState.expanded = this.state.expanded.concat(nextProps.expanded);
            if (selectedChanged)
                newState.selected = nextProps.selected
            if (expandedChanged || selectedChanged)
                this.setState(newState);
        } else if (!this.state) {
            this.state = {
                selected: this.props.selected || null,
                expanded: this.props.expanded || []
            }
        }
    }

    _expand = (toggled) => {
        const {expanded} = this.state;
        const newExpanded = expanded.indexOf(toggled) > -1 ? expanded.filter(i => i !== toggled) : expanded.concat(toggled)

        this.setState({
            expanded: newExpanded
        })
    };

    _select = (selected) => {
        const {tree, onSelect} = this.props;

        this.setState({
            selected: selected
        });

        onSelect(selected);
    };

    _renderPackages = (root, packages) => {
        const {tree, focus} = this.props;
        const {expanded, selected} = this.state;
        let packageList = packages || []

        if (root) {

            let children = tree.filter(leaf => leaf.parent === root._id)

            let classNames = 'border-left-0 border-right-0 rounded-0 px-3 py-2 list-group-item-action'
            if (packageList.length === 0)
                classNames += ' border-top-0'
            if (root._id === selected)
                classNames += ' active'
            else
                classNames += ' text-primary'
            if (!focus)
                classNames += ' nofocus'
            //else if (i === packages.length - 1)
            classNames += ' border-bottom-0'

            let icon = '' //from prop'~ '
            if (children.length > 0)
                icon = expanded.indexOf(root._id) > -1 ? '- ' : '+ '

            if (root.parent) {
                packageList.push(<ListGroupItem tag="a"
                                     href="#"
                                     key={ root._id }
                                     className={ classNames }
                                     onClick={ () => {
                                                   if (children.length > 0)
                                                       this._expand(root._id)
                                                   this._select(root._id)
                                               } }>
                                     <span className={ 'pl-' + (root.depth || 0) }>{ icon + root.name }</span>
                                 </ListGroupItem>)
            }

            if (expanded.indexOf(root._id) > -1) {

                children.forEach(leaf => this._renderPackages(leaf, packageList))
            }
        }

        return packageList
    }



    render() {
        const {tree} = this.props;
        const {expanded} = this.state;
        const rootPackage = tree && tree.length ? tree.find(leaf => leaf.parent === null) : null;
        const packageList = rootPackage ? this._renderPackages(rootPackage) : null;

        return (
            <ListGroup className="py-3">
                { packageList }
            </ListGroup>
        );
    }
}

TreeList.propTypes = {
    tree: PropTypes.array.isRequired,
    onSelect: PropTypes.func,
    selected: PropTypes.string,
    expanded: PropTypes.array,
    focus: PropTypes.bool
};

TreeList.defaultProps = {
    onSelect: () => {
    },
    focus: true
};

export default TreeList;
