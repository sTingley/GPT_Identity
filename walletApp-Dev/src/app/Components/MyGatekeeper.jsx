import React from 'react';
import TagsInput from 'react-tagsinput';
import { keccak_256 } from 'js-sha3';
var crypto = require('crypto');
var secp256k1 = require('secp256k1');

//TODO : Namespace validation
//TODO:
//CONTROLLERS need to be able to upload documents---LATER

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

//form where we can add additional uniqueIDAttrs
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
				<label htmlFor="unique_id_attrs"> Unique Identfiers e.g. Serial Numbers, MAC Addresses, Vehicle Identitfication Numbers</label>
					<input name={'label-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Label"  />
				</div>
				<div className="col-md-2">
					<button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
				</div>	
			</div>	
		);
	}

};

class ControlTokenDistributionForm extends React.Component {
    
    constructor(props){
        super(props)
        this.state = {
            controltoken_quantity: [],
            controltoken_list: [],
            showModal: false
        };
		
        this.maxUniqAttr = 10;
        //this.onFieldChange = this.onFieldChange.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
    }
    handleShowModal(e){
        this.setState({showModal: true, tmpFile: $(e.target).attr('data-id')});
    }
    
    handleHideModal(){
        this.setState({showModal: false});
    }
    render(){
        var style = {
            fontSize: '12.5px'
        }
        return(
            <div className="form-group col-md-12">
                <div className="col-md-10">
                <table className="table table-striped table-hover" style={style}>
                        <tbody>
                        <tr>
                        <th><b>Public Key of Controller</b></th>
						<th><b>Control Token Quantity</b></th>
                        </tr>
                        <tr>
                        <td><input name={'label1-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Controller"  /></td>
                        <td><input name={'label1-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity"  /></td>
                        </tr>
                        </tbody>
                </table> 
                </div>
            </div>    
        );
    }
};

class OwnerTokenDistributionForm extends React.Component {
    
    constructor(props){
        super(props)
        this.state = {
            ownertoken_quantity: [],
            ownertoken_list: [],
            showModal: false
        };
		
        this.maxUniqAttr = 10;
        //this.onFieldChange = this.onFieldChange.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
    }
    handleShowModal(e){
        this.setState({showModal: true, tmpFile: $(e.target).attr('data-id')});
    }
    
    handleHideModal(){
        this.setState({showModal: false});
    }
    render(){
        var style = {
            fontSize: '12.5px'
        }
        return(
            <div className="form-group col-md-12">
                <div className="col-md-10">
                <table className="table table-striped table-hover" style={style}>
                        <tbody>
                        <tr>
                        <th><b>Public Key of Owner</b></th>
						<th><b>Ownership Token Quantity</b></th>
                        </tr>
                        <tr>
                        <td><input name={'label2-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Owner"  /></td>
                        <td><input name={'label2-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Ownership Token Quantity"  /></td>
                        </tr>
                        </tbody>
                </table>
                </div>
            </div>    
        );
    }
};

class MyGatekeeper extends React.Component {
	
	constructor(props){
		super(props);
		this.state = {
			file_attrs:[],
			inputs: ['input-0'], //removed input-1
			inputs_control:['input1-0'],
			inputs_ownership:['input1-0'],
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
			pubKey: localStorage.getItem("pubKey"),
			privKey: localStorage.getItem("privKey"),
			//gatekeeperAddr: localStorage.getItem("MyGatekeeperAddr"),
			validators:[],
			signature:'',
			assetID: [],
			dimensions: ''
			
		};
		
		this.maxUniqAttr = 10;
		this.onFieldChange = this.onFieldChange.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
	}
	
	componentDidMount() {
        //TODO********** add fileName.json********put in localstorage!

		let publicKey = localStorage.getItem("pubKey");

		$.ajax({
			type: "POST",
			url: twinUrl + 'getAsset',
			data: { "pubKey": publicKey, "flag": 0, "fileName": "MyCOID.json"},
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					data = JSON.parseJSON(result)
				}

				//var gatekeeperAddr = "gatekeeperAddr_" + publicKey 
				//console.log("gkaddr:  " + gatekeeperAddr)
				localStorage.setItem("gatekeeperAddr", result.gatekeeperAddr)
				localStorage.setItem("coidAddr", result.coidAddr)
				localStorage.setItem("dimensionCtrlAddr", result.dimensionCtrlAddr)

			}.bind(this),
			complete: function () {
				
			},
			//console.log(result)	
		})

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
			var hash = keccak_256(input)
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
	
	//used in token form class for control token distribution list.. is called by appendInputControllers()
	getLabelValuesController(){
        var labelVals1 = []
		$.each($("input[name^='label1-']"), function(obj){
			var value = $.trim($(this).val());
			if(value.length > 0){
				labelVals1.push({
					//replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
					[$(this).attr('name').replace("label1-","")] : value
				});
			}
			console.log("obj: " + JSON.stringify(obj))
		});
        return labelVals1;
    }
	
	//used in token form class for control token distribution list.. is called by appendInputOwners()
	getLabelValuesOwner(){
        var labelVals2 = []
		$.each($("input[name^='label2-']"), function(obj){
			var value = $.trim($(this).val());
			if(value.length > 0){
				labelVals2.push({
					//replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
					[$(this).attr('name').replace("label2-","")] : value
				});
			}
			console.log("obj: " + JSON.stringify(obj))
		});
        return labelVals2;
    }
    

	
	prepareJsonToSubmit(){
		console.log();
		this.prepareControlTokenDistribution();
		this.prepareOwnershipTokenDistrbution();
		this.prepareValidators(this.state.validators)
		var inputObj = {
				"pubKey": this.refs.pubKey.value,
				//"sig": this.refs.signature.value,	
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
				"ownershipTokenAttributes": this.state.owner_token_desc,					
				"ownershipTokenQuantity": this.state.owner_token_quantity,
				
				//calculated. should be one time hashing of controlTokenAttributes and control token quantity
				"controlTokenId": this.getHash(this.joinValuesControl()),
				"controlTokenAttributes": this.state.control_token_desc,
				"controlTokenQuantity": this.state.control_token_quantity,
				
				//pubkeys used for recovery in the event COID is lost or stolen			
				"identityRecoveryIdList": this.valueIntoHash(this.state.recovery_id),
				"recoveryCondition": this.state.recoveryCondition,
				
				"yesVotesRequiredToPass": 2,	//needs to be taken out and hardcoded in app
				"validatorList":  this.state.validators,
				
				"isHuman": false,
				"timestamp": "",
				"assetID": this.state.assetID,
				"Type": "non_cash",
				"bigchainHash":  "",
				"bigchainID": "",
				"coidAddr": "",

		};
		return inputObj;
	}
	
	joinValuesOwnership(){
		var value1 = this.state.owner_token_desc;
		var value2 = this.state.owner_token_quantity;
        var tempArr = [];
		tempArr.push(value1);
		tempArr.push(value2);
		tempArr = tempArr.join();
        return tempArr;
		}
		
	joinValuesControl(){
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
	
	prepareControlTokenDistribution(){
		var labels = this.getLabelValuesController();
		for(var i=0; i<labels.length; i+=2){	
			for(var key in labels[i]){
				this.state.control_id.push(labels[i][key]);
				this.state.control_token_quantity.push(labels[i+1][key]);
			}	
		}
	}
	
	prepareOwnershipTokenDistrbution(){
		var labels = this.getLabelValuesOwner();
		for(var i=0; i<labels.length; i+=2){
			for(var key in labels[i]){
				this.state.owner_id.push(labels[i][key]);
				this.state.owner_token_quantity.push(labels[i+1][key]);
			}
		}
		console.log("owner_ID: " + JSON.stringify(this.state.owner_id))
		console.log("owner_token_quantity: " + JSON.stringify(this.state.owner_token_quantity))
	}
	
	prepareValidators(value) {
		var tempArr = value;
		for(var i=0; i<tempArr.length; i++){
			tempArr[i] = this.getHash(tempArr[i]);
		}
		return tempArr;
		
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
		var privKey1 = new Buffer(this.state.privKey,"hex");
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash,"hex");
		var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
		
		signature1 = JSON.parse(signature1).signature;
		 signature1 = JSON.stringify(signature1);
		 signature1 = JSON.parse(signature1).data;
		 signature1 = new Buffer(signature1,"hex");
		 signature1 = signature1.toString("hex");
		
		console.log("sig" + signature1)
		console.log(typeof(signature1))
		
		json.sig = signature1;
		json.msg = msg_hash_buffer.toString("hex");
		json.gatekeeperAddr = localStorage.getItem("gatekeeperAddr")
		//this.setState({signature: signature1})
		
		console.log(json)
		$.ajax({
			url: twinUrl + 'request_new_COID',
			type: 'POST',
			data: json,
			success: function(res){
                var sendMe = {};
                sendMe.flag = 0; //owned asset
                sendMe.fileName = json.assetID[0] + ".json"; 
                sendMe.pubKey = localStorage.getItem("pubKey");
                sendMe.data = json;
                sendMe.updateFlag = 0;
				$.ajax({
                    //****************TODO
					url: twinUrl + 'setAsset',
					type: 'POST',
					data: sendMe,
                    success: function(res)
                    {
                        console.log("response from setAsset: " + res)
                    }
				})
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
	
	//used in uniqueIdAttributesForm
	appendInput() {
		var inputLen = this.state.inputs.length;
		if(inputLen < this.maxUniqAttr){
			var newInput = `input-${inputLen}`;
        	this.setState({ inputs: this.state.inputs.concat([newInput]) });
			
		}
    }
	
	appendInputControllers() {
		var inputLen = this.state.inputs_control.length;
		if(inputLen < this.maxUniqAttr){
			var newInput1 = `input1-${inputLen}`;
        	this.setState({ inputs_control: this.state.inputs_control.concat([newInput1]) });
		}
	}
	
	appendInputOwners(){
		var inputLen = this.state.inputs_ownership.length;
		console.log("ownerlsit length: " + inputLen)
		if(inputLen < this.maxUniqAttr){
			var newInput2 = `input1-${inputLen}`;
			this.setState({ inputs_ownership: this.state.inputs_ownership.concat([newInput2]) });
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
	    		<h1>Non Human Identity Submission Form</h1>
	    		<form method="POST" id="register" role="form">
					<div className="form-group">
						<label htmlFor="unique_id">Enter Unique ID Attributes</label>
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
						<label htmlFor="assetID">Name Your Asset. For example, 'My Diploma'.</label>
						<TagsInput {...inputAttrs} value={this.state.assetID} onChange={(e)=>{ this.onFieldChange("assetID", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="owner_token_id">Enter Ownership Token Description. For example, 'Spencer tokens'.</label>
						<TagsInput {...inputAttrs} value={this.state.owner_token_desc} onChange={(e)=>{ this.onFieldChange("owner_token_desc", e) } } />
					</div>				
					<div className="form-group">
						<label htmlFor="owner_dist">Enter Owners and their ownership token(s).</label>
						{this.state.inputs_ownership.map(input => <OwnerTokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
					</div>
					<div className="form-group"> 
						<div className="col-md-offset-6 col-md-6 "> 
							<p></p>
							<button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInputOwners.bind(this)}>
								<span className="glyphicon glyphicon-plus"></span>Add More
							</button>
						</div>
					</div>
					<div className="form-group">
						<label htmlFor="control_token_id">Enter Control Token Description. For example, 'Spencer tokens'.</label>
						<TagsInput {...inputAttrs} value={this.state.control_token_desc} onChange={(e)=>{ this.onFieldChange("control_token_desc", e) } } />
					</div>
					<div className="form-group">
						<label htmlFor="control_dist">Enter Controllers and their control token(s).</label>
						{this.state.inputs_control.map(input => <ControlTokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
					</div>
					<div className="form-group"> 
						<div className="col-md-offset-6 col-md-6 "> 
							<p></p>
							<button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInputControllers.bind(this)}>
								<span className="glyphicon glyphicon-plus"></span>Add More
							</button>
						</div>
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
						<label htmlFor="validators">Validators (public keys of the accounts which will verify this identity/asset)</label>
						<TagsInput {...inputAttrs} value={this.state.validators} onChange={(e)=>{ this.onFieldChange("validators", e) } } />
					</div>
					<div className="form-group">
					  <div className="col-sm-6">
					  <br/>
						<input className="form-control" ref="signature" type="hidden" value={this.state.signature} />
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
export default MyGatekeeper;
