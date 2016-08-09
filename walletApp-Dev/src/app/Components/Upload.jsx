import React from 'react';


// TODO : Drag and Upload
// TODO	: Dropbox/google cloud upload for mobile/tablet users
// TODO : File type validation, this can be done once finalized supported formats
class UploadKeyStore extends React.Component {

	constructor(props){
		super(props);
		this.state = {pubKey:"",priKey:"", fileread: false};
		this.uploadFile = this.uploadFile.bind(this);
	}

	uploadFile(e){
		e.preventDefault();
		var file = e.target.files.value;
		var fileType = file.split('.').pop();
		if(fileType == "json"){
			var reader = new FileReader();
			reader.onload = function(event){
				console.log(event.target.result);
		        var obj = JSON.parse(event.target.result);
		        this.setState({pubKey:obj.public_key, priKey: obj.private_key, fileread:true });
			}.bind(this);
			reader.readAsText(e.target.files.files[0]);
		} else {
			alert("Unknown file format ! We support only JSON");
		}
	}

	render () {
		var cssClass = 'hidden';
		if(this.state.fileread) cssClass = 'show';
	    return (
	    	<div className="panel panel-default">
	    	<div className="panel-heading"><strong>Upload Key Store File</strong> <small>JSON(.json) file format only supported</small></div>
	        <div className="panel-body">
	          <h4>Select file from your computer</h4>
	          <form action="" method="post" encType="multipart/form-data" id="js-upload-form" onSubmit={this.uploadFile}>
	            <div className="form-inline">
	              <div className="form-group">
	                <input type="file" name="files" id="js-upload-files" />
	              </div>
	              <button type="submit" className="btn btn-sm btn-primary" id="js-upload-submit">UPLOAD</button>
	            </div>
	          </form><br/>
	          <div className={cssClass}>
	          	<p><b>Public Key : </b> {this.state.pubKey}</p>
	          	<p><b>Private Key : </b>{ this.state.priKey}</p>
	          </div>
	        </div>
	      </div>
	    );
   }
}

export default UploadKeyStore;