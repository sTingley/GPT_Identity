import React from 'react';
import { Link } from 'react-router';
class Menu extends React.Component {

  render () {
	console.log("login state", this.props.loggedin);
    return (
      <div className="col-sm-3 col-md-2 sidebar">
          <ul className="nav nav-pills nav-stacked">
            <li><Link to='/home' activeClassName="active">Home</Link></li>
            <li><Link to='/upload' activeClassName="active">Upload Keys</Link></li>
			{(() => {
				if(this.props.loggedin)
					return  <li><Link to='/tovote' activeClassName="active">Vote</Link></li>
			})()}
            <li><Link to='/register' activeClassName="active">Name Register</Link></li>
            <li><Link to='/identity' activeClassName="active">Core Identity</Link></li>
			<li><Link to='/assets' activeClassName="active">Assets</Link></li>
			<li><Link to='/docs' activeClassName="active">My Documents</Link></li>
          </ul>
        </div>
    );
  }
}

export default Menu;