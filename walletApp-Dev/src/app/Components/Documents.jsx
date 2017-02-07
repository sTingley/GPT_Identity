import React, {Component} from 'react';
import { Link } from 'react-router';


class UploadIpfsFile extends React.Component {

	constructor(props){
		super(props);
		this.state = {
			docs: {}, // [ {filename: , hash(IPFS): , file_hash(sha3): , ipfs_url: , timestamp: , fileformat: } , {} ]
			pubKey: props.pubKey,
			selected:'0', //will remove???????

			files:'' // when a file is selected, the value of files goes from empty string '' to empty object, {}
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

		// NEED TO BE CHANGED FOR PROPER DIV		
		$("#documents-container .modal").modal('show');
        $("#documents-container .modal").on('hidden.bs.modal', this.props.handleHideModal);
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
		//jQuery.extend() - Merge the contents of two or more objects together into the first object
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
		console.log("state with docs: " + JSON.stringify(this.state))
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




class Documents extends Component {
	
	constructor(props){
		super(props);
		this.state = {
			
			showModal: false,

			//used in getFileDetails
			file_attrs:[],
			tmpFile:'',

			//list of documents populated from digital twin /notifications ($pubkey_files.json)
			docs:{},
			pubKey: localStorage.getItem("pubKey")
		};

		this.handleHideModal = this.handleHideModal.bind(this);
		this.handleShowModal = this.handleShowModal.bind(this)
	}
	
	componentDidMount(){
		$.ajax({
			url: twinUrl + "ipfs/alldocs/"+this.state.pubKey,
			dataType: 'json',
			cache: false,
			success: function(resp) {
				//console.log("Response Data in Documents (parent) component: ", JSON.stringify(resp.data.documents))
				this.setState({docs: resp.data.documents});
			}.bind(this)
		});
	}

	handleHideModal(){
		this.setState({showModal: false});
	}

	handleShowModal(e){
		e.preventDefault();
		console.log("got to handleShowModal")
        this.setState({showModal: true  });
		/*tmpFile: $(e.target).attr('data-id')*/
    }
	
	getDateFormat(timestamp){
		var d = new Date(timestamp);
		return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
	}

	getFileDetails(filedata){
		var obj = {[this.state.tmpFile]:filedata};
		this.setState({file_attrs: this.state.file_attrs.concat([obj])});
	}
	
	render(){
		var style = {
			fontSize: '13px',
			lineHeight: 2
		}
		return(
			<div className="documents" id="documents-container">

				<h3>My Documents</h3>
				<button type="button" data-id="upload" onClick={this.handleShowModal} className="btn-sm btn-warning"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
				<hr/>

				<div className="file-container">
					<ul className="list-group">
						{(() => {
							if(!$.isEmptyObject(this.state.docs)){
								var i = 0;
								return this.state.docs.map((files) => {
									i++;
									return(
										<li key={i} className="list-group-item">
											<a className="btn btn-success btn-sm pull-right" href={files.ipfs_url} target="_blank" role="button">Download</a>
											<h4 className="list-group-item-heading">{files.filename}</h4>
											<p className="list-group-item-text" style={style}><b className="text-info">Created On:</b> { this.getDateFormat(files.timestamp) }</p>
											<p className="list-group-item-text" style={style}><b className="text-info">IPFS Hash:</b> { files.hash }</p>
										</li>
									)
								})
								
							} else {
								return <li className="list-group-item">No documents found</li>
							}
						})(this)}
					</ul>
				</div>

				{this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal}/> : null}
			</div>
		);
	}
}
export default Documents;

//{/*dataHandler={this.getFileDetails.bind(this)} */}