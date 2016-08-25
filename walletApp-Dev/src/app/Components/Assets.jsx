import React, {Component} from 'react';
import { Link } from 'react-router';

class Modal extends Component {
	
	constructor(props){
		super(props);
	}
	
	componentDidMount(){
        $("#assetDetails").modal('show');
        $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);
    }
	
	render(){
		var prop = this.props.asset;
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
		
		this.state = {
			assets_active: false,
			showDetails: false,
			accounts: [{acc_id:123, acc_name:'Account - I'}, {acc_id:456, acc_name:'Account - II'}],
			own_assets: [{asset_id:789, asset_name:'COID'},{asset_id:101112, asset_name:'Phone'},{asset_id:131415, asset_name:'House'}],
			controlled_assets:[{asset_id:161718, asset_name:'Parents House'},{asset_id:192021, asset_name:'My Car'}],
			active_asset: {}
		};
		
		// event handlers must attached with current scope
		this.accountHandler = this.accountHandler.bind(this);
		this.assetHandler = this.assetHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
	}
	
	accountHandler(acc){
		var acc_id = acc.acc_id;
		if(acc_id){
			this.setState({ assets_active: true });
			//alert(acc_id);
		}
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
	
	render(){
		var cssClass = (this.state.assets_active) ? 'show' : 'hidden';
		return (
			<div id="assets-container" className="assets">
				<div id="my-accounts">
					<h3>My Accounts</h3> <hr/>
					<div className="all-accounts">
						<div className="row accounts">
							{this.state.accounts.map((acc) => {
								return(
									<button type="button" key={acc.acc_id} className="btn btn-primary" onClick={() => this.accountHandler(acc)}>
										<span className="glyphicon glyphicon-lock"></span>
										{acc.acc_name}
									</button>
								);
							})}
						</div>
					</div>
				</div>
				<div id="own-assets" className={cssClass}>
					<h4>My Owned Assets</h4> <hr/>
					<div className="own-assets">
						<div className="row assets">
							{this.state.own_assets.map((asset) => {
								return(
									<button type="button" key={asset.asset_id} className="btn btn-success" onClick={() => this.assetHandler(asset)}>
										<span className="glyphicon glyphicon-ok-circle"></span>
										{asset.asset_name}
									</button>
								);
							})}
						</div>
					</div>
				</div>
				<div id="controlled-assets" className={cssClass}>
					<h4>My Controlled Assets</h4> <hr/>
					<div className="row assets">
						{this.state.controlled_assets.map((asset) => {
							return(
								<button type="button" key={asset.asset_id} className="btn btn-info" onClick={() => this.assetHandler(asset)}>
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
