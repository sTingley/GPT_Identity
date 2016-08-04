import React from 'react';
import {render} from 'react-dom';
import { Router, Route, IndexRoute, hashHistory } from 'react-router'


import Menu from './Components/menu.jsx';
import Header from './Components/header.jsx';


import Home from './Components/Home.jsx';
import NameRegister from './Components/NameRegister.jsx';
import CoreIdentity from './Components/CoreIdentity.jsx';

class App extends React.Component {
  render () {
    return (
      <div>
      	<Header />
	    	<div className="container-fluid">
		      <div className="row">
		        <div className="col-sm-3 col-md-2 sidebar">
		        	<Menu />
		        </div>
		        <div className="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main">
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
      		<IndexRoute component={Home} />
      		<Route path="register" component={NameRegister} />
      		<Route path="identity" component={CoreIdentity} />
      	</Route>
    </Router>
), document.getElementById('app'));