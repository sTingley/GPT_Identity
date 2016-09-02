import React, {Component} from 'react';
import { Link } from 'react-router';

class Documents extends Component {
	
	getActiveClass(menu){
		var path = this.props.location.pathname.split("/");
		if(menu == path[2])
			return "active";
		return "";
	}
	
	render(){
		return(
			<div className="documents" id="documents-container">
				<h3>Manage Documents</h3> <hr/>
				<ul className="nav nav-tabs">
					<li role="presentation" className={this.getActiveClass("upload")}>
						<Link to="/docs/upload" activeClassName="active">Upload Document</Link>
					</li>
					<li role="presentation" className={this.getActiveClass("alldocs")}>
						<Link to="/docs/alldocs" activeClassName="active">All Documents</Link>
					</li>
				</ul>
				<div className="tab-content docs-tabs">
				{this.props.children}
				</div>
			</div>
		);
	}
}
export default Documents;