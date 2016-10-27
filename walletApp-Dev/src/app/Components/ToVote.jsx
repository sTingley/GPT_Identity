import React from 'react';


class ModalWin extends React.Component {
	
	constructor(props){
		super(props);
		this.state = {
			proposal: this.props.dataHandler,
			proposal_data:{}
		};
	}
	
	submitHandler(e){
		e.preventDefault();
		var ele = $(e.target);
		
		var json = {
			"txnDesc": "sampleDesc",
			"signature": '7051442bbf18bb2c86cbc8951a07e27ec6ba05ac3fa427e4c6b948e3dcf91a94046b048edf52445fb22cc776a94b87c3f55426f993458ec744f61f09fb46eeaa',
			"publicKey": localStorage.getItem("pubKey"),
			"proposalID": this.state.proposal.proposal_id,
			"vote": parseInt(ele.attr("data-val"))
		};
		
		$.ajax({
			url: twinUrl + 'voteonCOIDproposal',
			type: 'POST',
			data: json,
			success: function(res){
				if(res.status == "Ok" && res.msg == "true"){
					var proposalID = this.state.proposal.proposal_id;
					$.ajax({
						url: twinUrl + proposalID + "/" + localStorage.getItem("pubKey"),
						type: 'GET',
						complete: function(xhr){
							//alert("vote successfully submitted");
							window.location.reload();
							_this.setState({
								proposal_data: result
							});
						}
					});
					
				} else {
					//alert("Unable to submit your vote. Please try again later");
				}
			}
		});
	}



	
	componentDidMount(){
		var _this = this;
		/*
		$.ajax({
			type: "POST",
			url: twinUrl + "ipfs/validateFiles",
			data: {
				file_hash: "123,345,657",
				ipfs_hash: "098,876,654"
			},
			success: function(res){
				console.log("validation response....", res);
			}
		});	
*/
		$.ajax({
			type: "POST",
			url: twinUrl + 'getCoidData',
			data: {
				"publicKey": localStorage.getItem("pubKey"),
				"proposalId": this.state.proposal.proposal_id,
			},//.bind(this)d
			success: function(result){
				var fileValidation = true;
				// Fill up data in Modal window
				//data.publicKey
				if($.type(result) == "string"){
					result = JSON.parse(result);	
				}
				var ownerArray = [];
                for(var i = 0; i < result.ownershipTokenQuantity.length; i++)
                {
                    var temp = [];
                    temp[0] = result.ownerIdList[i];
                    temp[1] = result.ownershipTokenQuantity[i];
                    
                    ownerArray.push(temp)
                }
                result.ownerArray = ownerArray
                console.log(result.ownerArray)
				
				_this.setState({
					proposal_data: result
				});
				$("#proposalDetails").modal('show');
				$("#proposalDetails").on('hidden.bs.modal', _this.props.hideHandler);
			}
		});
    }
	
	render(){
		var prop = this.state.proposal;
		var style = {
			fontSize: '12.5px'
		}
		return(
			<div className="modal fade" id="proposalDetails" tabIndex="-1" role="dialog">
			  <div className="modal-dialog modal-lg" role="document">
				<div className="modal-content">
				  <div className="modal-header">
					<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
					<h4 className="modal-title" id="asset">COID Proposal Details</h4>
				  </div>
				  <div className="modal-body">
					<table className="table table-striped table-hover" style={style}>
						<tbody>
							<tr>
								<td>Proposal ID</td>
								<td>{prop.proposal_id}</td>
							</tr>
							<tr>
								<td colSpan="2"><b>Official IDs</b></td>
							</tr>
							{(() => {
								var ipfs_url = "http://10.101.114.231:8080/ipfs/";
								if(!$.isEmptyObject(this.state.proposal_data)){
									console.log("**", this.state.proposal_data.uniqueIdAttributes)
									return this.state.proposal_data.uniqueIdAttributes.map((ids,i) => {
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
	                            
								<td>{this.state.proposal_data.ownershipId}</td>
							</tr>
							<tr>
								<td>Ownership ID Attributes</td>
							 	<td>
							 	{(() => {
							 	if(!$.isEmptyObject(this.state.proposal_data)){
							 		return this.state.proposal_data.ownerIdList.map((ids,i) => {
							 		return <p key={i}> {this.state.proposal_data.ownerIdList[i]}</p>
							 		})
								}
                                else
                                {
                                    return <p>No Ids found</p>
                                }
							 	})(this)}
							 	</td>
							 	
							</tr>

							<tr>
								<td>Ownership Token ID</td>
								<td><p> {this.state.proposal_data.ownershipTokenId}</p></td>
							</tr>
							<tr>
								<td>Ownership Token Description</td>
								<td>{(() => {
								if(!$.isEmptyObject(this.state.proposal_data)){
									return this.state.proposal_data.ownershipTokenAttributes.map((ids,i) => {
									return <p key={i}> {this.state.proposal_data.ownershipTokenAttributes[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							<tr>
								<td>Ownership Token Quantity</td>
								<td><p> {this.state.proposal_data.ownershipTokenQuantity}</p></td>
							</tr>
                            
                            
                            
							<tr>
								<td>Control ID</td>
								<td><p> {this.state.proposal_data.controlId}</p></td>
							</tr>	
							<tr>
								<td>Control ID List</td>
								<td>{(() => {
								if(!$.isEmptyObject(this.state.proposal_data)){
									return this.state.proposal_data.controlIdList.map((ids,i) => {
									return <p key={i}> {this.state.proposal_data.controlIdList[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							<tr>
								<td>Recovery IDs</td>
								<td>{(() => {
								if(!$.isEmptyObject(this.state.proposal_data)){
									return this.state.proposal_data.identityRecoveryIdList.map((ids,i) => {
									return <p key={i}> {this.state.proposal_data.identityRecoveryIdList[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							
							<tr>
								<td>Recovery Condition</td>
								<td> <p> {this.state.proposal_data.recoveryCondition}</p></td>
							</tr>
							
							<tr>
								<td>Control Token ID</td>
								<td> <p> {this.state.proposal_data.controlTokenId}</p></td>
							</tr>
							<tr>
								<td>Control Token Description</td>
								<td>{(() => {
								if(!$.isEmptyObject(this.state.proposal_data)){
									return this.state.proposal_data.controlTokenAttributes.map((ids,i) => {
									return <p key={i}> {this.state.proposal_data.controlTokenAttributes[i]}</p>
									})
								}
								})(this)}
								</td>
							</tr>
							<tr>
								<td>Control Token Quantity</td>
								<td><p> {this.state.proposal_data.controlTokenQuantity}</p></td>
							</tr>
							<tr>
								<td>Vote Description</td>
								<td><textarea className="form-control"></textarea></td>
							</tr>
						</tbody>
					</table>
				  </div>
				  <div className="modal-footer">
					<button type="button" className="btn btn-primary" data-val="2" onClick={this.submitHandler.bind(this)}>Yes</button>
					<button type="button" className="btn btn-default" data-val="1" onClick={this.submitHandler.bind(this)}>No</button>
				  </div>
				</div>
			  </div>
			</div>
		)
	}
};


class ToVote extends React.Component {
	constructor(props){
		super(props);
			//coid=proposals
		this.state = { coid: [], 
			showDetails: false,
			activeProposal: {}
		};
		this.showHandler = this.showHandler.bind(this);
	}
	
	getDateFormat(timestamp){
		var d = new Date(timestamp);
		return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
	}
	
	componentDidMount(){
		$.ajax({
			url: twinUrl + "ballot/readNotify/" + localStorage.getItem("pubKey"),
			dataType: 'json',
			cache: false,
			success: function(result) {
				if(typeof(result) != "object"){
					var data = JSON.parse(result);	
				} else 
					var data = result;
				this.setState({coid: data.data.messages});
			}.bind(this)
		});
	}
	
	hideHandler(){
		this.setState({showDetails: false });
	}
	
	//assigns entire COID to activeProposal, 
	dataHandler(index){
		return this.state.coid[index];
	}
	
	getActiveData(){
		return this.state.activeProposal;
	}
	
	showHandler(e){
		e.preventDefault();
		this.setState({
			showDetails: true, 
			activeProposal: this.dataHandler($(e.target).attr('data-index')) 
		});
	}
	
	render(){
		var _that = this;
		return(
			<div id="vote_container">
				<h1>Proposals pending for your action</h1> <hr/>
				<table className="table table-striped">
					<tbody>
					{(()=>{
						if($.isArray(this.state.coid) && this.state.coid.length > 0){
							return this.state.coid.map(function(el,i) {
								return (
									<tr key={i}>
										<td>
											<div><b>Proposal ID: </b>{el.proposal_id}</div>
											<div><b>Published On: </b>{_that.getDateFormat(el.time)}</div>
										</td>
										<td className="pull-right">
											<button type="button" title="View proposal to vote" data-item={el} data-index={i} onClick={_that.showHandler} className="btn btn-primary">View Proposal</button>
										</td>
									</tr>
								);
							});
						} else {
							return (<tr>
										<td>
											<p>No data to act upon !</p>
										</td>
									</tr>);
						}
					})(this)}
					</tbody>
				</table>
				{this.state.showDetails ? <ModalWin hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeProposal}  /> : null}
			</div>
		)
	}
};
export default ToVote;
