import React from 'react';
import { Link } from 'react-router';
import dmConfig from '../dm_config.json';

class Menu extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			userLoggedIn: this.props.loggedin
		}
	}

	componentWillReceiveProps(nextprops){
		this.state = {
			userLoggedIn: nextprops.loggedin
		}
	}

	render () {
		var prop = this.props;
		return (
		  <div className="col-sm-3 col-md-2 sidebar">
			  <ul className="nav nav-pills nav-stacked">
				  <li><Link to='/digitalIdentity' activeClassName="active">Digital Identity</Link></li>
					<li><Link to='/upload' activeClassName="active">Upload Keys</Link></li>
					{
						(this.state.userLoggedIn) ? <li><Link to='/requests' activeClassName="active">Manage Data Request</Link></li> :''
					}

			  </ul>
			</div>
		);
	}
}

export default Menu;
