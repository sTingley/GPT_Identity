import React from 'react';
import dmConfig from '../dm_config.json';

class PaymentModal extends React.Component {

	constructor(props) {
		super(props);
		this.pubKey = localStorage.getItem("pubKey");
		this.privKey = localStorage.getItem("privKey");
		this.state = {
      proposalId : props.proposalId || null,
			proposal: props.proposal[props.proposalId] || {},
			requester_suggested_price : props.proposal[props.proposalId].requesterSuggestedPrice,
			countered_price : props.proposal[props.proposalId].counteredPrice,
		};
	}

	componentDidMount() {
		$("#proposalDetails").modal('show');
		$("#proposalDetails").on('hidden.bs.modal', this.props.hideHandler);

    var currentRole;
    var nextActions;
    var requesterSuggestedPriceDisabled = true;
    var counteredPriceDisabled = true;

    var proposalData = this.state.proposal;
    if (localStorage.getItem("pubKey") === proposalData.requesterPubkey) {
      currentRole = dmConfig.roles.requester;
      if (dmConfig.proposalActions[proposalData.status] &&  dmConfig.proposalActions[proposalData.status].actor === currentRole) {
        nextActions = dmConfig.proposalActions[proposalData.status].actions;
        requesterSuggestedPriceDisabled = false;
      }
    }
    else if (localStorage.getItem("pubKey") === proposalData.ownerPubkey) {
      currentRole = dmConfig.roles.owner;
      if (dmConfig.proposalActions[proposalData.status] && dmConfig.proposalActions[proposalData.status].actor === currentRole) {
        nextActions = dmConfig.proposalActions[proposalData.status].actions;
        counteredPriceDisabled = false;
      }
    }
    this.setState({
      current_role : currentRole,
      next_actions : nextActions,
      requester_suggested_price_disabled : requesterSuggestedPriceDisabled,
      countered_price_disabled : counteredPriceDisabled
    });
		var theTime = (new Date()).toString();
	}

	prepareJsonToSubmit(buttonName) {
    console.log("e.target ",buttonName.value);
    console.log("dmConfig.proposalStatusToCode[buttonName.value] ", dmConfig.proposalStatusToCode[buttonName.value]);
    console.log("countered_price", $("#countered_price").val());
    var objectToSubmit = {
      proposalId : this.props.proposalId,
      responseStatusCode : dmConfig.proposalStatusToCode[buttonName.value]
    }
    if (this.state.current_role == dmConfig.roles.owner) {
      objectToSubmit.counteredPrice = $("#countered_price").val();
    } else if (this.state.current_role == dmConfig.roles.requester) {
      objectToSubmit.requesterSuggestedPrice = $('#requester_suggested_price').val();
    }
    return objectToSubmit;
  }

  submitResponse(e){
		var _this = this;
		e.preventDefault();
		var json = this.prepareJsonToSubmit(e.target);
		console.log("json ",json);
    var submitPath;
    if (this.state.current_role == dmConfig.roles.owner) {
      submitPath = dmConfig.endpoints.ownerResponse;
    } else if (this.state.current_role == dmConfig.roles.requester) {
      submitPath = dmConfig.endpoints.requesterResponse;
    }
		$.ajax({
			url: twinUrl + submitPath,
			type: 'POST',
			data: json,
			success: function(res){
        console.log(JSON.stringify(res));
				_this.props.submitHandler(res);
			}
		});
	}

	render() {

    var buttonStyle = {
      marginRight : "20px"
    };

    return (
      <div className="modal fade" id="proposalDetails" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
	       <div className="modal-dialog modal-lg" role="document">
           <div className="modal-content">
						<div className="modal-header">
              <h4 className="modal-title" id="myModalLabel">Payment Confirmation</h4>
            </div>

            <div className="modal-body">

              <form className="form-horizontal">
                <div className="form-group">
                  <label className="control-label col-lg-4 col-md-4  col-sm-12" >Your Agreed Price For This Data Request:</label>
									<p className="col-lg-8 col-md-8  col-sm-12 form-control-static">{this.state.requester_suggested_price + " BTC"}</p>
                </div>
                <div className="form-group">
                  <input className="form-control" ref="signature" type="hidden" value={this.state.signature} />
                  <input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              { this.state.next_actions ?
                (()=> { return this.state.next_actions.map(function(el,i) {
                    return (
                      <button key={i} className="btn btn-primary" style={buttonStyle} value={el.nextStatus} type="button" onClick={this.submitResponse.bind(this)} data-dismiss="modal" aria-hidden="true">{el.actionName}</button>
                    );
                  }, this);
                })(this)
              :null}
              <button className="btn btn-default" style={buttonStyle} value="close" type="button" onClick={this.props.hideHandler} data-dismiss="modal" aria-hidden="true">Close</button>
            </div>
          </div>
        </div>
      </div>
		);
	}
}
//<DimensionCreationForm handleHideModal={this.handleHideModal} />
PaymentModal.propTypes = {
	hideHandler: React.PropTypes.func.isRequired,	// hideHandler method must exists in parent component
	submitHandler: React.PropTypes.func.isRequired
};

export default PaymentModal;
