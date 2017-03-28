import React from 'react';
import {render} from 'react-dom';
import {Router, Route, IndexRedirect, hashHistory, RouterContext} from 'react-router';
import dmConfig from './dm_config.json';

import Menu from './Components/menu.jsx';
import Header from './Components/header.jsx';
import Home from './Components/Home.jsx';
import DigitalIdentity from './Components/DigitalIdentity.jsx';
import ManageRequest from './Components/ManageRequests.jsx';
import UploadKeyStore from './Components/Upload.jsx';

import DataRequest from './Components/DataRequest.jsx';
import MyData from './Components/MyData.jsx';
import DataRequestsByYou from './Components/DataRequestsByYou.jsx';
import DataRequestsForYou from './Components/DataRequestsForYou.jsx';

class App extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            login: localStorage.getItem("pubKey") || false,
            role: localStorage.getItem("role") || false
        }
        this.loginHandler = this.loginHandler.bind(this);
    }

    loginHandler(childstate) {
        var state = localStorage.getItem("pubKey");
        var role = localStorage.getItem("role");
        this.setState({
            login: state || false,
            userKey: childstate.pubKey || state,
            role: childstate.role || role
        });
        setTimeout(function() {
            this.context.router.push("requests")
        }.bind(this), 500);
    }

    render() {
        return (
            <div>
                <Header loggedin={this.state.login} role={this.state.role}/>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-3 col-md-2 sidebar hidden-md hidden-sm">
                            <Menu loggedin={this.state.login} role={this.state.role}/>
                        </div>
                        <div className="col-sm-9 col-md-9 col-lg-10 col-lg-offset-2 col-md-offset-3 main">
                            {this.props.children && React.cloneElement(this.props.children, {
                                loginHandler: this.loginHandler,
                                loggedin: this.state.loggedin,
                                role: this.state.role
                            })}
                        </div>
                    </div>
                </div>
                <div className="copyright">Copyright © 2017 Tata Consultancy Services | CMI Industry Advisory Group</div>
            </div>
        );
    }
}
App.contextTypes = {
    router: React.PropTypes.object.isRequired
}

function validateLogin(nextState, replace) {
    var isKeyExists = localStorage.getItem("pubKey");
    var role = localStorage.getItem("role");
    var now = new Date().getTime();
    var sessionTime = parseInt(localStorage.getItem("timestamp"));
    if (sessionTime <= now || !isKeyExists) {
        localStorage.clear();
        alert("Your session timed out, Please upload keypairs file again");
        replace({
            pathname: '/upload',
            state: {
                nextPathname: nextState.location.pathname
            }
        });
        window.location.reload();
    } else {
        if (nextState.location.pathname == "/requests" && role == dmConfig.roles.requester) {
            replace({
                pathname: '/requests/new',
                state: {
                    nextPathname: nextState.location.pathname
                }
            });
        } else if (nextState.location.pathname == "/requests" && role == dmConfig.roles.owner) {
            replace({
                pathname: '/requests/mydata',
                state: {
                    nextPathname: nextState.location.pathname
                }
            });
        }
    }
}

function handleRequestsPathChange(prevState, nextState, replace) {
    var role = localStorage.getItem("role");
    if (nextState.location.pathname == "/requests" && role == dmConfig.roles.requester) {
        replace({
            pathname: '/requests/new',
            state: {
                nextPathname: nextState.location.pathname
            }
        });
    } else if (nextState.location.pathname == "/requests" && role == dmConfig.roles.owner) {
        replace({
            pathname: '/requests/mydata',
            state: {
                nextPathname: nextState.location.pathname
            }
        });
    }
}

render((
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <IndexRedirect to="/digitalIdentity"/>
            <Route path="digitalIdentity" component={DigitalIdentity}/>
            <Route path="upload" component={UploadKeyStore}/>
            <Route path="/requests" component={ManageRequest} onEnter={validateLogin} onChange={handleRequestsPathChange}>
                <Route path="/requests/new" component={DataRequest} onEnter={validateLogin}/>
                <Route path="/requests/sent" component={DataRequestsByYou} onEnter={validateLogin}/>
                <Route path="/requests/mydata" component={MyData} onEnter={validateLogin}/>
                <Route path="/requests/received" component={DataRequestsForYou} onEnter={validateLogin}/>
            </Route>
        </Route>
    </Router>
), document.getElementById('app'));
