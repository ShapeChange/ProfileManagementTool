import React, { Component, PropTypes } from 'react';

import { Card, CardHeader, CardBlock, ListGroupItem, Collapse } from 'reactstrap';
import FontAwesome from 'react-fontawesome';


class AccordionItem extends Component {

    render() {
        const {title, header, children, opened, onToggle} = this.props;
        const collapseIcon = opened ? 'chevron-down' : 'chevron-left'

        return (
            <ListGroupItem className="border-0 rounded-0 p-0 my-1" action active={ opened }>
                <Card inverse className="w-100 border-0 rounded-0">
                    <CardHeader className="px-4 py-3 border-0 rounded-0 d-flex flex-row justify-content-between"
                        tag="a"
                        href=""
                        onClick={ (e) => onToggle(e, title) }>
                        { header
                          ? header
                          : title }
                        <span className="ml-5"><FontAwesome name={ collapseIcon } fixedWidth={ true } /></span>
                    </CardHeader>
                    <Collapse isOpen={ opened }>
                        <CardBlock className="px-4 pt-0 pb-3 ">
                            { children }
                        </CardBlock>
                    </Collapse>
                </Card>
            </ListGroupItem>
        );
    }
}
;


AccordionItem.propTypes = {
};

AccordionItem.defaultProps = {
};

export default AccordionItem