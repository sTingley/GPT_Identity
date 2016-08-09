import React from 'react';
import {render} from 'react-dom';
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

import Menu from './Components/menu.jsx';
import Header from './Components/header.jsx';

import Home from './Components/Home.jsx';
import NameRegister from './Components/NameRegister.jsx';
import CoreIdentity from './Components/CoreIdentity.jsx';
import UploadKeyStore from './Components/Upload.jsx';

class App extends React.Component {
  render () {
    return (
      <div>
      	<Header />
	    	<div className="container-fluid">
		      <div className="row">
		        <div className="col-sm-3 col-md-2 sidebar hidden-md hidden-sm">
		        	<Menu />
		        </div>
		        <div className="col-sm-9 col-md-9 col-lg-10 col-lg-offset-2 col-md-offset-3 main">
		        	{this.props.children}
		        </div>
		      </div>
	      </div>
      </div>
    );
  }
}

render((
	<Router history={hashHistory}>
    	<Route path="/" component={App}>
      		<IndexRedirect to="/home" />
          <Route path="home" component={Home} />
      		<Route path="register" component={NameRegister} />
      		<Route path="identity" component={CoreIdentity} />
          <Route path="upload" component={UploadKeyStore} />
      	</Route>
    </Router>
), document.getElementById('app'));