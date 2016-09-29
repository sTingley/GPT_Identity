import React from 'react';
import TagsInput from 'react-tagsinput';
import { sha3_256 } from 'js-sha3';

//TODO : Namespace validation 

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
			this.props.dataHandler(this.state.selected);
			$("button.close").trigger("click");
		} else {
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
							var filedata = resp.uploded[0].hash+"|"+resp.uploded[0].file_hash;
							this.props.dataHandler(filedata);
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
					<input name={'label-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Label"  />
				</div>
				<div className="col-md-2">
					<button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
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
			file_attrs:[],
			pubKey: '1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740',
			message:'',
			signature:'',
			inputs: ['input-0','input-1'],
			official_id:[],
			owner_id:[],
			control_id:[],
			recovery_id:[],
			owner_token_id:[],
			control_token_id:[],
			showModal: false,
			tmpFile:''
		};
		
		this.maxUniqAttr = 10;
		this.onFieldChange = this.onFieldChange.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
	}
	
	onFieldChange(inputField, e){
		var multipleValues = {};
		if(inputField == "name" || inputField == "signature" || inputField =="message"){
			this.setState({[inputField]: e.target.value});
		} else {
			multipleValues[inputField] = e;
			this.setState(multipleValues);
		}
	}
	
	getHash(input){
		var input = $.trim(input);
		if(input){
			var hash = sha3_256.update(input).hex();
			return hash;
		}
		return input;
	}
	
	getFileDetails(filedata){
		var obj = {[this.state.tmpFile]:filedata};
		this.setState({file_attrs: this.state.file_attrs.concat([obj])});
	}
	
	getLabelValues(){
		var labelVals = []
		var _this = this;
		$.each($("input[name^='label-']"), function(obj){
			var value = $.trim($(this).val());
			if(value.length > 0){
				labelVals.push({
					[$(this).attr('name').replace("label-","")] : value
				});
			}
		});
		return labelVals;
	}
	
	prepareJsonToSubmit(){
		var inputObj = {
				"pubKey": this.state.pubKey,
				"sig": this.state.signature,
				"msg": this.state.message,
				"name": this.state.name,
				"uniqueId": this.createHashAttribute(this.state.file_attrs),
				"uniqueIdAttributes": this.prepareUniqueIdAttrs(),
				"ownershipId": this.createHashAttribute(this.state.owner_id),
				"ownerIdList":this.valueIntoHash(this.state.owner_id),
				"controlId": this.createHashAttribute(this.state.control_id),
				"controlIdList": this.valueIntoHash(this.state.control_id),
				"ownershipTokenId": this.createHashAttribute(this.state.owner_token_id),
				"ownershipTokenAttributes":this.valueIntoHash(this.state.owner_token_id),
				"ownershipTokenQuantity": 3,
				"controlTokenId": this.createHashAttribute(this.state.control_token_id),
				"controlTokenAttributes": this.valueIntoHash(this.state.control_token_id),
				"controlTokenQuantity": 5,
				"identityRecoveryIdList": [],
				"recoveryCondition": 2,
				"yesVotesRequiredToPass": 2 
		};
		return inputObj;
	}
	
	createHashAttribute(values){
		if($.isArray(values) && values.length > 0){
			if($.isPlainObject(values[0])){
				var str = "";
				for(var i=0; i<values.length; i++){
					for(var key in values[i]){
						var hash, filehash;
						[hash,filehash] = values[i][key].split("|");
						if((values.length-1) == i)
							str += hash;
						else 
							str += hash+"|";
					}
				}
				return this.getHash(str);
			} else {
				var valStr = values.join("|");
				return this.getHash(valStr);
			}
			
		}
		return '';
	}
	
	valueIntoHash(values){
		var newArr = [];
		var _this = this;
		if($.isArray(values)){
			values.map((value) => {
				newArr.push(_this.getHash(value));
			});
		};
		return newArr;
	}
	
	prepareUniqueIdAttrs(){
		var newArr = [],
			labels = this.getLabelValues();
		for(var i=0; i<labels.length; i++){
			var tmpArr = [];
			for(var key in labels[i]){
				tmpArr.push(labels[i][key]);
				var ipfsHash, fileHash;
				[ipfsHash, fileHash] = this.state.file_attrs[i][key].split("|");
				tmpArr.push(fileHash);
				tmpArr.push(ipfsHash);
			}
			newArr.push(tmpArr);
		}
		return newArr;
	}
	
	submitCoid(e){
		e.preventDefault();
		var json = this.prepareJsonToSubmit();
		$.ajax({
			url: 'http://localhost:5050/gk/gatekeeper'
			type: 'POST',
			data: json,
			success: function(res){
				// do something
			},
			complete: function(){
				// do something
			}
		});
	}

	handleHideModal(){
		this.setState({showModal: false});
	}

	handleShowModal(e){
        this.setState({showModal: true, tmpFile: $(e.target).attr('data-id')});
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
						{this.state.inputs.map(input => <UniqIdForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
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
						<label htmlFor="signature">Signature</label>
						<input className="form-control" id="signature" type="text" name="signature" onChange={ (e)=>{ this.onFieldChange("signature", e) } }/>
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
						<label htmlFor="message">Message</label>
						<input className="form-control" id="message" type="text" name="message" onChange={ (e)=>{ this.onFieldChange("message", e) } }/>
					</div>
					<div className="form-group">
					  <div className="col-sm-6">
					  <br/>
						<input type="hidden" name="pubkey" value={this.state.pubKey} />
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