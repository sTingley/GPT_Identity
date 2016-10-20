import React, {Component} from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';

import AssetTags from './classAndSubClass.js';

// TODO: Static public/private keys has to be changed

class Modal extends Component {
	
	constructor(props){
		super(props);
		this.pubKey = localStorage.getItem("pubKey");
		this.tags = new AssetTags(this.pubKey, props.asset.asset_id);
		this.state = {
			asset: props.asset || {},
			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses")
		};
		this.handleClassChange = this.handleClassChange.bind(this);
		console.log(JSON.stringify(props.asset.asset_id))
	}
	
	componentDidMount(){
        $("#assetDetails").modal('show');
        $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);
		//ajax request to fetch coid data...
		//put response into an object
		//call method to load into state
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
		var prop = this.props.asset.asset_name;
		
		console.log("In render: " + JSON.stringify(prop));
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
			<div className="modal fade" id="assetDetails" key={this.props.asset.asset_id} tabIndex="-1" role="dialog" aria-labelledby="asset">
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
								<td>{this.props.asset.asset_id}</td>
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
								<td colSpan="2"><b>Official ID's</b></td>
							</tr>
							{(() => {
								var ipfs_url = "http://10.101.114.231:8080/ipfs/";
								if(!$.isEmptyObject(prop)){
									console.log("**", prop.uniqueIdAttributes)
									return prop.uniqueIdAttributes.map((ids,i) => {
										return(
											<tr key={i}>
												<td>{ids[0]}</td>
												<td><p>File hash: {ids[2]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url+"/"+ids[1]}>{ids[1]}</a></p></td>
											</tr>
										)
									});
									
								} else {
								return <tr><td colSpan="2">No Ids found</td></tr>
							}
						})(this)}
							
							<tr>
								<td>Ownership ID</td>
								<td>{prop.ownershipId}</td>
							</tr>
                                <td colSpan="2"><b>Ownership ID List</b></td>
							 <tr>
							 
							 	{(() => {
							 	if(!$.isEmptyObject(prop)){
							 		return prop.ownerIdList.map((ids,i) => {
							 		return <p key={i}> {prop.ownerIdList[i]}</p>
							 		})
								}
                                else
                                {
                                    return <tr><td colSpan="2">No Ids found</td></tr>
                                }
							 	})(this)}
							 	
							 </tr>
                            <tr>
							<td>Ownership ID</td>
                            
							<td>{prop.ownershipId}</td>
							</tr>
							
							
                            
                            <tr>
								<td>Ownership ID List</td>
								</tr>
                                {(() => {
                                    
								if(!$.isEmptyObject(prop.ownerIdList)){
                                    console.log(prop.ownerIdList)
									return prop.ownerIdList.map((ids,i) => { 
									return(
									<tr key={i}>
								        <td><p>Token Owner:  {ids[0]}</p>
                                        <p>Owner Token Quantity: {ids[1]}</p> </td>
                                    </tr>
                                    )});
                                    
                                    
                                  
								}
                                })(this)} 
                        
                            
                            
                            
							<tr>
								<td>Control ID</td>
								<td><p> {prop.controlId}</p></td>
							</tr>	
							<tr>
								<td>Control ID List</td>
								<td>{(() => {
								if(!$.isEmptyObject(prop)){
									return prop.controlIdList.map((ids,i) => {
									return <p key={i}> {prop.controlIdList[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							<tr>
								<td>Recovery IDs</td>
								<td>{(() => {
								if(!$.isEmptyObject(prop)){
									return prop.identityRecoveryIdList.map((ids,i) => {
									return <p key={i}> {prop.identityRecoveryIdList[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							
							<tr>
								<td>Recovery Condition</td>
								<td> <p> {prop.recoveryCondition}</p></td>
							</tr>
							<tr>
								<td>Ownership Token ID</td>
								<td><p> {prop.ownershipTokenId}</p></td>
							</tr>
							<tr>
								<td>Ownership Token Description</td>
								<td>{(() => {
								if(!$.isEmptyObject(prop)){
									return prop.ownershipTokenAttributes.map((ids,i) => {
									return <p key={i}> {prop.ownershipTokenAttributes[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							<tr>
								<td>Ownership Token Quantity</td>
								<td><p> {prop.ownershipTokenQuantity}</p></td>
							</tr>
							<tr>
								<td>Control Token ID</td>
								<td> <p> {prop.controlTokenId}</p></td>
							</tr>
							<tr>
								<td>Control Token Description</td>
								<td>{(() => {
								if(!$.isEmptyObject(prop)){
									return prop.controlTokenAttributes.map((ids,i) => {
									return <p key={i}> {prop.controlTokenAttributes[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							<tr>
								<td>Control Token Quantity</td>
								<td><p> {prop.controlTokenQuantity}</p></td>
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
			wallet: {pubKey: localStorage.getItem("pubKey") },
			
			//assign local storage.getItem("COID") to own_assets
			//!!!!!!!!!!!!!!!!!!!!!!!!
			//onComponentDidMount call
			own_assets: [{}],
			controlled_assets:[{asset_id:161718, asset_name:'Parents House'},{asset_id:192021, asset_name:'My Car'}],
			active_asset: {},
			show_only:[]
		};
		
		// event handlers must attached with current scope
		this.assetHandler = this.assetHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);
	}
	
	componentDidMount() {
		

		$.ajax({
			type: "POST",
			url: twinUrl + 'pullCoidData',
			data: {"pubKey": localStorage.getItem("pubKey")},
			success: function (result) {			

				if ($.type(result) == "object") {
					//TODO: Change asset_name tag to asset_data
					this.setState({ own_assets: [{asset_id: result.assetID,asset_name:result}]})
					
					console.log(JSON.stringify(result))
					
					//console.log(result)
					//console.log("is object")
					//console.log(JSON.stringify(this.state.own_assets))
					//return result;
				}
				else {
					console.log("****************")
					//console.log(JSON.stringify(this.state.own_assets))
					
					//do something else
				}
			}.bind(this),
			complete: function () {
				// do something
			},			
			//console.log(result)	
		})

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
										{asset.asset_id}
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
