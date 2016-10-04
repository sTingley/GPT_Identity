import React from 'react';
import { Link } from 'react-router';

class Notify extends React.Component {
	constructor(props){
		super(props);
		this.prop = props;
	}
	render(){
		//var type = this.prop.params.type || "info";
		//var css = "alert alert-"+type;
		return (
			<div className="alert alert-info" role="alert">
			  <span className="glyphicon glyphicon-alert"></span>You received an notification <Link to="/tovote">Click to open</Link>
			</div>
		);
	}
};

// TODO : Drag and Upload
// TODO	: Dropbox/google cloud upload for mobile/tablet users
// TODO : File type validation, this can be done once finalized supported formats
class UploadKeyStore extends React.Component {

	constructor(props){
		super(props);
		this.url = twinUrl + "ballot/readNotify/";
		this.state = {
			pubKey:"",
			priKey:"", 
			fileread: false,
			notify: false,
			coid:null
		};
		this.uploadFile = this.uploadFile.bind(this);
		this.onResponse = this.onResponse.bind(this);
	}

	getUrl(){
		return this.url + this.state.pubKey;
	}

	toVote(){
		$.get(this.getUrl(), this.onResponse);
	}
	
	createStorage(pubKey){
		localStorage.setItem("pubKey", pubKey);
		var now = new Date();
		now.setMinutes(now.getMinutes() + 30);
		localStorage.setItem("timestamp", now.getTime());
	}

	uploadFile(e){
		e.preventDefault();
		var file = e.target.files.value;
		var fileType = file.split('.').pop();
		if(fileType == "json"){
			var reader = new FileReader();
			reader.onload = function(event){
		        var obj = JSON.parse(event.target.result);
				this.createStorage(obj.public_key);
		        this.setState({pubKey:obj.public_key, priKey: obj.private_key, fileread:true });
				this.props.loginHandler(this.state);
		        this.toVote();
			}.bind(this);
			reader.readAsText(e.target.files.files[0]);
		} else {
			alert("Unknown file format ! We support only JSON");
		}
	}

	onResponse(result){
		if(!$.isPlainObject(result)){
			var data = JSON.parse(result);	
		} else 
			var data = result;
		if(data.messages){
			var msgs = data.messages;
			this.setState({coid: msgs});
			if(msgs.length > 0){
				for(var i=0; i<msgs.length; i++){
					if(msgs[i].read_status == false){
						this.setState({notify: true});
					}
				}
			}
			
		}
	}

	render () {
		var cssClass = 'hidden';
		if(this.state.fileread) cssClass = 'show';
	    return (
	    	<div className="panel panel-default">
	    	<div className="panel-heading"><strong>Upload Key Store File</strong> <small>JSON(.json) file format only supported</small></div>
	        <div className="panel-body">
	         {this.state.notify ? <Notify /> : null}
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
	          </div>
	        </div>
	      </div>
	    );
   }
}

export default UploadKeyStore;