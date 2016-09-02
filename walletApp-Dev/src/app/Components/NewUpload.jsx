import React, {Component} from 'react';
var Dropzone = require('react-dropzone');

class NewUpload extends Component {
	
	constructor(props){
		super(props);
		this.state = {
			files:[]
		}
		this.onDrop = this.onDrop.bind(this);
		this.removeFile = this.removeFile.bind(this);
	}
	
	onDrop(files){
		this.setState({files: files});
		console.log('Received files: ', files);
	}
	
	removeFile(index){
		var newFiles = this.state.files;
		newFiles.splice(index, 1);
		this.setState({files: newFiles});
	}
	
	render(){
		var cssClass = "hidden";
		var allFiles = this.state.files;
		if(this.state.files.length > 0)
			cssClass="";
		return(
			<div className="new-upload">
				<Dropzone onDrop={this.onDrop} className="drop-container">
				  <div className="file-drop">Just Drag and Drop your files here</div>
				</Dropzone>
				<div className={cssClass}>
					<div className="row margin-top-fix">
						<div className="col-md-12">
							<div className="pull-right">
								<button type="button" className="btn btn-primary btn-sm">
									<span className="glyphicon glyphicon-ok" aria-hidden="true" /> Upload All
								</button>
							</div>
						</div>
					</div>
					<div className="row">
						<div className="col-md-12">
							<ul className="list-group">
								{allFiles.map((file, i) => {
										return (
											<li className="list-group-item" key={file.size}>{file.name} ({file.size})
												<div className="pull-right">
													<button type="button" className="btn btn-danger btn-xs" onClick={()=> { this.removeFile(i); }}>
														<span className="glyphicon glyphicon-remove" aria-hidden="true" />
													</button>
												</div>
											</li>
										)
									})
								}
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default NewUpload;