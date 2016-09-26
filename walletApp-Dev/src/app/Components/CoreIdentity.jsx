import React from 'react';
import TagsInput from 'react-tagsinput';

class CoreIdentity extends React.Component {
	
	constructor(props){
		super(props);
		this.state = {
			name:'',
			official_id:[],
			owner_id:[],
			control_id:[],
			recovery_id:[],
			owner_token_id:[],
			control_token_id:[],
			files:[]
		};
		this.onFieldChange = this.onFieldChange.bind(this);
	}
	
	onFieldChange(inputField, e){
		var multipleValues = {};
		if(inputField == "name"){
			this.setState({name: e.target.value});
		} else {
			multipleValues[inputField] = e;
			this.setState(multipleValues);
		}
	}
	
	uploadFile(e){
		var fileInput = $("input[name=documents]");
		var pubKey = $("input[name=user_pubkey]").val();
		var fData = new FormData();
		
		fData.append("user_pubkey", pubKey);
		 $.each(fileInput[0].files, function(key, value){
			fData.append(key, value);
		});
		
		//var fData = new FormData(e.target);
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
	
	submitCoid(e){
		e.preventDefault();
		console.log("submitted values ==> ", this.state);
	}
	
	render () {
		var inputAttrs = {
			addKeys: [13,188],	// Enter and comma
			inputProps: {
				placeholder: "use comma(,) to add multiple values",
				style:{width:'30%'}
			}
		};
	    return (
	    	<div id="CoreIdentityContainer">
	    		<h1>Core Identity</h1>
	    		<form method="POST" id="register" role="form" onSubmit={this.submitCoid.bind(this)}>
						<div className="form-group">
							<label htmlFor="name">Name</label>
							<input className="form-control" id="name" type="text" name="name" onChange={ (e)=>{ this.onFieldChange("name", e) } }/>
						</div>	
						<div className="form-group">
							<label htmlFor="official_id">Official ID</label>
							<TagsInput {...inputAttrs} value={this.state.official_id} onChange={(e)=>{ this.onFieldChange("official_id", e) } } />
						</div>
						<div className="form-group">
							<label htmlFor="owner_id">Owner ID</label>
							<TagsInput {...inputAttrs} value={this.state.owner_id} onChange={(e)=>{ this.onFieldChange("owner_id", e) } } />
						</div>
						<div className="form-group">
							<label htmlFor="control_id">Control ID</label>
							<TagsInput {...inputAttrs} value={this.state.control_id} onChange={(e)=>{ this.onFieldChange("control_id", e) } } />
						</div>
						<div className="form-group">
							<label htmlFor="recovery_id">Recovery ID</label>
							<TagsInput {...inputAttrs} value={this.state.recovery_id} onChange={(e)=>{ this.onFieldChange("recovery_id", e) } } />
						</div>
						<div className="form-group">
							<label htmlFor="owner_token_id">Ownership Token ID</label>
							<TagsInput {...inputAttrs} value={this.state.owner_token_id} onChange={(e)=>{ this.onFieldChange("owner_token_id", e) } } />
						</div>
						<div className="form-group">
							<label htmlFor="control_token_id">Control Token ID</label>
							<TagsInput {...inputAttrs} value={this.state.control_token_id} onChange={(e)=>{ this.onFieldChange("control_token_id", e) } } />
						</div>
						<div className="form-group">
							<label htmlFor="documents" className="col-md-12">Documents</label>
							<div className="col-md-4">
								<input type="file" className="form-control" name="documents" multiple />
								<input type="hidden" className="form-control" name="user_pubkey" value="1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740" />
							</div>
							<div className="col-md-8">
								<input type="submit" value="Upload" className="btn btn-primary" onClick={this.uploadFile.bind(this)} />
							</div>
						</div>
						<div className="form-group">
						  <div className="col-sm-6">
						  <br/>
							<button className="btn btn-primary" type="submit">Submit Identity</button>
						  </div>
						</div>
					</form>
	    	</div>
	    );
   }
}

export default CoreIdentity;