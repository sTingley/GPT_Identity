import React from 'react';
import TagsInput from 'react-tagsinput';
import { sha3_256 } from 'js-sha3';

//TODO : Namespace validation 

class UploadIpfsFile extends React.Component {

	constructor(props){
		super(props);
		this.state = {
			docs: {},
			pubKey: props.pubKey,
			selected:'0',
			files:''
		};
		this.inputChangeHandler = this.inputChangeHandler.bind(this);
	}

	componentDidMount(){
		$.ajax({
			url: twinUrl + "ipfs/alldocs/"+this.state.pubKey,
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
			url: twinUrl + "ipfs/upload",
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
							//data handler forms JSON object
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


//form where we can add addtional labels (uniqueIDAttrs)
class UniqueIDAttributesForm extends React.Component {

	constructor(props){
		super(props);
		
		this.state = {
		file_attrs:[],
		inputs: ['input-0'],
		tmpFile:'',
		showModal: false,
		pubKey: localStorage.getItem("pubKey")
		};
	
	}
	
	handleShowModal(e){
		this.setState({showModal: true, tmpFile: $(e.target).attr('data-id')});
    }
	
	handleHideModal(){
		this.setState({showModal: false});
	}
	
	render(){
		
		return(
			<div className="form-group col-md-12">
				<div className="col-md-10">
				<label htmlFor="unique_id_attrs"> Official IDs e.g. SSN, Passport, Driver's License, Digital retinal scans and/or digital fingerprints </label>
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
			file_attrs:[],
			inputs: ['input-0'], //removed input-1
			inputs_name:['input-0'],
			official_id:[],		//first official ID is name (see identity spec v1.3)
			owner_id:[],
			control_id:[],
			recovery_id:[],
			recoveryCondition:[],
			isHuman:[],
			owner_token_id:[],
			owner_token_desc:[],
			owner_token_quantity:[],
			control_token_id:[],
			control_token_desc:[],
			control_token_quantity:[],
			showModal: false,
			tmpFile:'',
			pubKey: localStorage.getItem("pubKey")
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
					//replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
					[$(this).attr('name').replace("label-","")] : value
				});
			}
		});
		return labelVals;
	}
	
	//TODO:
	//0)Check that controllers pubkeys are valid
	//1)NEED TO DISTINGUISH COID for person or thing---DONE
	//2)CONTROLLERS need to be able to upload documents---LATER
	
	prepareJsonToSubmit(){
		console.log();
		var inputObj = {
				"pubKey": this.refs.pubKey.value,
				"sig": this.refs.signature.value,
				
				//"msg": this.refs.message.value,
				//"name": this.refs.nameReg.value,		no longer standalone part of JSON object (it is part of unique attributes)

				"uniqueId": this.createHashAttribute(this.state.file_attrs),
				"uniqueIdAttributes": this.prepareUniqueIdAttrs(),
				
				"ownershipId": this.createHashAttribute(this.state.owner_id),	//calculated from ownerIDlist
				"ownerIdList":this.valueIntoHash(this.state.owner_id),
				"controlId": this.createHashAttribute(this.state.control_id),
				"controlIdList": this.valueIntoHash(this.state.control_id),
				
				//calculated. should be one time hashing of ownershipTokenAttributes and ownership token quantity
				"ownershipTokenId": this.getHash(this.joinValuesOwnership()),	
				//attributes should not be hashed, they should be readable.
				"ownershipTokenAttributes":this.state.owner_token_desc,					
				"ownershipTokenQuantity": this.state.owner_token_quantity,
				
				//calculated. should be one time hashing of controlTokenAttributes and control token quantity
				"controlTokenId": this.getHash(this.joinValuesControl()),
				"controlTokenAttributes": this.state.control_token_desc,
				"controlTokenQuantity": this.state.control_token_quantity,
				
				//pubkeys used for recovery in the event COID is lost or stolen			
				"identityRecoveryIdList": this.valueIntoHash(this.state.recovery_id),
				"recoveryCondition": this.state.recoveryCondition,
				"yesVotesRequiredToPass": 2,	//needs to be taken out and hardcoded in app
				
				"isHuman": true	

		};
		return inputObj;
	}
	
		joinValuesOwnership()
		{
		var value1 = this.state.owner_token_desc;
		var value2 = this.state.owner_token_quantity;
        var tempArr = [];
		tempArr.push(value1);
		tempArr.push(value2);
		tempArr = tempArr.join();
        return tempArr;
		}
		
		joinValuesControl()
		{
		var value1 = this.state.control_token_desc;
		var value2 = this.state.control_token_quantity;
        var tempArr = [];
		tempArr.push(value1);
		tempArr.push(value2);
		tempArr = tempArr.join();
        return tempArr;
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
				
				//if only one value in 'values'
			} else {
				var valStr = values.join("|");
				return this.getHash(valStr);
			}
			
		}
		return '';
	}
	
	//hashes arrays (no delimiter)
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
			labels = this.getLabelValues();	//look at this
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
	
	//hashing the pubkeys
	prepareTokenDistribution(value){
		var tempArr = value;
		for(var i=0; i<tempArr.length; i+=2){
			tempArr[i] = this.getHash(tempArr[i]);
		}
		return tempArr;
	}
	
	
	
	submitCoid(e){
		e.preventDefault();
		var json = this.prepareJsonToSubmit();
		console.log(json)
		$.ajax({
			url: twinUrl + 'requestCOID',
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
	    		<h1>Core Identity Submission Form</h1>
	    		<form method="POST" id="register" role="form">
					<div className="form-group">
						<label htmlFor="unique_id">Enter Unique ID Attributes. The first Attribute has to be name (first, last). Then add any official identification such as SSN or national ID number(s). Make sure to add the supporting file(s) through "Upload File".</label>
						{this.state.inputs.map(input => <UniqueIDAttributesForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
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
						<label htmlFor="owner_id">Enter Owner IDs. Owner IDs are the public keys of the identity owners. Only one owner for an individual (self).</label>
						<TagsInput {...inputAttrs} value={this.state.owner_id} onChange={(e)=>{ this.onFieldChange("owner_id", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="control_id">Control ID</label>
						<TagsInput {...inputAttrs} value={this.state.control_id} onChange={(e)=>{ this.onFieldChange("control_id", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="recovery_id">Recovery IDs (public keys of individuals who will attest to lost/stolen identity)</label>
						<TagsInput {...inputAttrs} value={this.state.recovery_id} onChange={(e)=>{ this.onFieldChange("recovery_id", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="recovery_id">Recovery Condition (# of digital signatures of recovery ID owners needed to recover identity)</label>
						<TagsInput {...inputAttrs} value={this.state.recoveryCondition} onChange={(e)=>{ this.onFieldChange("recoveryCondition", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="owner_token_id">Enter Ownership Token Description. For example, 'Spencer tokens'.</label>
						<TagsInput {...inputAttrs} value={this.state.owner_token_desc} onChange={(e)=>{ this.onFieldChange("owner_token_desc", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="owner_token_id">Enter Ownership Token Quantity. For example, 1 token for an individual.</label>
						<TagsInput {...inputAttrs} value={this.state.owner_token_quantity} onChange={(e)=>{ this.onFieldChange("owner_token_quantity", e) } } />
					</div>

					<div className="form-group">
						<label htmlFor="control_token_id">Control Token ID. Description. For example, 'Spencer tokens'.</label>
						<TagsInput {...inputAttrs} value={this.state.control_token_desc} onChange={(e)=>{ this.onFieldChange("control_token_desc", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="control_token_id">Enter Control Token Quantity. For example, 1 token for an individual.</label>
						<TagsInput {...inputAttrs} value={this.state.control_token_quantity} onChange={(e)=>{ this.onFieldChange("control_token_quantity", e) } } />
					</div>
					<div className="form-group">
					  <div className="col-sm-6">
					  <br/>
						<input className="form-control" ref="signature" type="hidden" value="7051442bbf18bb2c86cbc8951a07e27ec6ba05ac3fa427e4c6b948e3dcf91a94046b048edf52445fb22cc776a94b87c3f55426f993458ec744f61f09fb46eeaa" />
						<input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
						<button className="btn btn-primary" data-loading-text="Submit Identity" name="submit-form" type="button" onClick={this.submitCoid.bind(this)}>Submit Identity</button>
					  </div>
					</div>
				</form>
				{this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal}/> : null}
        </div>
    );
   }
}
export default CoreIdentity;
