import React, {Component} from 'react';

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
		
		$("#DimensionContainer .modal").modal('show');
        $("#DimensionContainer .modal").on('hidden.bs.modal', this.props.handleHideModal);
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

class UniqueIDAttributesForm extends React.Component {

	constructor(props){
		super(props);
		this.state = {
		file_attrs:[],
		inputs: ['input-0'],
		tmpFile:'',
		showModal1: false,
		pubKey: localStorage.getItem("pubKey")
		};
	
	}
	
	handleShowModal(e){
		this.setState({showModal1: true, tmpFile: $(e.target).attr('data-id')});
    }
	
	handleHideModal(){
		this.setState({showModal1: false});
	}
	
	render(){
		console.log("UniqueAttrFORM  props*** " + JSON.stringify(this.props))
		console.log("UniqueAttrFORM  state*** " + JSON.stringify(this.state))
		return(
			<div className="form-group col-md-12">
				<div className="col-md-10">
				<label htmlFor="unique_id_attrs"> Official IDs e.g. SSN, Passport, Driver's License, Digital retinal scans and/or digital fingerprints </label>
					<input name={'label-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Label"  />
				</div>
				<div className="col-md-2">
					<button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right">
						<span className="glyphicon glyphicon-upload"></span>Upload File
					</button>
				</div>	
			</div>	
		);
	}

};



class TokenDistributionForm extends React.Component {
    
    constructor(props){
        super(props)
        this.state = {
            controltoken_quantity: [],
            controltoken_list: [],
            
            showModal1: false
        };
        this.maxUniqAttr = 10;
        //this.onFieldChange = this.onFieldChange.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
    }
    handleShowModal(e){
        this.setState({showModal1: true, tmpFile: $(e.target).attr('data-id')});
    }
    
    handleHideModal(){
        this.setState({showModal1: false});
    }
    render(){
        console.log("TOKEN FORM STATE: " + JSON.stringify(this.state))
        console.log("TOKENFORM props: " + JSON.stringify(this.props))
        var style = {
            fontSize: '12.5px'
        }
        return(

                <table className="table table-striped table-hover" style={style}>
                        <tbody>
                        <tr>
                        <th><b>Public Key of Controller</b></th>
						<th><b>Control Token Quantity</b></th>
                        </tr>
                        <tr>
                        <td><input name={'label-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Controller"  /></td>
                        <td><input name={'label-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity"  /></td>
                        </tr>
                        </tbody>
                </table>  
        );
    }
};


class Modal extends React.Component {
    
    constructor(props){
		super(props);
		this.state = {
            
			file_attrs:[],
			inputs: ['input-0'], //unqiueID Attrs
            inputs_tokens: ['input-0'],

			official_id:[],		//first official ID is name (see identity spec v1.3)
			owner_id:[],
			control_id:[],

			owner_token_id:[],
			owner_token_desc:[],
			owner_token_quantity:[],
			control_token_id:[],
			control_token_desc:[],
			control_token_quantity:[],
            
			showModal1: false,
			tmpFile:'',
			pubKey: localStorage.getItem("pubKey"),
			privKey: localStorage.getItem("privKey"),
			signature:''
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
    
    handleHideModal(){
		this.setState({showModal1: false});
	}

	handleShowModal(e){
        this.setState({showModal1: true, tmpFile: $(e.target).attr('data-id')});
    }
	
	getFileDetails(filedata){
		var obj = {[this.state.tmpFile]:filedata};
		this.setState({file_attrs: this.state.file_attrs.concat([obj])});
	}
    
    appendInput() {
		var inputLen = this.state.inputs.length;
		if(inputLen < this.maxUniqAttr){
			var newInput = `input-${inputLen}`;
        	this.setState({ inputs: this.state.inputs.concat([newInput]) });
		}
    }
    
    	//used in tokendistrubtionform
	appendInput2() {
		var inputLen = this.state.inputs_tokens.length;
		if(inputLen < this.maxUniqAttr){
			var newInput1 = `input-${inputLen}`;
        	this.setState({ inputs_tokens: this.state.inputs_tokens.concat([newInput1]) });
		}
	}
    
    submitDimension(e){
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
		
		console.log(json)
		$.ajax({
			url: twinUrl + 'requestCOID',
			type: 'POST',
			data: json,
			success: function(res){
                console.log(JSON.stringify(json))
                var sendMe = {};
                sendMe.flag = 0; //owned core identity
                sendMe.fileName = "MyCOID.json" //
                sendMe.updateFlag = 0; //new identity
                sendMe.data = json;
                sendMe.pubKey = localStorage.getItem("pubKey");
                
				$.ajax({
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
    
    render(){
        var inputAttrs = {
            addKeys: [13,188],
            inputProps: {
                placeholder: "use comma(,) to seperate values",
                style:{width:'30%'}
            }
        };
        var syle = {
            marginRight:'15px'
        }
        
        return(
            <div id="DimensionContainer">
				<h5>You have not yet created any identity dimensions for this asset.</h5><br />
                <h3>Create Identity Dimension</h3>
                <form method="POST" id="create" role="form">
                    
                    <div className="form-group">
                        <label htmlFor="unique_id">Enter Unique ID Attributes. Make sure to add the supporting file(s) through "Upload File".</label>
                        {this.state.inputs.map(input => <UniqueIDAttributesForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                    </div>
                    <div className="form-group">
                        <div className="col-md-offset-6 col-md-6 ">
                            <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInput.bind(this)}>
                                <span className="glyphicon glyphicon-plus"></span>Add More
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="control_dist">Enter Controllers and their control token(s).</label>
                        {this.state.inputs_tokens.map(input => <TokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}

					</div>

                            <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInput2.bind(this)}>
                                <span className="glyphicon glyphicon-plus"></span>Add More
                            </button>
							
                            <input className="form-control" ref="signature" type="hidden" value={10} />
                            <input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
                            <button className="btn btn-primary" data-loading-text="Submit Dimension" name="submit-form" type="button" onClick={this.submitDimension.bind(this)}>Submit Dimension</button>

                
                </form>
                {this.state.showModal1 ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal}/> : null}
                
            </div>
            
        );         
    }
    
}


export default Modal;
