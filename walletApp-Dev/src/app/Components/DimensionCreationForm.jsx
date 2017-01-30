import React, { Component } from 'react';
import { keccak_256 } from 'js-sha3';

class UploadIpfsFile extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			docs: {},
			pubKey: props.pubKey,
			selected: '0',
			files: ''
		};
		this.inputChangeHandler = this.inputChangeHandler.bind(this);
	}

	componentDidMount() {
		$.ajax({
			url: twinUrl + "ipfs/alldocs/" + this.state.pubKey,
			dataType: 'json',
			cache: false,
			success: function (resp) {
				this.setState({ docs: resp.data.documents });
			}.bind(this),
			error: function (xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});

		$("#DimensionContainer .modal").modal('show');
		$("#DimensionContainer .modal").on('hidden.bs.modal', this.props.handleHideModal);
	}

	uploadHandler(data, additionalParams) {
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

	fileHandler(e) {
		e.preventDefault();
		if (this.state.selected != "0") {
			var hash, fileHash;
			this.props.dataHandler(this.state.selected);
			$("button.close").trigger("click");
		} else {
			if (this.state.files.size > 0) {
				var fileInput = $("input[name=newdoc]");
				var fData = new FormData();
				fData.append("user_pubkey", this.state.pubKey);
				$.each(fileInput[0].files, function (key, value) {
					fData.append(key, value);
				});
				var _this = this;
				var callbacks = {
					beforeSend: (xhr) => {
						$("button[name=uploadsubmit]").button('loading');
						$("button.close").hide();
					},
					success: function (resp) {
						if (resp.uploded && resp.uploded.length > 0) {
							var filedata = resp.uploded[0].hash + "|" + resp.uploded[0].file_hash;
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
				this.uploadHandler(fData, callbacks);
			}
		}
	}

	inputChangeHandler(e) {
		if (e.target.tagName == "SELECT") {
			this.setState({ selected: e.target.value });
		} else
			this.setState({ files: e.target.files[0] });
	}

	render() {
		var center = {
			textAlign: 'center'
		};
		return (
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
										{(() => {
											if (this.state.docs && this.state.docs.length > 0) {
												var i = 0;
												return this.state.docs.map((obj) => {
													i++;
													var optsVal = obj.hash + "|" + obj.file_hash;
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
									<input type="file" className="form-control" name="newdoc" onChange={this.inputChangeHandler} />
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

	constructor(props) {
		super(props);
		this.state = {

			//getFileDetails method in Modal passes this as prop
			file_attrs: [],
			inputs: ['input-0'],
			tmpFile: '',
			showModal1: false,
			pubKey: localStorage.getItem("pubKey")
		};

	}

	handleShowModal(e) {
		this.setState({ showModal1: true, tmpFile: $(e.target).attr('data-id') });
		console.log("inside UniqueIDAttr form handleShowModal.. 'data-id' is: " + $(e.target).attr('data-id'))
	}

	handleHideModal() {
		this.setState({ showModal1: false });
	}

	render() {
		//console.log("UniqueAttrFORM  props*** " + JSON.stringify(this.props))
		//console.log("UniqueAttrFORM  state*** " + JSON.stringify(this.state))
		return (
			<div className="form-group col-md-12">
				<div className="col-md-10">
					<label htmlFor="unique_id_attrs"> Official IDs e.g. SSN, Passport, Driver's License </label>
					<input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Label" />
				</div>
				<div className="col-md-2">
					<button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right btn-sm">
						<span className="glyphicon glyphicon-upload"></span>Upload File
					</button>
				</div>
			</div>
		);
	}

};


//USED TO ADD CONTROLLERS TO A DIMENSION
class ControllerDistributionForm extends React.Component {

	constructor(props) {
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
	handleShowModal(e) {
		this.setState({ showModal1: true, tmpFile: $(e.target).attr('data-id') });
	}

	handleHideModal() {
		this.setState({ showModal1: false });
	}
	render() {
		//console.log("TOKEN FORM STATE: " + JSON.stringify(this.state))
		//console.log("TOKENFORM props: " + JSON.stringify(this.props))
		var style = {
			fontSize: '12.5px'
		}
		return (

			<table className="table table-striped table-hover" style={style}>
				<tbody>
					<tr>
						<th><b>Public Key of Controller</b></th>
						<th><b>Control Token Quantity</b></th>
					</tr>
					<tr>
						<td><input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Controller" /></td>
						<td><input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity" /></td>
					</tr>
				</tbody>
			</table>
		);
	}
};


class Modal extends React.Component {

	constructor(props) {
		super(props);

		this.state = {

			//UniqueIDAttributesForm inputs are mapped to this array
			uniqueAttr_inputs: ['input-0'],

			//handleShowModal is fired when the Upload File button is clicked in the UniqueIDAttributesForm
			showModal1: false,
			tmpFile: '',

			//is updated in getFileDetails method which 
			//if showModal1 is true, which will mean UploadIpfsFile component is being shown
			//when we render UploadIpfsFile, dataHandler gets passed as a prop to the Upload child component which binds the getFileDetails method:
			// dataHandler={this.getFileDetails.bind(this)}
			//getFileDetails method places the new object in file_attrs
			file_attrs: [],

			//ControllerDistributionForm inputs are mapped to this array
			controllerForm_inputs: ['input-0'],

			//Every time a new controller is added,
			control_id: [], /* AND */ control_token_quantity: [],
			//are both updated accordingly.

			//owner list
			//KEEP THIS??????????
			owner_id: [],

			pubKey: localStorage.getItem("pubKey"),
			privKey: localStorage.getItem("privKey"),
			signature: ''

		};

		this.maxUniqAttr = 10;
		this.onFieldChange = this.onFieldChange.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
	}


	onFieldChange(inputField, e) {
		var multipleValues = {};
		if (inputField == "name" || inputField == "signature" || inputField == "message") {
			this.setState({ [inputField]: e.target.value });
		} else {
			multipleValues[inputField] = e;
			this.setState(multipleValues);
		}
	}

	//In ComponentDidMount method of UploadIpfsFile
	//$("#DimensionContainer .modal").on('hidden.bs.modal', this.props.handleHideModal);
	//This method is used to pass showModal state value to all child components as a prop
	handleHideModal() {
		this.setState({ showModal1: false });
	}

	handleShowModal(e) {
		this.setState({ showModal1: true, tmpFile: $(e.target).attr('data-id') });
	}

	//used in UniqueIDAttributesForm
	getFileDetails(filedata) {
		console.log("input to getFileDetails: " + filedata)
		var obj = { [this.state.tmpFile]: filedata };
		this.setState({ file_attrs: this.state.file_attrs.concat([obj]) });
		console.log("file_attrs: " + JSON.stringify(this.state.file_attrs))
	}

	appendInput() {
		var inputLen = this.state.uniqueAttr_inputs.length;
		if (inputLen < this.maxUniqAttr) {
			var newInput = `input-${inputLen}`;
			this.setState({ uniqueAttr_inputs: this.state.uniqueAttr_inputs.concat([newInput]) });
		}
	}

	//used in tokendistrubtionform
	appendController() {
		var inputLen = this.state.controllerForm_inputs.length;
		if (inputLen < this.maxUniqAttr) {
			var newInput1 = `input-${inputLen}`;
			this.setState({ controllerForm_inputs: this.state.controllerForm_inputs.concat([newInput1]) });
		}
		console.log("just appended controller input")
		console.log("controllerForm_inputs: " + this.state.controllerForm_inputs)
	}

	//used in token form class for control token distribution list.. is called by appendController()
	getControllerLabels() {
		var labelVals1 = []
		$.each($("input[name^='label1-']"), function (obj) {
			var value = $.trim($(this).val());
			if (value.length > 0) {
				labelVals1.push({
					//replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
					[$(this).attr('name').replace("label1-", "")]: value
				});
			}
			console.log("obj: " + JSON.stringify(obj))
		});
		return labelVals1;
	}
	
	prepareControlTokenDistribution() {
		var labels = this.getControllerLabels();
		for (var i = 0; i < labels.length; i += 2) {
			for (var key in labels[i]) {
				this.state.control_id.push(labels[i][key]);
				this.state.control_token_quantity.push(labels[i + 1][key]);
			}
		}
	}

	//HELPER FUNCTION: HASHES INPUTS
	getHash(input) {
		var input = $.trim(input);
		if (input) {
			var hash = keccak_256(input)
			return hash;
		}
		return input;
	}

	//Hashes arrays (no delimiter)
	valueIntoHash(values) {
		var newArr = [];
		var _this = this;
		if ($.isArray(values)) {
			values.map((value) => {
				newArr.push(_this.getHash(value));
			});
		};
		return newArr;
	}

	//create hash attribute
	createHashAttribute(values) {
		if ($.isArray(values) && values.length > 0) {
			if ($.isPlainObject(values[0])) {
				var str = "";
				for (var i = 0; i < values.length; i++) {
					for (var key in values[i]) {
						var hash, filehash;
						[hash, filehash] = values[i][key].split("|");
						if ((values.length - 1) == i)
							str += hash;
						else
							str += hash + "|";
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


	submitDimension(e) {

		e.preventDefault();
		prepareControlTokenDistribution();

		//var json = {

		//"txnDesc": "sampleDesc",
		//"signature": signature1,
		// "msg": msg_hash_buffer.toString("hex"),
		//"publicKey": localStorage.getItem("pubKey"),
		//"proposalID": this.state.proposal.proposal_id,
		//"vote": parseInt(ele.attr("data-val"))

		//};

		var json = {
			"controlIdList": this.valueIntoHash(this.state.control_id)
		}


		var privKey1 = new Buffer(this.state.privKey, "hex");
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash, "hex");
		var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))

		signature1 = JSON.parse(signature1).signature;
		signature1 = JSON.stringify(signature1);
		signature1 = JSON.parse(signature1).data;
		signature1 = new Buffer(signature1, "hex");
		signature1 = signature1.toString("hex");

		console.log("sig" + signature1)
		console.log(typeof (signature1))

		json.sig = signature1;
		json.msg = msg_hash_buffer.toString("hex");

		console.log(json)
		$.ajax({
			url: twinUrl + 'createDimension',
			type: 'POST',
			data: json,
			success: function (res) {
				console.log(JSON.stringify(json))
				var sendMe = {};
				sendMe.flag = 0; //owned core identity
				sendMe.fileName = "MyCOID.json" //
				sendMe.updateFlag = 0; //new identity
				sendMe.data = json;
				sendMe.pubKey = localStorage.getItem("pubKey");

				$.ajax({
					url: twinUrl + 'createDimensionFile',
					type: 'POST',
					data: sendMe,
					success: function (res) {
						console.log("response from setAsset: " + res)
					}
				})
			},
			complete: function () {
				// do something
			}
		});
	}

	render() {
		var inputAttrs = {
			addKeys: [13, 188],
			inputProps: {
				placeholder: "use comma(,) to seperate values",
				style: { width: '30%' }
			}
		};
		var syle = {
			marginRight: '15px'
		}

		return (
			<div id="DimensionContainer">
				<h5>You have not yet created any identity dimensions for this asset.</h5><br />
				<h3>Create Identity Dimension</h3>
				<form method="POST" id="create" role="form">

					<div className="form-group">
						<label htmlFor="unique_id">Enter Unique ID Attributes. Make sure to add the supporting file(s) through "Upload File".</label>
						{this.state.uniqueAttr_inputs.map(input => <UniqueIDAttributesForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
					</div>
					<button type="button" className="btn btn-info pull-left btn-sm" style={syle} onClick={this.appendInput.bind(this)}>
						<span className="glyphicon glyphicon-plus"></span>Add More
						</button>

					<div className="form-group">
						<br /><label htmlFor="control_dist">Enter Controllers and their control token(s).</label>
						{this.state.controllerForm_inputs.map(input => <ControllerDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
					</div>

					<button type="button" className="btn btn-info pull-left btn-sm" style={syle} onClick={this.appendController.bind(this)}>
						<span className="glyphicon glyphicon-plus"></span>Add More
                            </button>
					<div>
						<input className="form-control" ref="signature" type="hidden" value={10} />
						<input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
						<br /><br />
						<button className="btn btn-primary pull-right" data-loading-text="Submit Dimension" name="submit-form" type="button" onClick={this.submitDimension.bind(this)}>Submit Dimension</button>
					</div>

				</form>
				{this.state.showModal1 ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}

			</div>

		);
	}

}


export default Modal;
