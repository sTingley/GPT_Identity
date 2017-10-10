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
//import NameRegister from './Components/NameRegister.jsx';
import CoreIdentity from './Components/IdentityFederation/CoreIdentityForm.jsx';
import UploadKeyStore from './Components/Upload.jsx';
import ToVote from './Components/ToVote.jsx';
import Notifications from './Components/Notifications.jsx';
import Assets from './Components/Assets.jsx';
import MyCOID from './Components/MyCOID.jsx';
import IdentityDimension from './Components/IdentityDimension/IdentityDimension.jsx';
import Documents from './Components/Documents.jsx';
import MyGateKeeper from './Components/IdentityFederation/MyGatekeeper.jsx';
import Attestations from './Components/Attestations.jsx';

class App extends React.Component {

  constructor(props){
	  super(props);
	  this.state = {
		  login: localStorage.getItem("pubKey") || false
	  }
	  this.loginHandler = this.loginHandler.bind(this);
  }

  loginHandler(childstate){
	  var state = localStorage.getItem("pubKey");
	  this.setState({
		login:  state || false,
		userKey: childstate.pubKey || state
	  });
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
						loginHandler: this.loginHandler
					})}
		        </div>
		      </div>
	      </div>
      </div>
    );
  }
}

function validateLogin(nextState, replace){
	var isKeyExists = localStorage.getItem("pubKey");
	var now = new Date().getTime();
	var sessionTime = parseInt(localStorage.getItem("timestamp"));
	if(sessionTime <= now || !isKeyExists){
		localStorage.clear();
		alert("Your session timed out, Please upload keypairs file again");
		replace({ pathname: '/upload', state: {nextPathname: nextState.location.pathname} });
		window.location.reload();
	}
}

render((
	<Router history={hashHistory}>
    	<Route path="/" component={App}>
			<IndexRedirect to="/home" />
			<Route path="home" component={Home} />
			<Route path="upload" component={UploadKeyStore} />
			<Route path="tovote" component={ToVote} onEnter={validateLogin} />
			<Route path="notifications" component={Notifications} onEnter={validateLogin} />
			<Route path="identity" component={CoreIdentity} onEnter={validateLogin} />
			<Route path="assets" component={Assets} onEnter={validateLogin} />
			<Route path="docs" component={Documents} onEnter={validateLogin} />
			<Route path="myGateKeeper" component={MyGateKeeper} onEnter={validateLogin} />
			<Route path="mycoreidentity" component={MyCOID} onEnter={validateLogin} />
			<Route path="identitydimension" component={IdentityDimension} onEnter={validateLogin} />
			<Route path="Attestations" component={Attestations} onEnter={validateLogin} />
      	</Route>
    </Router>
), document.getElementById('app'));
