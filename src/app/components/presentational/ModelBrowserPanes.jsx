import React, { Component, PropTypes } from 'react';
import { Row, Col, Card, CardHeader, Form, Button, ButtonGroup, Input, InputGroup, InputGroupAddon } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import ModelTreeList from './ModelTreeList'


class ModelBrowserPanes extends Component {

    render() {
        const {packageTree, classTree, propertyTree, selectedModel, selectedPackage, selectedClass, selectedProperty, selectedTab, isFocusOnPackage, isFocusOnClass, isFocusOnProperty, expanded, baseUrls, title} = this.props;
        const {useThreePaneView, onSetThreePaneView, onSetSinglePaneView, useSmallerFont, onSetNormalFont, onSetSmallFont} = this.props;

        return (
            <Row noGutters={ true } className="h-100">
                <Col className="h-100" md="7">
                <Card className="h-100 border-top-0 border-bottom-0 border-left-0 rounded-0">
                    <CardHeader style={ { minHeight: '50px', height: '50px' } }>
                        <Form inline className="d-flex flex-row justify-content-end">
                            <InputGroup size="sm" className="mr-auto">
                                <InputGroupAddon className="text-muted bg-faded">
                                    <FontAwesome name="search" />
                                </InputGroupAddon>
                                <Input placeholder="" disabled/>
                            </InputGroup>
                            <ButtonGroup>
                                <Button color="primary"
                                    size="sm"
                                    outline
                                    title="Single Column Layout"
                                    active={ !useThreePaneView }
                                    onClick={ onSetSinglePaneView }>
                                    <FontAwesome name="align-left" />
                                </Button>
                                <Button color="primary"
                                    size="sm"
                                    outline
                                    title="Three Column Layout"
                                    active={ useThreePaneView }
                                    onClick={ onSetThreePaneView }>
                                    <FontAwesome name="columns" />
                                </Button>
                            </ButtonGroup>
                            <ButtonGroup className="pl-3">
                                <Button color="primary"
                                    size="sm"
                                    outline
                                    title="Normal Font Size"
                                    active={ !useSmallerFont }
                                    onClick={ onSetNormalFont }>
                                    <FontAwesome name="font" />
                                </Button>
                                <Button color="primary"
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
                    <Row noGutters={ true } className="h-100">
                        <Col className="h-100" md="5">
                        <Card className="h-100 border-top-0 border-bottom-0 border-left-0 rounded-0">
                            <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                <ModelTreeList tree={ packageTree }
                                    parent={ selectedModel }
                                    selected={ selectedPackage }
                                    expanded={ expanded }
                                    focus={ isFocusOnPackage }
                                    useSmallerFont={ useSmallerFont }
                                    baseUrls={ baseUrls }
                                    urlSuffix={ selectedTab }
                                    doRenderRoot={ true }
                                    placeHolder='No Packages' />
                            </div>
                        </Card>
                        </Col>
                        <Col className="h-100" md="4">
                        <Card className="h-100 border-top-0 border-bottom-0 border-left-0 rounded-0">
                            <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                <ModelTreeList tree={ classTree }
                                    parent={ selectedPackage }
                                    selected={ selectedClass }
                                    expanded={ expanded }
                                    focus={ isFocusOnClass }
                                    useSmallerFont={ useSmallerFont }
                                    baseUrls={ baseUrls }
                                    urlSuffix={ selectedTab }
                                    placeHolder='No Classes' />
                            </div>
                        </Card>
                        </Col>
                        <Col className="h-100" md="3">
                        <Card className="h-100 border-0">
                            <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                                <ModelTreeList tree={ propertyTree }
                                    parent={ selectedClass }
                                    selected={ selectedProperty }
                                    expanded={ expanded }
                                    focus={ isFocusOnProperty }
                                    useSmallerFont={ useSmallerFont }
                                    baseUrls={ baseUrls }
                                    urlSuffix={ selectedTab }
                                    placeHolder='No Properties' />
                            </div>
                        </Card>
                        </Col>
                    </Row>
                </Card>
                </Col>
                <Col className="h-100" md="5">
                { this.props.children }
                </Col>
            </Row>
        );
    }
}
;


ModelBrowserPanes.propTypes = {
    packageTree: PropTypes.array,
    classTree: PropTypes.array,
    propertyTree: PropTypes.array,
    selectedPackage: PropTypes.string,
    selectedClass: PropTypes.string,
    selectedProperty: PropTypes.string,
    isFocusOnPackage: PropTypes.bool,
    isFocusOnClass: PropTypes.bool,
    isFocusOnProperty: PropTypes.bool
};

ModelBrowserPanes.defaultProps = {
};

export default ModelBrowserPanes
