import React from 'react';
import {render} from 'react-dom';
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

// InProgress: Search/Save Class for assets

// TODO: import components on demand
// TODO: Remove code duplication, Wallet main menu exists in two places (menu.jsx and header.jsx) for responsive make that as single component.
// TODO: Login state should maintain in LocalStorage or Browser Cookie, as of now its in window
// TODO: Asset should be implemented with real data
// TODO: Asset menu only applicable for logged in users, this will be taking care once the functionality get done


import Menu from './Components/menu.jsx';
import Header from './Components/header.jsx';
import Home from './Components/Home.jsx';
import NameRegister from './Components/NameRegister.jsx';
import CoreIdentity from './Components/CoreIdentity.jsx';
import UploadKeyStore from './Components/Upload.jsx';
import ToVote from './Components/ToVote.jsx';
import Assets from './Components/Assets.jsx';

import Documents from './Components/Documents.jsx';
import NewUpload from './Components/NewUpload.jsx';
import AllDocuments from './Components/AllDocuments.jsx';

// saving state in global scope so that the variable could be accessible through out the application
// Dirty hack, need to change
window.login = false;

class App extends React.Component {

  constructor(props){
	  super(props);
	  this.state = {
		  login: false,
		  userKey: null,
		  coid: null
	  }
	  this.loginHandler = this.loginHandler.bind(this);
	  this.getcoid = this.getcoid.bind(this);
  }

  loginHandler(childstate){
	  this.setState({
		login: true,
		userKey: childstate.pubKey,
		coid:childstate.coid
	  });
	  login = this.state.login;
  }

  getcoid(){
	return this.state.coid;
  }

  render () {
	return (
	  <div>
      	<Header loggedin={this.state.login} />
	    	<div className="container-fluid">
		      <div className="row">
		        <div className="col-sm-3 col-md-2 sidebar hidden-md hidden-sm">
		        	<Menu loggedin={this.state.login} />
		        </div>
		        <div className="col-sm-9 col-md-9 col-lg-10 col-lg-offset-2 col-md-offset-3 main">
		        	{this.props.children && React.cloneElement(this.props.children, {
					  loginHandler: this.loginHandler,
					  getcoid: this.getcoid
					})}
		        </div>
		      </div>
	      </div>
      </div>
    );
  }
}

function validateLogin(nextState, replaceState){
	if(!login){
		// if not logged in user has been redirected to keystore upload screen
		replaceState({ nextPathname: nextState.location.pathname }, '/upload')
	}
}

render((
	<Router history={hashHistory}>
    	<Route path="/" component={App}>
					<IndexRedirect to="/home" />
					<Route path="home" component={Home} />
					<Route path="register" component={NameRegister} />
					<Route path="tovote" component={ToVote} onEnter={validateLogin} />
					<Route path="identity" component={CoreIdentity} />
					<Route path="upload" component={UploadKeyStore} />
					<Route path="assets" component={Assets} />
					<Route path="docs" component={Documents}>
						<IndexRedirect to="/docs/upload" />
						<Route path="/docs/upload" component={NewUpload} />
						<Route path="/docs/alldocs" component={AllDocuments} />
					</Route>
      	</Route>
    </Router>
), document.getElementById('app'));
