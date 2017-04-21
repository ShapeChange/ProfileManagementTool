import React, { Component, PropTypes } from 'react';
import { Row, Col, Card, CardHeader, Form, Button, ButtonGroup, Input, InputGroup, InputGroupAddon } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import ModelTreeList from './ModelTreeList'


class ModelBrowserTree extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {packageTree, selectedPackage, selectedClass, selectedProperty, isFocusOnPackage, isFocusOnClass, isFocusOnProperty, expanded, baseUrls, title} = this.props;
        const {useThreePaneView, onSetThreePaneView, onSetSinglePaneView, useSmallerFont, onSetNormalFont, onSetSmallFont} = this.props;

        const selected = isFocusOnPackage ? selectedPackage : isFocusOnClass ? selectedClass : isFocusOnProperty ? selectedProperty : null;

        return (
            <Row noGutters={ true } className="h-100">
                <Col className="h-100" md="5">
                <Card className="h-100 border-top-0 border-bottom-0 border-left-0">
                    <CardHeader style={ { minHeight: '50px', height: '50px' } }>
                        <Form inline className="d-flex flex-row justify-content-end">
                            <InputGroup size="sm" className="mr-auto">
                                <InputGroupAddon className="text-muted bg-faded">
                                    <FontAwesome name="search" />
                                </InputGroupAddon>
                                <Input placeholder="" disabled/>
                            </InputGroup>
                            <ButtonGroup>
                                <Button color="secondary"
                                    size="sm"
                                    outline
                                    title="Single Column Layout"
                                    active={ !useThreePaneView }
                                    onClick={ onSetSinglePaneView }>
                                    <FontAwesome name="align-left" />
                                </Button>
                                <Button color="secondary"
                                    size="sm"
                                    outline
                                    title="Three Column Layout"
                                    active={ useThreePaneView }
                                    onClick={ onSetThreePaneView }>
                                    <FontAwesome name="columns" />
                                </Button>
                            </ButtonGroup>
                            <ButtonGroup className="pl-4">
                                <Button color="secondary"
                                    size="sm"
                                    outline
                                    title="Normal Font Size"
                                    active={ !useSmallerFont }
                                    onClick={ onSetNormalFont }>
                                    <FontAwesome name="font" />
                                </Button>
                                <Button color="secondary"
                                    size="sm"
                                    outline
                                    title="Small Font Size"
                                    style={ { fontSize: '.600rem' } }
                                    active={ useSmallerFont }
                                    onClick={ onSetSmallFont }>
                                    <FontAwesome name="font" />
                                </Button>
                            </ButtonGroup>
                        </Form>
                    </CardHeader>
                    <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                        <ModelTreeList tree={ packageTree }
                            selected={ selected }
                            expanded={ expanded }
                            useSmallerFont={ useSmallerFont }
                            baseUrls={ baseUrls }
                            doRenderRoot={ true } />
                    </div>
                </Card>
                </Col>
                <Col className="h-100" md="7">
                { this.props.children }
                </Col>
            </Row>
        );
    }
}
;


ModelBrowserTree.propTypes = {
    packageTree: PropTypes.array,
    selectedPackage: PropTypes.string,
    selectedClass: PropTypes.string,
    selectedProperty: PropTypes.string,
    isFocusOnPackage: PropTypes.bool,
    isFocusOnClass: PropTypes.bool,
    isFocusOnProperty: PropTypes.bool
};

ModelBrowserTree.defaultProps = {
};

export default ModelBrowserTree
