import React, {Component} from 'react';
import { Link } from 'react-router';

class Documents extends Component {
	
	constructor(props){
		super(props);
		this.state = {
			docs:{},
			pubKey: '1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740'
		};
	}
	
	componentDidMount(){
		$.ajax({
			url: "http://localhost:5050/ipfs/alldocs/"+this.state.pubKey,
			dataType: 'json',
			cache: false,
			success: function(resp) {
				console.log("Response Data ", resp.data.documents)
				this.setState({docs: resp.data.documents});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	}
	
	getDateFormat(timestamp){
		var d = new Date(timestamp);
		return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
	}
	
	render(){
		var style = {
			fontSize: '13px',
			lineHeight: 2
		}
		return(
			<div className="documents" id="documents-container">
				<h3>My Documents</h3> <hr/>
				<div className="file-container">
					<ul className="list-group">
						{(() => {
							if(this.state.docs.length > 0){
								var i = 0;
								return this.state.docs.map((files) => {
									i++;
									return(
										<li key={i} className="list-group-item">
											<a className="btn btn-success btn-sm pull-right" href={files.ipfs_url} target="_blank" role="button">Download</a>
											<h4 className="list-group-item-heading">{files.filename}</h4>
											<p className="list-group-item-text" style={style}><b className="text-info">Created On:</b> { this.getDateFormat(files.timestamp) }</p>
											<p className="list-group-item-text" style={style}><b className="text-info">IPFS Hash:</b> { files.hash }</p>
										</li>
									)
								})
								
							} else {
								return <li className="list-group-item">No documents found</li>
							}
						})(this)}
					</ul>
				</div>
			</div>
		);
	}
}
export default Documents;