import React, { Component, PropTypes } from 'react';

class TreeList extends Component {

    _renderLeafs = (root, depth = 0, packageList = []) => {
        const {tree, renderLeaf, expanded, selected, onSelect, onExpand, doRenderRoot} = this.props;

        if (root) {
            let children = tree.filter(leaf => leaf.parent === root._id)

            if (doRenderRoot || root.parent) {
                const isFirst = packageList.length === 0;
                const isLast = packageList.length === tree.length - 2;
                const isSelected = root._id === selected;
                const isExpanded = expanded.indexOf(root._id) > -1;
                const hasChildren = children && children.length > 0;

                packageList.push(renderLeaf(root, isFirst, isLast, isSelected, isExpanded, hasChildren, depth, onSelect, onExpand))
            }

            if (expanded.indexOf(root._id) > -1) {
                children.forEach(leaf => this._renderLeafs(leaf, doRenderRoot ? depth + 1 : depth, packageList))
            }
        }

        return packageList
    }



    render() {
        const {tree, renderTree, expanded, selected, onSelect, onExpand} = this.props;

        const treeRoot = tree && tree.length ? tree.find(leaf => leaf.parent === null) : null;
        const leafList = treeRoot ? this._renderLeafs(treeRoot) : null;

        return renderTree(leafList, expanded, selected, onSelect, onExpand)
    }
}

TreeList.propTypes = {
    tree: PropTypes.array,
    onSelect: PropTypes.func,
    onExpand: PropTypes.func,
    selected: PropTypes.string,
    expanded: PropTypes.array,
    renderTree: PropTypes.func.isRequired,
    renderLeaf: PropTypes.func.isRequired,
    doRenderRoot: PropTypes.bool
};

TreeList.defaultProps = {
    onSelect: () => {
    },
    onExpand: () => {
    }
};

export default TreeList;
