import React from 'react';


class ModalWin extends React.Component {
	
	constructor(props){
		super(props);
		this.state = {
			proposal: this.props.dataHandler
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
							alert("vote successfully submitted");
							window.location.reload();
						}
					});
					
				} else {
					alert("Unable to submit your vote. Please try again later");
				}
			}
		});
	}
	
	componentDidMount(){
		var _this = this;
		$.ajax({
			type: "POST",
			url: twinUrl + 'getCoidData',
			data: {
				"publicKey": localStorage.getItem("pubKey"),
				"proposalID": this.state.proposal.proposal_id,
			},
			success: function(result){
				// Fill up data in Modal window
			},
			complete: function(){
				$("#proposalDetails").modal('show');
				$("#proposalDetails").on('hidden.bs.modal', _this.props.hideHandler);
			}
		});
    }
	
	render(){
		var prop = this.state.proposal;
		return(
			<div className="modal fade" id="proposalDetails" tabIndex="-1" role="dialog">
			  <div className="modal-dialog" role="document">
				<div className="modal-content">
				  <div className="modal-header">
					<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
					<h4 className="modal-title" id="asset">Details</h4>
				  </div>
				  <div className="modal-body">
					<table className="table table-striped table-hover">
						<tbody>
							<tr>
								<td>Proposal ID</td>
								<td>{prop.proposal_id}</td>
							</tr>
							<tr>
								<td colSpan="2"><b>Official ID's</b></td>
							</tr>
							<tr>
								<td>Offical ID label</td>
								<td><a href="#">Ipfs Hash</a></td>
							</tr>
							<tr>
								<td>Offical ID label</td>
								<td><a href="#">Ipfs Hash</a></td>
							</tr>
							<tr>
								<td>Offical ID label</td>
								<td><a href="#">Ipfs Hash</a></td>
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
				<h1>Vote</h1> <hr/>
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
