import React, { Component, PropTypes } from 'react';
import { Row, Col, Card, CardHeader } from 'reactstrap';

import ModelBrowserControls from './ModelBrowserControls'
import ModelTreeList from './ModelTreeList'


class ModelBrowserPanes extends Component {

    render() {
        const {packageTree, classTree, propertyTree, selectedModel, selectedProfile, selectedPackage, selectedClass, selectedProperty, selectedTab, isFocusOnPackage, isFocusOnClass, isFocusOnProperty, expanded, baseUrls, title} = this.props;
        const {useSmallerFont, filter} = this.props;

        return (
            <Row noGutters={ true } className="h-100">
                <Col className="h-100" md="7">
                <Card className="h-100 border-top-0 border-bottom-0 border-left-0 rounded-0">
                    <CardHeader style={ { minHeight: '50px', height: '50px' } }>
                        <ModelBrowserControls {...this.props}/>
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
                                    placeHolder='No Packages'
                                    selectedProfile={ selectedProfile }
                                    filter={ filter } />
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
                                    placeHolder='No Classes'
                                    selectedProfile={ selectedProfile }
                                    filter={ filter } />
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
                                    placeHolder='No Properties'
                                    selectedProfile={ selectedProfile }
                                    filter={ filter } />
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
