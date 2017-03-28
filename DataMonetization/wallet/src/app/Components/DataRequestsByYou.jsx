import React from 'react';
import {Link} from 'react-router';
import ProposalModal from './ProposalModal.jsx';
import AssetRetrievalModal from './AssetRetrievalModal.jsx';
import PaymentModal from './PaymentModal.jsx';
import dmConfig from '../dm_config.json';

class Dimension extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dimension: ""
        }
    }
    componentDidMount() {
        $.ajax({
            url: dmConfig.mongodb_url + "getTitles/" + this.props.dimension,
            dataType: 'json',
            cache: false,
            success: function(result) {
                console.log
                this.setState({dimension: result[0].categories});
            }.bind(this)
        });
    }
    render() {
        return (
            <span>
                {this.state.dimension
                    ? ((dimension) => {
                        var dimensionToDisplay = ""
                        for (var index = 0; index < dimension.length; index++) {
                            if (index < dimension.length - 1) {
                                dimensionToDisplay = dimensionToDisplay + dimension[index] + ", ";
                            } else {
                                dimensionToDisplay = dimensionToDisplay + dimension[index];
                            }
                        }
                        return dimensionToDisplay;
                    })(this.state.dimension)
                    : null}
            </span>
        );
    }
}

class DataRequestsByYou extends React.Component {
    constructor(props) {
        super(props);
        //coid=proposals
        this.state = {
            requestsByYou: [],
            showDetails: false
        };
        this.modalOpenHandler = this.modalOpenHandler.bind(this);
        this.hideHandler = this.hideHandler.bind(this);
        this.submitHandler = this.submitHandler.bind(this);
    }

    modalOpenHandler(proposal, proposalId) {
        if (proposalId) {
            var modalNameFromConfig = dmConfig.proposalActions[proposal[proposalId].status].modalName;
            this.setState({showDetails: true, active_proposal: proposal, modalName: modalNameFromConfig});
        }
    }

    // Close Asset Details Window
    hideHandler() {
        this.setState({showDetails: false, active_proposal: {}});
    }

    submitHandler(response) {
        this.setState({showDetails: false, active_proposal: {}});
        if (response.result == "success") {
            this.setState({successMessage: " Your Request has been processed successfully"});
        } else {
            this.setState({failureMessage: response.message});
        }
    }

    getDateFormat(timestamp) {
        var d = new Date(timestamp);
        return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    }

    componentDidMount() {
        $.ajax({
            url: twinUrl + "dataRequestsByYou/" + localStorage.getItem("pubKey"),
            dataType: 'json',
            cache: false,
            success: function(result) {
                if (typeof(result) != "object") {
                    var data = JSON.parse(result);
                } else {
                    var data = result;
                }
                this.setState({requestsByYou: data});
            }.bind(this)
        });
    }

    render() {
        var _that = this;
        return (
            <div id="container">
                {this.state.successMessage
                    ? <div className="alert alert-success alert-dismissable">
                            <a href="#" className="close" data-dismiss="alert" aria-label="close">&times;</a>
                            <strong>Success!</strong>
                            {this.state.successMessage}
                        </div>
                    : null}
                {this.state.failureMessage
                    ? <div className="alert alert-danger">
                            <strong>Error!</strong>
                            {this.state.failureMessage}
                        </div>
                    : null}

                <h3>Data Requests Submitted by You</h3>
                <hr/>
								<div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
									{(() => {
                    if ($.isArray(this.state.requestsByYou) && this.state.requestsByYou.length == 0) {
                        return (
                            <p>No Data Found</p>
                        );
                    } else {
											  return this.state.requestsByYou.map(function(proposal) {
                            var proposalId = Object.keys(proposal)[0];
														var d = new Date(parseInt(proposal[proposalId].updatedTime));
														var humanDate = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
														var isFullfilled = (proposal[proposalId].status == "paid") ? "Completed" : proposal[proposalId].status;
                            var hasToken =  ("token" in proposal[proposalId]) ? proposal[proposalId].token : "";
                            return (
                                <div key={proposalId} className="panel panel-default">
                                    <div className="panel-heading">
																			<h4 className="colp_title">
																				<a role="button" data-toggle="collapse" data-parent="#accordion" href={"#"+proposalId} aria-expanded="true" aria-controls="collapseOne">
																					{proposal[proposalId].requesterAlias}
																				</a>
																				<span className="alert-success badge">{isFullfilled}</span>&nbsp;&nbsp;
																				<span className="alert-warning badge">${proposal[proposalId].requesterSuggestedPrice}</span>
																			</h4>
																			<span className="small_txt">{proposal[proposalId].dimension}</span>
																			<span className="pull-right">{humanDate}</span>
                                    </div>
																		<div id={proposalId} className="panel-collapse collapse">
                                        <div className="panel-body" id={proposalId}>
																						<div className="col-md-4">
																							<ol className="list-group vertical-steps">
																									{((proposal) => {
																											var proposalStatus = proposal[proposalId].status;

																											return Object.keys(dmConfig.workflow).map((workflowState, i) => {
																													var workflowClassName = "";
																													// check if current workflow state is present in completed array from config
																													// else check if current workflow state is present in active array from config
																													if ($.inArray(workflowState, dmConfig.proposalActions[proposalStatus].workflowCompleted) > -1) {
																															workflowClassName = "completed"
																													} else if ($.inArray(workflowState, dmConfig.proposalActions[proposalStatus].workflowActive) > -1) {
																															workflowClassName = "active"
																													}
																													return (
																															<li key={i} className={"list-group-item " + workflowClassName}>
																																	<span>{dmConfig.workflow[workflowState]}</span>
																															</li>
																													)
																											})
																									})(proposal)}
																							</ol>
																						</div>
																						<div className="col-md-6">
																							<div className="row control-group">
																									<div className="col-lg-4 col-md-6 col-sm-12">
																											<label>Dimensions</label>
																									</div>
																									<div className="col-lg-8 col-md-6 col-sm-12"><Dimension dimension={proposal[proposalId].dimension}/></div>
																							</div>
																							<div className="row control-group">
																									<div className="col-lg-4 col-md-6 col-sm-12">
																											<label>Status</label>
																									</div>
																									<div className="col-lg-8 col-md-6 col-sm-12">{dmConfig.proposalStatusToShow[proposal[proposalId].status]}</div>
																							</div>
																							<div className="row control-group">
																									<div className="col-lg-4 col-md-6 col-sm-12">
																											<label>Proposal ID</label>
																									</div>
																									<div className="col-lg-8 col-md-6 col-sm-12 dm_keys">{proposalId}</div>
																							</div>
																							<div className="row control-group">
																									<div className="col-lg-4 col-md-6 col-sm-12">
																											<label>Owner ID</label>
																									</div>
																									<div className="col-lg-8 col-md-6 col-sm-12 dm_keys">{proposal[proposalId].ownerPubkey}</div>
																							</div>
                                              <div className="row control-group">
																									<div className="col-lg-4 col-md-6 col-sm-12">
																											<label>Asset Access Token</label>
																									</div>
																									<div className="col-lg-8 col-md-6 col-sm-12 dm_keys">{hasToken}</div>
																							</div>
																						</div>
																						<div className="col-md-2">
																							{dmConfig.proposalActions[proposal[proposalId].status].modalName
																									? <button type="button" className="btn btn-primary pull-right" onClick={() => this.modalOpenHandler(proposal, proposalId)}>View</button>
																									: ""}
																						</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }, this);
                    }
                })(this)}
								</div>
                {(() => {
                    if (this.state.showDetails === true) {
                        if (this.state.modalName === "ProposalModal") {
                            return (<ProposalModal hideHandler={this.hideHandler} submitHandler={this.submitHandler} proposal={this.state.active_proposal} proposalId={Object.keys(this.state.active_proposal)[0]}/>)
                        } else if (this.state.modalName === "PaymentModal") {
                            return (<PaymentModal hideHandler={this.hideHandler} submitHandler={this.submitHandler} proposal={this.state.active_proposal} proposalId={Object.keys(this.state.active_proposal)[0]}/>)
                        } else if (this.state.modalName === "AssetRetrievalModal") {
                            return (<AssetRetrievalModal hideHandler={this.hideHandler} submitHandler={this.submitHandler} proposal={this.state.active_proposal} proposalId={Object.keys(this.state.active_proposal)[0]}/>)
                        }
                    }

                })(this)}

                {/*this.state.showDetails ? <ProposalModal hideHandler={this.hideHandler} submitHandler={this.submitHandler} proposal={this.state.active_proposal} proposalId={Object.keys(this.state.active_proposal)[0]}/> : null*/}
            </div>
        )
    }
};
export default DataRequestsByYou;
