import React, { Component } from 'react';
import { Card, CardHeader, CardBlock, CardSubtitle, CardGroup, InputGroup, InputGroupAddon, Input, Button, Form, FormGroup, FormFeedback } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import styles from './Login.scss'

class Login extends Component {

    constructor(props) {
        super(props);

        this.state = {
            loginName: '',
            signupName: ''
        };
    }

    _handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : (e.option ? e.option.value : e.target.value);
        const name = e.target.name;

        //TODO: validate

        this.setState({
            [name]: value
        });
    }

    _login = (e) => {
        const {loginUser} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        loginUser({
            name: this.state.loginName
        })

        this.setState({
            loginName: ''
        });
    }

    _signup = (e) => {
        const {createUser} = this.props;

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        createUser({
            name: this.state.signupName
        })

        this.setState({
            signupName: ''
        });
    }

    render() {
        const {loginState, signupState, t} = this.props;
        return (
            <div className="d-flex flex-row align-items-center h-100 w-100 p-0 bg-gray">
                <div className="d-flex flex-row justify-content-center w-100">
                    <CardGroup className="w-50">
                        <Card className="rounded-0">
                            <CardHeader className="pt-5 border-0 bg-white">
                                <h1>{ t('login') }</h1>
                            </CardHeader>
                            <CardBlock className="pb-5 h-100">
                                <Form onSubmit={ this._login } className="h-100 d-flex flex-column justify-content-between">
                                    <FormGroup color={ loginState.error ? 'danger' : loginState.msg ? 'success' : 'default' }>
                                        <p className="text-muted">
                                            { t('signIn') }
                                        </p>
                                        <InputGroup>
                                            <InputGroupAddon className="rounded-0">
                                                <FontAwesome name="user" size='lg' />
                                            </InputGroupAddon>
                                            <Input name="loginName"
                                                value={ this.state.loginName }
                                                placeholder={ t('username') }
                                                autoFocus
                                                className="rounded-0"
                                                state={ loginState.error ? 'danger' : '' }
                                                onChange={ this._handleInputChange } />
                                        </InputGroup>
                                        <FormFeedback>
                                            { loginState.msg || <span><br/><br/></span> }
                                        </FormFeedback>
                                    </FormGroup>
                                    <Button type="submit" color="info" className="rounded-0">
                                        { t('login') }
                                    </Button>
                                </Form>
                            </CardBlock>
                        </Card>
                        <Card inverse color="info" className="rounded-0 signup">
                            <CardHeader className="pt-5 border-0">
                                <h1>{ t('signUp') }</h1>
                            </CardHeader>
                            <CardBlock className="pb-5 h-100">
                                <Form onSubmit={ this._signup } className="h-100 d-flex flex-column justify-content-between">
                                    <FormGroup color={ signupState.error ? 'danger' : signupState.msg ? 'success' : 'default' }>
                                        <p className="text-muted">
                                            { t('register') }
                                        </p>
                                        <InputGroup>
                                            <InputGroupAddon className="rounded-0">
                                                <FontAwesome name="user" size='lg' />
                                            </InputGroupAddon>
                                            <Input name="signupName"
                                                value={ this.state.signupName }
                                                placeholder={ t('newUsername') }
                                                className="rounded-0"
                                                state={ signupState.error ? 'danger' : '' }
                                                onChange={ this._handleInputChange } />
                                        </InputGroup>
                                        <FormFeedback>
                                            { signupState.msg || <span><br/><br/></span> }
                                        </FormFeedback>
                                    </FormGroup>
                                    <Button type="submit" color="secondary" className="rounded-0">
                                        { t('signUp') }
                                    </Button>
                                </Form>
                            </CardBlock>
                        </Card>
                    </CardGroup>
                </div>
            </div>
        );
    }
}
;

export default Login
