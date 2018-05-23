import React from 'react';
import { Link } from 'react-router';
import dmConfig from '../dm_config.json';

class Header extends React.Component {

  render() {
	var prop = this.props;
    return (
      <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand" href="#">TCS Data Monetization Platform</a>
          </div>
          <div id="navbar" className="navbar-collapse collapse">
            <ul className="nav navbar-nav hidden-lg">
              <li><Link to='/home' activeClassName="active">Home</Link></li>
    					<li><Link to='/upload' activeClassName="active">Upload Keys</Link></li>
    					<li><Link to='/requests' activeClassName="active">Manage Data Request</Link></li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }
}
export default Header;
