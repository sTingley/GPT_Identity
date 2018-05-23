import React from 'react';
//import { Link } from 'react-router';

class Header extends React.Component {
  render() {
    //var prop = this.props;
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
            <a className="navbar-brand" href="#">Your Digital Identity Wallet</a>
          </div>
          <ul className="nav navbar-nav navbar-right">
            <li><a href="http://www.tcs.com">Powered by TCS, Monax, BigChainDB and IPFS</a></li>
          </ul>
        </div>
      </nav>
    );
  }
}
export default Header;