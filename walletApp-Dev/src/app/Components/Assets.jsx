import React, {Component} from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';

import AssetTags from './classAndSubClass.js';

// TODO: Static public/private keys has to be changed

class Modal extends Component {
	
	constructor(props){
		super(props);
		this.tags = new AssetTags('1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740', props.asset.asset_id);
		this.state = {
			asset: props.asset || {},
			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses")
		};
		this.handleClassChange = this.handleClassChange.bind(this);
	}
	
	componentDidMount(){
        $("#assetDetails").modal('show');
        $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);
    }
	
	handleClassChange(tags){
		this.setState({asset_class:tags});
		this.tags.updateClasses(tags, this.props.asset.asset_id, "classes");
	}
	
	handleSubClassChange(tags){
		this.setState({asset_subclass: tags});
		this.tags.updateClasses(tags,this.props.asset.asset_id, "subclasses");
	}
	
	render(){
		var prop = this.props.asset;
		var classInput = {
			addKeys: [13,188],	// Enter and comma
			value: this.state.asset_class,
			onChange: this.handleClassChange,
			inputProps: {placeholder: ""}
		};
		var subClassInput = {
			addKeys: [13,188],	// Enter and comma
			value: this.state.asset_subclass,
			onChange: this.handleSubClassChange.bind(this),
			inputProps: {placeholder: ""}
		};
		return(
			<div className="modal fade" id="assetDetails" key={prop.asset_id} tabIndex="-1" role="dialog" aria-labelledby="asset">
			  <div className="modal-dialog" role="document">
				<div className="modal-content">
				  <div className="modal-header">
					<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
					<h4 className="modal-title" id="asset">{prop.asset_name}</h4>
				  </div>
				  <div className="modal-body">
					<table className="table table-striped table-hover">
						<tbody>
							<tr>
								<td>Asset Name</td>
								<td>{prop.asset_name}</td>
							</tr>
							<tr>
								<td>Asset Description</td>
								<td>{prop.asset_name} description</td>
							</tr>
							<tr>
								<td>Asset Class<p className="text-info">Use comma/enter to add class</p></td>
								<td><TagsInput {...classInput}  /></td>
							</tr>
							<tr>
								<td>Asset SubClass<p className="text-info">Use comma/enter to add sub class</p></td>
								<td><TagsInput {...subClassInput}  /></td>
							</tr>
							<tr>
								<td>Public Key</td>
								<td>0987654321</td>
							</tr>
							<tr>
								<td>Private Key</td>
								<td>1234567890</td>
							</tr>
							<tr>
								<td>Control Tokens (count)</td>
								<td>3</td>
							</tr>
							<tr>
								<td>Controller ID's</td>
								<td>Ctrl ID1, Ctrl ID2, Ctrl ID3</td>
							</tr>
							<tr>
								<td>Contract Address / Blockchain ID</td>
								<td>ID1,ID2</td>
							</tr>
						</tbody>
					</table>
				  </div>
				</div>
			  </div>
			</div>
		);
	}
}

Modal.propTypes = {
  hideHandler: React.PropTypes.func.isRequired	// hideHandler method must exists in parent component
};

class Assets extends Component {
	
	constructor(props){
		super(props);
		
		// static values
		this.state = {
			showDetails: false,
			wallet: {pubKey:"1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740", priKey:"1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740"},
			own_assets: [{asset_id:789, asset_name:'COID'},{asset_id:101112, asset_name:'Phone'},{asset_id:131415, asset_name:'House'}],
			controlled_assets:[{asset_id:161718, asset_name:'Parents House'},{asset_id:192021, asset_name:'My Car'}],
			active_asset: {},
			show_only:[]
		};
		
		// event handlers must attached with current scope
		this.assetHandler = this.assetHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);
	}
	
	assetHandler(asset){
		var assetID = asset.asset_id;
		if(assetID){
			this.setState({showDetails: true, active_asset: asset });
		}
	}
	
	// Close Asset Details Window
	hideHandler(){
		this.setState({showDetails: false, active_asset:{} });
	}
	
	searchHandler(e){
		var str = e.target.value.trim();
		var _this = this;
		setTimeout(function(){
			var data = JSON.parse(localStorage.getItem(_this.state.wallet.pubKey));
			var indexed = [];
			for(var assetID in data){
				var allTags  = data[assetID].classes.concat(data[assetID].subclasses);
				allTags.map((ele) => {
					if(ele.toLowerCase() == str.toLowerCase()){
						indexed.push(assetID);
					}
				})
			}
			_this.setState({show_only:indexed});
		}, 350);
		if(!str.length) this.setState({show_only:[]});
	}
	
	render(){
		return (
			<div id="assets-container" className="assets">
				<div className="row" id="search-bar">
					<div className="col-md-6">
						<h3 className="margin0px">Manage Assets</h3>
					</div>
					<div className="col-md-6">
						<form className="form-inline">
							<div className="form-group pull-right">
								<div className="input-group">
									<input type="text" name="search-assets" id="search-assets" className="form-control" placeholder="Search Assets" onKeyUp={this.searchHandler} />
									<div className="input-group-addon"><span className="glyphicon glyphicon-search"></span></div>
								</div>
							</div>
						</form>
					</div>
				</div>
				<div id="my-accounts">
					<h4>My Wallet</h4> <hr/>
					<div className="all-accounts">
						<div className="row accounts">
							<p><b>Public Key : </b>{this.state.wallet.pubKey}</p>
							<p><b>Private Key : </b>{this.state.wallet.priKey}</p>
						</div>
					</div>
				</div>
				<div id="own-assets">
					<h4>My Owned Assets</h4> <hr/>
					<div className="own-assets">
						<div className="row assets">
							{this.state.own_assets.map((asset) => {
								var cssClass = "btn btn-success";
								if(this.state.show_only.length > 0){
									if(this.state.show_only.toString().indexOf(asset.asset_id.toString()) == -1){
										cssClass += " hidden";
									} else cssClass.replace("hidden","");
								}
								return(
									<button type="button" key={asset.asset_id} className={cssClass} onClick={() => this.assetHandler(asset)}>
										<span className="glyphicon glyphicon-ok-circle"></span>
										{asset.asset_name}
									</button>
								);
							})}
						</div>
					</div>
				</div>
				<div id="controlled-assets">
					<h4>My Controlled Assets</h4> <hr/>
					<div className="row assets">
						{this.state.controlled_assets.map((asset) => {
							var cssClass = "btn btn-info";
							if(this.state.show_only.length > 0){
								if(this.state.show_only.toString().indexOf(asset.asset_id.toString()) >= 0){
									cssClass += " show";
								} else cssClass += " hidden";
							}
							return(
								<button type="button" key={asset.asset_id} className={cssClass} onClick={() => this.assetHandler(asset)}>
									<span className="glyphicon glyphicon-link"></span>
									{asset.asset_name}
								</button>
							);
						})}
					</div>
				</div>
				{this.state.showDetails ? <Modal hideHandler={this.hideHandler} asset={this.state.active_asset} /> : null}
			</div>
		);
	}
}

export default Assets;
