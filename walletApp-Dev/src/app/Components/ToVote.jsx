import React from 'react';

class Votes extends React.Component {
	constructor(props){
		super(props);
	}
	
	submitHandler(e){
		e.preventDefault();
		var ele = $(e.target);
		var index = parseInt(ele.attr("data-index"));
		
		var json = {
			"txnDesc": this.refs["desc-"+index].value,
			"signature": '7051442bbf18bb2c86cbc8951a07e27ec6ba05ac3fa427e4c6b948e3dcf91a94046b048edf52445fb22cc776a94b87c3f55426f993458ec744f61f09fb46eeaa',
			"publicKey": localStorage.getItem("pubKey"),
			"proposalID": this.refs["proposalid-"+index].value,
			"vote": parseInt(ele.attr("data-val"))
		};

		var pid = this.refs["proposalid-"+index].value;
		
		$.ajax({
			url: twinUrl + 'voteonCOIDproposal',
			type: 'POST',
			data: json,
			success: function(res){
				if(res.status == "Ok" && res.msg == "true"){
					var proposalID = res.proposalID || pid;
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
	
	getCoidData(e){
		e.preventDefault();
		var ele = $(e.target);
		var index = parseInt(ele.attr("data-index"));
		
		var json = {
			"txnDesc": this.refs["desc-"+index].value,
			"signature": '7051442bbf18bb2c86cbc8951a07e27ec6ba05ac3fa427e4c6b948e3dcf91a94046b048edf52445fb22cc776a94b87c3f55426f993458ec744f61f09fb46eeaa',
			"publicKey": localStorage.getItem("pubKey"),			//need to change ballot app 'requesterVal'
			"proposalID": this.refs["proposalid-"+index].value,
			"vote": parseInt(ele.attr("data-val"))
		};
		
		
		$.ajax({
			url: twinUrl + 'getCoidData',
			type: 'POST',
			data: json,
			success: function(res){
				if(res.status == "Ok" && res.msg == "true"){
					//var proposalID = res.proposalID || pid;
					$.ajax({
						//url: twinUrl + proposalID + "/" + localStorage.getItem("pubKey"),
						type: 'GET',
						complete: function(xhr){
						//	alert("vote successfully submitted");
							window.location.reload();
						}
					});
				} else {
					alert('Unable to get coid data')
				}
			}
		})
	}
	
	render(){
		return(
			<tr>
				<td>
					<h3>{this.props.msg}</h3>
					<textarea className="form-control" ref={"desc-"+this.props.index} placeholder="Comments here.." />
					<input ref={"proposalid-"+this.props.index} value={this.props.prposalid} />
					<button type="button" data-index={this.props.index} data-val="" onClick={this.getCoidData.bind(this)}  className="btn btn-primary btn-block">retrieve data</button>
				</td>
				<td>
					<p>
					  <button type="button" data-index={this.props.index} data-val="2" onClick={this.submitHandler.bind(this)} className="btn btn-primary btn-block">Yes</button>
					  <button type="button" data-index={this.props.index} data-val="1" onClick={this.submitHandler.bind(this)} className="btn btn-default btn-block">No</button>
					</p>
				</td>
			</tr>
		)
		
	}
};

class ToVote extends React.Component {
	constructor(props){
		super(props);
		this.state = { coid: [] };
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
	
	render(){
		
		return(
			<div id="vote_container">
				<h1>Vote</h1> <hr/>
				<table className="table">
					<tbody>
					{(()=>{
						if($.isArray(this.state.coid) && this.state.coid.length > 0){
							return this.state.coid.map(function(el,i) {
								return <Votes key={i} prposalid={el.proposal_id} index={i} timestamp={el.time} />;
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
			</div>
		)
	}
};
export default ToVote;
