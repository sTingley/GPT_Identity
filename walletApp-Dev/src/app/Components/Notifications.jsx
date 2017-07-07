import React from 'react';
var keccak_256 = require('js-sha3').keccak_256;

class Notifications extends React.Component {
	constructor(props){
		super(props);
			//coid=proposals
		this.state = { coid: [], 
			showDetails: false,
			activeMessages: {}
		};
		this.showHandler = this.showHandler.bind(this);
	}
	
	getDateFormat(timestamp){
		var d = new Date(timestamp);
		return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
	}
	
	componentDidMount(){
		$.ajax({
			url: twinUrl + "ballot/readNotify/" + keccak_256(localStorage.getItem("pubKey")).toUpperCase(),
			dataType: 'json',
			cache: false,
			success: function(result) {
				console.log("result: " + JSON.stringify((result)));
				if(typeof(result) != "object"){
					var data = JSON.parse(result);	
				} else{ 
					var data = result;
					var test = JSON.parse((result.data));
					test = JSON.parse(JSON.stringify(test.messages));
					console.log(test[0].type);
				}
				this.setState({coid: test});
				console.log("Notifications state: " + JSON.stringify(this.state))
				console.log(typeof(result));
			}.bind(this)
		});
	}
	
	hideHandler(){
		this.setState({showDetails: false });
	}
	
	//assigns entire COID to activeMessages, 
	dataHandler(index){
		return this.state.coid[index];
	}
	
	getActiveData(){
		return this.state.activeMessages;
	}
	
	showHandler(e){
		e.preventDefault();
		this.setState({
			showDetails: true, 
			activeMessages: this.dataHandler($(e.target).attr('data-index')) 
		});
	}
	
	render(){
		var _that = this;
		return(
			<div id="notifications_container">
				<h1>Notifications</h1> <hr/>
				<table className="table table-striped">
					<tbody>
					{(()=>{
						if($.isArray(this.state.coid) && this.state.coid.length > 0){
							return this.state.coid.map(function(el,i) {
								return (
									<tr key={i}>
										<td>
											<div><b>Proposal ID: </b>{el.proposal_id}</div>
											<div><b>Message: </b>{el.message}</div>
											<div><b>Published On: </b>{_that.getDateFormat(el.time)}</div>
										</td>
									</tr>
								);
							});
						} else {
							return (<tr>
										<td>
											<p>No messages to show !</p>
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
export default Notifications;
