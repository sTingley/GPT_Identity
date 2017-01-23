import React, { Component } from 'react';


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



class DimensionForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inputs: ['input-0'],
            dimension: this.props.dataHandler,
            dimension_data: {},
            showModal: false
        };

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


    //HANDLE THE CHOICE OF USER INPUT
    submitHandler(e) {
        e.preventDefault();
        var ele = $(e.target);

        var json = {
            "publicKey": localStorage.getItem("pubKey")
        }


        //add request to add dimension

        //add request to update dimension

        //add request to remove dimension


    }//end submitHandler


    componentDidMount() {
        var _this = this;

        var dim = {
            ID: 123432, dimensionType: "financial"
        }

        //UNCOMMENT WHEN INTEGRATING CONTRACTS AND THE JS

        // $.ajax({
        //     type: "POST",
        //     url: twinUrl + 'getDimensionData',
        //     data: {
        //         "publicKey": localStorage.getItem("pubKey"),
        //         "ID": "321312231212312"
        //     },
        //     success: function (result) {
        //         //var isSecure = true;

        //         if ($.type(result) == "string") {
        //             result = JSON.parse(result);
        //         }

        _this.setState({
            dimension_data: {
                dim
            }
        });
        $("#dimensionDetails").modal('show');
        $("#dimensionDetails").on('hidden.bs.modal', this.props.hideHandler);

        //     }

        // })


    }



    render() {

        //var prop = this.state.dimension;
        console.log("state in DimensionForm" + JSON.stringify(this.state))
        var type = this.state.dimension;
        console.log("#" + JSON.stringify(type))
        var syle = {
			marginRight:'15px'
		}

        //type = JSON.parse(type).dimensionType

        return (
            <div className="modal fade" id="dimensionDetails" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
                            <ul className="nav nav-pills" role="tablist">
                                <li role="presentation" className="active"><a href="#dimension_Details" role="tab" data-toggle="tab">Dimension Details</a></li>
                                <li role="presentation"><a href="#edit" role="tab" data-toggle="tab">Edit dimension</a></li>
                            </ul>
                        </div>

                        <div className="modal-body">
                            <div className="tab-content">
                            
                                <div role="tabpanel" className="tab-pane active" id="dimension_Details">

                                    <table className="table table-striped table-hover">
                                        <tbody>
                                            <tr>
                                                <td>Dimension Type</td>
                                                <td>{type.dimensionType}</td>
                                            </tr>

                                            <tr>
                                                <td>Reference Hash</td>
                                                <td>{type.ID}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div role="tabpanel" className="tab-pane center-block" id="edit" >
                                    
                                    
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
                                    
                                </div>

                            </div>
                        </div>



                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger btn-sm" onClick={this.submitHandler.bind(this) }>THIS BUTTON DOES SOMETHING</button>
                        </div>

                    </div>


                </div>

            </div>
        )
    }
}


class Modal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            iDimensions: [],
            showDetails: false,
            activeDimension: {}
        };
        this.showHandler = this.showHandler.bind(this);
    }

    getDimensions() {
        this.setState({
            iDimensions: [
                {
                    ID: 123124, dimensionType: "financial"
                },
                {
                    ID: 342342, dimensionType: "education"
                },
                {
                    ID: 212144, dimensionType: "personal"
                }
            ]
        })
    }

    // componentWillMount() {
    //     this.getDimensions();
    // }

    componentDidMount() {
        //ajax request to get identityDimensions from digital twin
        var dimensions = {
            identity_dimensions:
            [
                { dimensionType: "financial", ID: "123124" },
                { dimensionType: "personal", ID: "123124" },
                { dimensionType: "education", ID: "123124" }
            ]
        }

        this.setState({ iDimensions: dimensions.identity_dimensions })
    }

    hideHandler() {
        this.setState({ showDetails: false });
    }

    dataHandler(index) {
        return this.state.iDimensions[index];
    }

    getActiveData() {
        return this.state.activeDimension;
    }

    showHandler(e) {
        e.preventDefault();
        this.setState({
            showDetails: true,
            activeDimension: this.dataHandler($(e.target).attr('data-index'))
        });
    }

    handleAddDimension(dimension) {
        console.log("insidehandle add" + JSON.stringify(dimension))
        let dimensions = this.state.iDimensions;
        dimensions.push(dimension);
        this.setState({ iDimensions: dimensions })
    }

    handleDeleteDimension(id) {
        let dimensions = this.state.iDimensions;
        let index = dimensions.findIndex(x => x.id === id);
        dimensions.splice(index, 1);
        this.setState({ iDimensions: dimensions })
    }

    render() {
        console.log(JSON.stringify(this.state))
        let dimensions = this.state.iDimensions;
        var _that = this
        var style = {width: '180px'}
        
        
        return (
            <div id="dimensions_container">

                <h1>IDENTITY DIMENSIONS</h1><hr />

                <table className="table table-striped">
                    <tbody>
                        {(() => {
                            if ($.isArray(this.state.iDimensions) && this.state.iDimensions.length > 0) {
                                return this.state.iDimensions.map(function (el, i) {
                                    return (
                                        <tr key={i}>
                                            <td className="pull-right">
                                                <button type="button" className="btn btn-primary" style={style} data-item={el} data-index={i} onClick={_that.showHandler} >{el.dimensionType}</button>
                                            </td>
                                        </tr>
                                    );
                                });
                            } else {
                                return (
                                    <tr>
                                        <td>
                                            <p>No identity dimensions</p>
                                        </td>
                                    </tr>);
                            }
                        })(this) }
                    </tbody>
                </table>

                {this.state.showDetails ? <DimensionForm hideHandler={this.hideHandler.bind(this) } dataHandler={this.state.activeDimension} /> : null}
            </div>
        );
    }

};

//<IdentityDimensions dimensions={dimensions} onDelete={this.handleDeleteDimension.bind(this) } key={dimensions.ID} onClick={this.showHandler.bind(this)}/>


export default Modal

