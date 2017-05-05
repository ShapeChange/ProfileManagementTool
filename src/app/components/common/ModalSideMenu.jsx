import React, { Component, PropTypes } from 'react';
import { Modal } from 'reactstrap';

import './ModalSideMenu.scss'

class ModalSideMenu extends Component {

    render() {
        const {side, size, isOpen, onToggle, children, className} = this.props;

        let classNames = ' mw-100 h-100 m-0'
        let modalClassNames = className + ' modal-menu'
        let contentClassNames = 'border-0 rounded-0 h-100'
        let backdropClassNames = className + ' modal-menu'

        if (side === 'right') {
            classNames += ' ml-auto'
            modalClassNames += ' right'
        }
        else
            modalClassNames += ' left'

        if (size === 'lg') {
            classNames += ' w-50'
        } else if (size === 'xs')
            classNames += ' w-25'
        else
            classNames += ' w-33'

        return (
            <Modal isOpen={ isOpen }
                toggle={ onToggle }
                className={ classNames }
                contentClassName={ contentClassNames }
                modalClassName={ modalClassNames }
                backdropClassName={ backdropClassNames }>
                { children }
            </Modal>
        );
    }
}
;


ModalSideMenu.propTypes = {
    side: PropTypes.string,
    size: PropTypes.string,
    isOpen: PropTypes.bool,
    onToggle: PropTypes.func
};

ModalSideMenu.defaultProps = {
    side: 'left',
    size: 'sm'
};

export default ModalSideMenu
