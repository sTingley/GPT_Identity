import React from 'react';
import TagsInput from 'react-tagsinput';

class UploadIpfsFile extends React.Component {

	constructor(props){
		super(props);
		this.state = {
			docs: {},
			pubKey: '1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740',
			selected:'0',
			files:''
		};
		this.inputChangeHandler = this.inputChangeHandler.bind(this);
	}

	componentDidMount(){
		$.ajax({
			url: "http://localhost:5050/ipfs/alldocs/"+this.state.pubKey,
			dataType: 'json',
			cache: false,
			success: function(resp) {
				this.setState({docs: resp.data.documents});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
		
		$("#CoreIdentityContainer .modal").modal('show');
        $("#CoreIdentityContainer .modal").on('hidden.bs.modal', this.props.handleHideModal);
	}
	
	uploadHandler(data, additionalParams){
		var params = {
			url: "http://localhost:5050/ipfs/upload",
			type: 'POST',
			data: data,
			cache: false,
			processData: false,
			contentType: false,
		};
		$.extend(params, additionalParams);
		$.ajax(params);
	}
	
	fileHandler(e){
		e.preventDefault();
		if(this.state.selected != "0"){
			var hash, fileHash;
			[hash, fileHash] = this.state.selected.split("|");
			this.props.dataHandler(hash, fileHash);
		} else {
			console.log(this.state.files);
			if(this.state.files.size > 0){
				var fileInput = $("input[name=newdoc]");
				var fData = new FormData();
				fData.append("user_pubkey", this.state.pubKey);
				 $.each(fileInput[0].files, function(key, value){
					fData.append(key, value);
				});
				var _this = this;
				var callbacks = {
					beforeSend: (xhr) => {
						$("button[name=uploadsubmit]").button('loading');
						$("button.close").hide();
					},
					success: function(resp){
						if(resp.uploded && resp.uploded.length > 0){
							var hash = resp.uploded[0].hash,
								fileHash = resp.uploded[0].file_hash;
							this.props.dataHandler(hash, fileHash);
							$("button.close").trigger("click");
						}
					}.bind(this),
					complete: () => {
						$("button[name=uploadsubmit]").button('reset');
						$("button.close").show();
					}
				};
				this.uploadHandler(fData,callbacks);
			}
		}
	}
	
	inputChangeHandler(e){
		if(e.target.tagName == "SELECT"){
			this.setState({selected: e.target.value});
		} else 
			this.setState({files: e.target.files[0]});
	}

	render(){
		var center = {
			textAlign: 'center'
		};
		return(
			<div className="modal fade">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                  <h4 className="modal-title">Upload Document</h4>
                </div>
                <div className="modal-body">
                  <form>
                  	<div className="form-group">
                  		<label htmlFor="get-hash">Choose from documents</label>
                  		<select className="form-control" onChange={this.inputChangeHandler}>
							<option value="0">Select Document</option>
						{(()=>{
							if(this.state.docs && this.state.docs.length > 0){
								var i=0;
								return this.state.docs.map((obj) => {
									i++;
									var optsVal = obj.hash+"|"+obj.file_hash;
									return <option value={optsVal} key={i}>{obj.filename}</option>
								});
							} else {
								return <option value="0">-- Empty --</option>
							}
						})()}
						</select>
                  	</div>
                  	<p style={center}>(or)</p>
                  	<div className="form-group">
                  		<label htmlFor="documents">Upload Document</label>
                  		<input type="file" className="form-control" name="newdoc" onChange={this.inputChangeHandler}/>
                  	</div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button type="button" data-loading-text="Processing..." name="uploadsubmit" className="btn btn-success" onClick={this.fileHandler.bind(this)}>Submit</button>
                </div>
              </div>
            </div>
          </div>
		)
	}
};

class UniqIdForm extends React.Component {

	constructor(props){
		super(props);
	}

	render(){
		return(
			<div className="form-group col-md-12">
				<div className="col-md-10">
					<input name="uniq_id_key" className="form-control col-md-4" type="text" placeholder="Label" />
				</div>
				<div className="col-md-2">
					<button type="button" onClick={this.props.handleShowModal} className="btn btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
				</div>
			</div>
		);
	}
};



class CoreIdentity extends React.Component {
	
	constructor(props){
		super(props);
		this.state = {
			name:'',
			unique_id:{},
			inputs: ['input-0','input-1'],
			official_id:[],
			owner_id:[],
			control_id:[],
			recovery_id:[],
			owner_token_id:[],
			control_token_id:[],
			showModal: false
		};
		
		this.maxUniqAttr = 10;
		this.onFieldChange = this.onFieldChange.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
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
	
	getFileDetails(hash, fileHash){
		console.log("Hash==>"+hash+" ==> "+ fileHash);
	}
	
	submitCoid(e){
		e.preventDefault();
		console.log("submitted values ==> ", this.state);
	}

	handleHideModal(){
		this.setState({showModal: false});
	}

	handleShowModal(){
        this.setState({showModal: true});
    }

	appendInput() {
		var inputLen = this.state.inputs.length;
		if(inputLen < this.maxUniqAttr){
			var newInput = `input-${inputLen}`;
        	this.setState({ inputs: this.state.inputs.concat([newInput]) });
		}
    }
	
	render () {
		var inputAttrs = {
			addKeys: [13,188],	// Enter and comma
			inputProps: {
				placeholder: "use comma(,) to add multiple values",
				style:{width:'30%'}
			}
		};
		var syle = {
			marginRight:'15px'
		}
	    return (
	    	<div id="CoreIdentityContainer">
	    		<h1>Core Identity</h1>
	    		<form method="POST" id="register" role="form" onSubmit={this.submitCoid.bind(this)}>
					<div className="form-group">
						<label htmlFor="name">Name</label>
						<input className="form-control" id="name" type="text" name="name" onChange={ (e)=>{ this.onFieldChange("name", e) } }/>
					</div>
					<div className="form-group">
						<label htmlFor="unique_id">Unique Id</label>
						{this.state.inputs.map(input => <UniqIdForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} />)}
					</div>
					<div className="form-group"> 
						<div className="col-md-offset-6 col-md-6 "> 
							<p></p>
							<button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInput.bind(this)}>
								<span className="glyphicon glyphicon-plus"></span>Add More
							</button>
						</div>
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
					  <div className="col-sm-6">
					  <br/>
						<button className="btn btn-primary" data-loading-text="Submit Identity" name="submit-form" type="submit">Submit Identity</button>
					  </div>
					</div>
				</form>
				{this.state.showModal ? <UploadIpfsFile dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal}/> : null}
        </div>
    );
   }
}

export default CoreIdentity;