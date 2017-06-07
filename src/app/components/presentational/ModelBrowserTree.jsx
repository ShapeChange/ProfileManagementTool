import React, { Component, PropTypes } from 'react';
import { Row, Col, Card, CardHeader } from 'reactstrap';

import ModelBrowserControls from './ModelBrowserControls'
import ModelTreeList from './ModelTreeList'


class ModelBrowserTree extends Component {

    render() {
        const {packageTree, selectedModel, selectedProfile, selectedPackage, selectedClass, selectedProperty, selectedTab, isFocusOnPackage, isFocusOnClass, isFocusOnProperty, expanded, baseUrls, title} = this.props;
        const {useSmallerFont, filter} = this.props;

        const selected = isFocusOnPackage ? selectedPackage : isFocusOnClass ? selectedClass : isFocusOnProperty ? selectedProperty : null;

        return (
            <Row noGutters={ true } className="h-100">
                <Col className="h-100" md="5">
                <Card className="h-100 border-top-0 border-bottom-0 border-left-0">
                    <CardHeader style={ { minHeight: '50px', height: '50px' } }>
                        <ModelBrowserControls {...this.props}/>
                    </CardHeader>
                    <div style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                        <ModelTreeList tree={ packageTree }
                            parent={ selectedModel }
                            selected={ selected }
                            expanded={ expanded }
                            useSmallerFont={ useSmallerFont }
                            baseUrls={ baseUrls }
                            urlSuffix={ selectedTab }
                            doRenderRoot={ true }
                            selectedProfile={ selectedProfile }
                            filter={ filter } />
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
