import React from 'react';
import dmConfig from '../dm_config.json';

class Download extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            download_url: props.download_url
        };
    }
    render() {
        return (
            <a href={this.state.download_url} download="Download" name="download_button" className="btn btn-primary btn-block">Download Retrieved Contents</a>
        );
    }
};

class AssetRetrievalModal extends React.Component {

    constructor(props) {
        super(props);
        this.pubKey = localStorage.getItem("pubKey");
        this.privKey = localStorage.getItem("privKey");
        this.state = {
            proposal: props.proposal[props.proposalId] || {},
            token: props.proposal[props.proposalId].token
        };
        this.downloadHandler = this.downloadHandler.bind(this);
    }

    downloadHandler() {
        console.log("Asset Downloaded successfully");
    }

    componentDidMount() {
        $("#proposalDetails").modal('show');
        $("#proposalDetails").on('hidden.bs.modal', this.props.hideHandler);
        var currentRole;
        var nextActions;
        var proposalData = this.state.proposal;
        if (localStorage.getItem("pubKey") === proposalData.requesterPubkey) {
            currentRole = dmConfig.roles.requester;
            if (dmConfig.proposalActions[proposalData.status] && dmConfig.proposalActions[proposalData.status].actor === currentRole) {
                nextActions = dmConfig.proposalActions[proposalData.status].actions;
            }
        } else if (localStorage.getItem("pubKey") === proposalData.ownerPubkey) {
            currentRole = dmConfig.roles.owner;
            if (dmConfig.proposalActions[proposalData.status] && dmConfig.proposalActions[proposalData.status].actor === currentRole) {
                nextActions = dmConfig.proposalActions[proposalData.status].actions;
            }
        }
        this.setState({current_role: currentRole, next_actions: nextActions});
        var theTime = (new Date()).toString();
    }

    prepareJsonToSubmit(buttonName) {
        console.log("e.target ", buttonName.value);
        console.log("dmConfig.proposalStatusToCode[buttonName.value] ", dmConfig.proposalStatusToCode[buttonName.value]);
        var objectToSubmit = {
            proposalId: this.props.proposalId,
            responseStatusCode: dmConfig.proposalStatusToCode[buttonName.value]
        }
        return objectToSubmit;
    }

    submitResponse(e) {
        var _this = this;
        e.preventDefault();
        var isAssetRetrivalAction;
        if (e.target.value == "transferCompleted") {
            isAssetRetrivalAction = true;
        }
        var json = this.prepareJsonToSubmit(e.target);
        var submitPath = dmConfig.endpoints.retriveAssets;
        $.getJSON(twinUrl+submitPath+"/"+this.state.token, function(res){
          if (isAssetRetrivalAction == true) {
              if(res.status === "False"){
                alert(res.error);
              } else {
                var json = JSON.stringify(res);
                var blob = new Blob([json], {type: "application/json"});
                _this.setState({downloadReady: true, downloadUrl: URL.createObjectURL(blob)});
              }
            } else {
                _this.props.submitHandler();
            }
        });
        // $.ajax({
        //     url: twinUrl + submitPath,
        //     type: 'POST',
        //     data: json,
        //     success: function(res) {
        //         console.log(JSON.stringify(res));
        //         if (isAssetRetrivalAction == true) {
        //             console.log("inside isAssetRetrivalAction condn");
        //             var json = JSON.stringify(res);
        //             var blob = new Blob([json], {type: "application/json"});
        //             _this.setState({downloadReady: true, downloadUrl: URL.createObjectURL(blob)});
        //         } else {
        //             console.log("else ");
        //             _this.props.submitHandler();
        //         }
        //
        //     }
        // });
    }

    render() {

        var buttonStyle = {
            marginRight: "20px"
        };

        return (
            <div className="modal fade" id="proposalDetails" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                <div className="modal-dialog modal-lg" role="document">
                    {this.state.downloadReady
                        ? <div className="modal-content">
                                <div className="modal-header">
                                    <h4 className="modal-title" id="myModalLabel">Download</h4>
                                </div>
                                <div className="modal-body">
                                    <Download download_url={this.state.downloadUrl} download_handler={this.downloadHandler}/>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-default" style={buttonStyle} value="close" type="button" onClick={this.props.hideHandler} data-dismiss="modal" aria-hidden="true">Close</button>
                                </div>
                            </div>
                        : <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title" id="myModalLabel">Data Retrieval Confirmation</h4>
                            </div>

                            <div className="modal-body">
                                Clicking "Retrieve Data" button will generate a link to download the requested data {/*<form className="form-horizontal">
                                        <div className="form-group">
                                            <label className="control-label col-lg-4 col-md-4  col-sm-12">Requester Suggested Price:</label>
                                            <p className="col-lg-8 col-md-8  col-sm-12 form-control-static">{this.state.requester_suggested_price}</p>
                                        </div>
                                        <div className="form-group">
                                            <input className="form-control" ref="signature" type="hidden" value={this.state.signature}/>
                                            <input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")}/>
                                        </div>
                                    </form>*/}
                            </div>
                            <div className="modal-footer">
                                {this.state.next_actions
                                    ? (() => {
                                        return this.state.next_actions.map(function(el, i) {
                                            return (
                                                <button key={i} className="btn btn-primary" style={buttonStyle} value={el.nextStatus} type="button" onClick={this.submitResponse.bind(this)} aria-hidden="true">{el.actionName}</button>
                                            );
                                        }, this);
                                    })(this)
                                    : null}
                                <button className="btn btn-default" style={buttonStyle} value="close" type="button" onClick={this.props.hideHandler} data-dismiss="modal" aria-hidden="true">Close</button>
                            </div>
                        </div>
}

                </div>
            </div>
        );
    }
}
//<DimensionCreationForm handleHideModal={this.handleHideModal} />
AssetRetrievalModal.propTypes = {
    hideHandler: React.PropTypes.func.isRequired, // hideHandler method must exists in parent component
    submitHandler: React.PropTypes.func.isRequired
};

export default AssetRetrievalModal;
