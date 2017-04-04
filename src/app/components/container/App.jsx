import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
import { getStatus, getBackendStatus, getDbStatus, getInitial, actions } from '../../reducers/test'
import { Navbar, Grid, Col, Row, Button, ListGroup, ListGroupItem } from 'react-bootstrap';


const mapStateToProps = (state, props) => {
    return {
        initial: getInitial(state),
        running: getStatus(state),
        backend: getBackendStatus(state),
        db: getDbStatus(state)
    }
}

const mapDispatchToProps = (dispatch) => ({
    ...bindActionCreators(actions, dispatch),
    dispatch
});

class App extends Component {

    _startTest = () => {
        const {testStart, testEnd} = this.props;

        testStart();

        setTimeout(() => {
            testEnd();
        }, 10000);
    }

    render() {
        const {initial, running, backend, db, testStart} = this.props;
        const backendStyle = initial || running ? 'info' : (backend ? 'success' : 'danger');
        const backendText = initial || running ? 'Is the backend accessible?' : (backend ? 'Backend is accessible' : 'Backend is not accessible');
        const dbStyle = initial || running ? 'info' : (db ? 'success' : 'danger');
        const dbText = initial || running ? 'Is the database accessible?' : (db ? 'Database is accessible' : 'Database is not accessible');

        return (
            <div>
                <Navbar>
                    <Navbar.Header>
                        <Navbar.Brand>
                            <a href="#">ProfileManagementTool</a>
                        </Navbar.Brand>
                    </Navbar.Header>
                </Navbar>
                <Grid>
                    <Row>
                        <Col md={ 6 } mdOffset={ 0 }>
                        <ListGroup>
                            <ListGroupItem bsStyle={ backendStyle }>
                                { backendText }
                            </ListGroupItem>
                            <ListGroupItem bsStyle={ dbStyle }>
                                { dbText }
                            </ListGroupItem>
                        </ListGroup>
                        <Button bsStyle="primary"
                            bsSize="large"
                            disabled={ running }
                            onClick={ () => this._startTest() }>
                            { running ? 'Testing...' : 'Start Test' }
                        </Button>
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }
}
;



const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)

export default ConnectedApp