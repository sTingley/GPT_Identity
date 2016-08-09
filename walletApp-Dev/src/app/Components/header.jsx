import React from 'react';
import { Link } from 'react-router';

class Header extends React.Component {

  render () {
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
            <a className="navbar-brand" href="#">Eris Wallet</a>
          </div>
          <div id="navbar" className="navbar-collapse collapse">
             <ul className="nav navbar-nav hidden-lg">
                <li><Link to='/home' activeClassName="active">Home</Link></li>
                <li><Link to='/upload' activeClassName="active">Upload Keys</Link></li>
                <li><Link to='/register' activeClassName="active">Name Register</Link></li>
                <li><Link to='/identity' activeClassName="active">Core Identity</Link></li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
                <li><a href="#">Faq</a></li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }
}
export default Header;