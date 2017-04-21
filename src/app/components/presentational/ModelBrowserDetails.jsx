import React, { Component } from 'react';
import { Row, Col, Card, CardHeader, Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'redux-little-router';


class ModelBrowserDetails extends Component {

    render() {
        const {descriptors, taggedValues, infos, selectedTab, _id} = this.props;

        return (
            <div className="p-3" style={ { overflowY: 'auto', overflowX: 'hidden' } }>
                { _id && <Nav pills className="mb-3">
                             { /*<NavItem>
                                                                                                                                                                                                                                                  <NavLink tag={ Link } href="profile" active={ !selectedTab || selectedTab === 'profile' }>
                                                                                                                                                                                                                                                      Profile
                                                                                                                                                                                                                                                  </NavLink>
                                                                                                                                                                                                                                              </NavItem>
                                                                                                                                                                                                                                              <NavItem>
                                                                                                                                                                                                                                                  <NavLink tag={ Link } href="items" active={ selectedTab === 'items' }>
                                                                                                                                                                                                                                                      Items
                                                                                                                                                                                                                                                  </NavLink>
                                                                                                                                                                                                                                              </NavItem>*/ }
                             <NavItem>
                                 <NavLink tag={ Link }
                                     href="info"
                                     active={ !selectedTab || selectedTab === 'info' }
                                     disabled={ !infos }>
                                     Info
                                 </NavLink>
                             </NavItem>
                             { /*<NavItem>
                                                                                                                                                                                                                                                  <NavLink tag={ Link } disabled href="parameters">
                                                                                                                                                                                                                                                      Parameters
                                                                                                                                                                                                                                                  </NavLink>
                                                                                                                                                                                                                                              </NavItem>*/ }
                         </Nav> }
                { infos && <div>
                               { Object.keys(infos).map(key => <div key={ key } className="py-2">
                                                                   <Row>
                                                                       <Col className="font-weight-bold">
                                                                       { key }
                                                                       </Col>
                                                                       <Col>
                                                                       { infos[key] }
                                                                       </Col>
                                                                   </Row>
                                                               </div>) }
                           </div> }
                { descriptors && <div>
                                     <h4>descriptors</h4>
                                     { Object.keys(descriptors).map(key => <div key={ key } className="py-2">
                                                                               <Row>
                                                                                   <Col className="font-weight-bold">
                                                                                   { key }
                                                                                   </Col>
                                                                                   <Col>
                                                                                   { descriptors[key] }
                                                                                   </Col>
                                                                               </Row>
                                                                           </div>) }
                                 </div> }
                { taggedValues && <div>
                                      <h4 className="pt-3">tagged values</h4>
                                      { Object.keys(taggedValues).map(key => <div key={ key } className="py-2">
                                                                                 <Row>
                                                                                     <Col className="font-weight-bold">
                                                                                     { key }
                                                                                     </Col>
                                                                                     <Col>
                                                                                     { taggedValues[key] }
                                                                                     </Col>
                                                                                 </Row>
                                                                             </div>) }
                                  </div> }
            </div>
        );
    }
}
;

export default ModelBrowserDetails
