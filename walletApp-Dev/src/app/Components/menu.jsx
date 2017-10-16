import React from 'react';
import { Link } from 'react-router';

class Menu extends React.Component {

	constructor(props) {
		super(props);
		// this.state = {
		// 	userLoggedIn: this.props.loggedin
		// }
	}

	componentWillMount(){
		//here we need to add code to check if Moodys is logged in
	}

	render() {
		let prop = this.props;
		return (
			<div className="col-sm-3 col-md-2 sidebar">
				<ul className="nav nav-pills nav-stacked">
					<li><Link to='/home' activeClassName="active">Home</Link></li>
					<li><Link to='/upload' activeClassName="active">Login</Link></li>
					{prop.loggedin ? <li><Link to='/identity' activeClassName="active"><b>Membership</b></Link></li> : ''}
					{prop.loggedin ? <li><Link to='/myGatekeeper' activeClassName="active">Asset Creation</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/tovote' activeClassName="active">Notarization Requests</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/Attestations' activeClassName="active">Notarized Items</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/assets' activeClassName="active">My Assets</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/dashboard' activeClassName="active">Investor Dashboard</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/docs' activeClassName="active">My Documents</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/notifications' activeClassName="active">Notifications</Link></li> : ''}
					{prop.loggedin ? <li><Link to='/mycoreidentity' activeClassName="active">Manage Identities and Assets</Link></li> : ''}
				</ul>
			</div>
		);
	}
}

export default Menu;
