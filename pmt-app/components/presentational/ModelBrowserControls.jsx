import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, ButtonGroup, Input, InputGroup, InputGroupAddon } from 'reactstrap';
import FontAwesome from 'react-fontawesome';


class ModelBrowserControls extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {useThreePaneView, onSetThreePaneView, onSetSinglePaneView, useSmallerFont, onSetNormalFont, onSetSmallFont, pendingFilter, isFilterPending, onSearch, filter, disabled, t} = this.props;

        const searchIcon = isFilterPending ? 'spinner' : (pendingFilter !== '' ? 'close' : 'search')
        const onCancel = !isFilterPending && pendingFilter !== '' ? onSearch.bind(null, null) : () => {
        }

        return (
            <Form inline className="d-flex flex-row justify-content-end" onSubmit={ e => e.preventDefault() }>
                <div className="mr-auto inner-addon inner-addon-sm right-addon">
                    <FontAwesome name={ searchIcon }
                        pulse={ isFilterPending }
                        className="text-muted"
                        onClick={ onCancel } />
                    <Input size="sm" value={ pendingFilter } onChange={ onSearch } />
                </div>
                <ButtonGroup>
                    <Button color="primary"
                        size="sm"
                        outline
                        title={ t('singleColumnLayout') }
                        active={ !useThreePaneView }
                        onClick={ onSetSinglePaneView }>
                        <FontAwesome name="align-left" />
                    </Button>
                    <Button color="primary"
                        size="sm"
                        outline
                        title={ t('threeColumnLayout') }
                        active={ useThreePaneView }
                        onClick={ onSetThreePaneView }>
                        <FontAwesome name="columns" />
                    </Button>
                </ButtonGroup>
                <ButtonGroup className="pl-3">
                    <Button color="primary"
                        size="sm"
                        outline
                        title={ t('normalFont') }
                        active={ !useSmallerFont }
                        onClick={ onSetNormalFont }>
                        <FontAwesome name="font" />
                    </Button>
                    <Button color="primary"
                        size="sm"
                        outline
                        title={ t('smallFont') }
                        style={ { fontSize: '.600rem' } }
                        active={ useSmallerFont }
                        onClick={ onSetSmallFont }>
                        <FontAwesome name="font" />
                    </Button>
                </ButtonGroup>
            </Form>
        );
    }
}
;


ModelBrowserControls.propTypes = {

};

ModelBrowserControls.defaultProps = {
};

export default ModelBrowserControls
