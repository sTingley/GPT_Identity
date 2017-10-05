import React from 'react';
import { Link } from 'react-router';
import Modal from './ProposalModal.jsx';
import dmConfig from '../dm_config.json';

class Dimension extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			dimension : ""
		}
	}
	componentDidMount() {
		$.ajax({
			url: dmConfig.mongodb_url + "getTitles/" + this.props.dimension,
			dataType: 'json',
			cache: false,
			success: function(result) {
				console.log
				this.setState({
					dimension : result[0].categories
				});
			}.bind(this)
		});
	}
	render() {
		return (
			<span>
				{this.state.dimension ?
				((dimension)=>{
					var dimensionToDisplay = ""
					for (var index = 0; index < dimension.length; index++) {
					  if(index < dimension.length - 1) {
						  dimensionToDisplay = dimensionToDisplay + dimension[index] + ", ";
					  } else {
						  dimensionToDisplay = dimensionToDisplay + dimension[index];
					  }
					}
					return dimensionToDisplay;
				})(this.state.dimension) :
				null}
			</span>
		);
	}
}

class DataRequestsForYou extends React.Component {
	constructor(props){
		super(props);
			//coid=proposals
		this.state = {
			requestsForYou : [],
			showDetails: false,
			assetCategories : {}
		};
		this.modalOpenHandler = this.modalOpenHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
		this.submitHandler = this.submitHandler.bind(this);
	}

	modalOpenHandler(proposal, proposalId) {
		if (proposalId) {
			this.setState({ showDetails: true, active_proposal: proposal });
		}
	}

	// Close Asset Details Window
	hideHandler() {
		console.log("hideHandler in dataRequestsForYou is called");
		this.setState({ showDetails: false, active_proposal: {}});
	}

	submitHandler(response) {
		console.log("submitHandler in dataRequestsForYou is called");
		this.setState({ showDetails: false, active_proposal: {}});
		if(response.message == "success") {
			this.setState({
				successMessage: "Your response is updated successfully"
			});
		} else {
			this.setState({
				failureMessage: response.error
			});
		}
		// setInterval($.ajax({
		// 	url: twinUrl + "dataRequestsForYou/" + localStorage.getItem("pubKey"),
		// 	dataType: 'json',
		// 	cache: false,
		// 	success: function(result) {
		// 		if(typeof(result) != "object"){
		// 			var data = JSON.parse(result);
		// 		} else
		// 			var data = result;
		// 		this.setState({requestsForYou: data});
		// 	}.bind(this)
		// }), 2000);
	}

	getDateFormat(timestamp){
		var d = new Date(timestamp);
		return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
	}

	componentDidMount(){
		$.ajax({
			url: twinUrl + "dataRequestsForYou/" + localStorage.getItem("pubKey"),
			dataType: 'json',
			cache: false,
			success: function(result) {
				if(typeof(result) != "object"){
					var data = JSON.parse(result);
				} else
					var data = result;
				this.setState({requestsForYou: data});
			}.bind(this)
		});
	}

	render(){
		var _that = this;
		var tableStyle = {tableLayout: "fixed"};
		var proposalIdStyle = {width : "80%", overflow:"hidden"};
		var proposalDetailsStyle = {width : "20%"};
		var buttonStyle = {width : "15%"};
		return(
			<div id="container">
				{this.state.successMessage ? <div className="alert alert-success alert-dismissable">
					<a href="#" className="close" data-dismiss="alert" aria-label="close">&times;</a>
				  <strong>Success!</strong> {this.state.successMessage}
				</div> : null}
				{this.state.failureMessage ? <div className="alert alert-danger">
				  <strong>Error!</strong> {this.state.failureMessage}
				</div> : null}
				<h3>Data Requests Submitted To You</h3> <hr/>
				<table className="table table-striped" style={tableStyle}>
					<thead>
						<tr>
							<th style={proposalIdStyle}></th>
							<th style={proposalDetailsStyle}></th>
						</tr>
					</thead>
					<tbody>
					{(()=>{
						if($.isArray(this.state.requestsForYou) && this.state.requestsForYou.length == 0 ) {
							return (
								<tr>
									<td colSpan="2">
										<p>No Data Requests submitted to you</p>
									</td>
								</tr>
							);
						}
						else {
							return this.state.requestsForYou.map(function(proposal) {
								var proposalId = Object.keys(proposal)[0];
								return (
									<tr key={proposalId}>
										<td style={proposalIdStyle}>
											<h4><b>mydietserver.com</b></h4>
												<div><b>Proposal ID</b>: {proposalId}</div>
												<div><b>Dimension(s): </b><Dimension dimension={proposal[proposalId].dimension}/>&nbsp;<span className="alert-warning badge">{dmConfig.proposalStatusToShow[proposal[proposalId].status]}</span></div>
										</td>
										<td style={{"vertical-align":"middle","text-align":"center"}}>
											<button type="button" className="btn btn-primary"onClick={() => this.modalOpenHandler(proposal, proposalId)}>
												View
											</button>
										</td>
									</tr>
								);
							}, this);
						}
					})(this)}
					</tbody>
				</table>
				{this.state.showDetails ? <Modal hideHandler={this.hideHandler} proposal={this.state.active_proposal} submitHandler={this.submitHandler} proposalId={Object.keys(this.state.active_proposal)[0]}/> : null}
			</div>
		)
	}
};
export default DataRequestsForYou;
