import React, {Component} from 'react';
var Dropzone = require('react-dropzone');

class NewUpload extends Component {
	
	constructor(props){
		super(props);
		this.state = {
			files:[]
		}
		this.uploadFile = this.uploadFile.bind(this);
	}
	
	uploadFile(e){
		
		var fData = new FormData(e.target);
		$.ajax({
			url: "http://localhost:5050/ipfs/upload",
			type: 'POST',
			data: fData,
			cache: false,
			processData: false,
			contentType: false,
			success: function (dataofconfirm) {
				console.log("on Response");
			}
		});
		e.preventDefault();
	}
	
	render(){
		var cssClass = "hidden";
		var allFiles = this.state.files;
		if(this.state.files.length > 0)
			cssClass="";
		return(
			<div className="new-upload">
				<form action="" className="form-inline" method="post" encType="multipart/form-data" onSubmit={this.uploadFile}>
					<div className="form-group">
						<input type="file" className="form-control" name="documents" multiple />
					</div>
					<input type="hidden" name="user_pubkey" value="1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740" />
					<input type="submit" value="Upload" className="btn btn-primary" />
				</form>
			</div>
		);
	}
}
export default NewUpload;