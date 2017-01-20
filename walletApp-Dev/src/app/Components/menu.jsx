import React from 'react';
import { Link } from 'react-router';
class Menu extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			userLoggedIn: this.props.loggedin
		}
	}
	render () {
		var prop = this.props;
		return (
		  <div className="col-sm-3 col-md-2 sidebar">
			  <ul className="nav nav-pills nav-stacked">
				<li><Link to='/home' activeClassName="active">Home</Link></li>
				<li><Link to='/upload' activeClassName="active">Upload Keys</Link></li>
				{ prop.loggedin ?  <li><Link to='/tovote' activeClassName="active">Vote</Link></li> : ''}
				{ prop.loggedin ?  <li><Link to='/notifications' activeClassName="active">Notifications</Link></li> : ''}
				{ prop.loggedin ?  <li><Link to='/register' activeClassName="active">Name Register</Link></li> : ''}
				{ prop.loggedin ?  <li><Link to='/identity' activeClassName="active">Core Identity</Link></li> : '' }
				{ prop.loggedin ?  <li><Link to='/assets' activeClassName="active">Assets</Link></li> : '' }
				{ prop.loggedin ?  <li><Link to='/docs' activeClassName="active">My Documents</Link></li> : '' }
				{ prop.loggedin ?  <li><Link to='/myGatekeeper' activeClassName="active">My Gatekeeper</Link></li> : '' }
				{ prop.loggedin ?  <li><Link to='/mycoreidentity' activeClassName="active">My Core Identity</Link></li> : '' }
				{ prop.loggedin ?  <li><Link to='/identitydimension' activeClassName='active'>Identity Dimensions</Link></li> : '' }
			  </ul>
			</div>
		);
	}
}

export default Menu;
