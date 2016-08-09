import React from 'react';
import { Link } from 'react-router';
class Menu extends React.Component {

  render () {
    return (
      <div className="col-sm-3 col-md-2 sidebar">
          <ul className="nav nav-pills nav-stacked">
            <li><Link to='/home' activeClassName="active">Home</Link></li>
            <li><Link to='/upload' activeClassName="active">Upload Keys</Link></li>
            <li><Link to='/register' activeClassName="active">Name Register</Link></li>
            <li><Link to='/identity' activeClassName="active">Core Identity</Link></li>
          </ul>
        </div>
    );
  }
}

export default Menu;