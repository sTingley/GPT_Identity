'use strict';
const util = require('util');
var Abi = require('./AbiManager.js');
var dmConfig = require("./config.json");
var superagentRequest = require("superagent");

module.exports = function() {

    var __construct = function(that) {
        that._super = new Abi({
            'contract': 'Broker',
            "abi_file_path": "../contracts/abi/",
            "epm_file_path": "../contracts/jobs_output.json"
        });
        that.brokerContract = that._super.getContractInstance();
    }(this)

    var _this = this;
    var proposalStatus = dmConfig.proposalStatus;

    this.sendHttpPostToDigitalTwin = function(relativeUrl, inputs) {
        console.log(dmConfig.digital_twin_url + relativeUrl);
        superagentRequest.post(dmConfig.digital_twin_url + relativeUrl)
            .send(inputs)
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("HTTP post request sent to Digital Twin");
                }
            });
    };
    // Proposal Notification handler
    this.handleProposalNotification = function(proposalData) {
        var _this = this;
        console.log("handleProposalNotification - current status ", proposalData.status);
        //send a http post request to digital twin of data owner
        _this.sendHttpPostToDigitalTwin(dmConfig.twinEndpoints.requestsForYou + "/" + proposalData.ownerPubkey, proposalData);
        //send a http post request to digital twin of data requester
        _this.sendHttpPostToDigitalTwin(dmConfig.twinEndpoints.requestsByYou + "/" + proposalData.requesterPubkey, proposalData);
    }

    this.initEvets = function() {
        var _this = this;
        this.brokerContract.notifyRequesterAndOwner(function(error) {
            if (error)
                console.log("error on initiating event");
        }, function(error, result) {
            // console.log("notifyRequesterAndOwner event triggered");
            if (error) {
                console.log("error from notifyRequesterAndOwner event", error);
            } else {
                var proposalId = "00".concat(result.args.proposalId);
                console.log(proposalId);
                var sync = true;
                var errorFromContract;
                var proposalData = {
                    "proposalId": proposalId
                };
                _this.brokerContract.getPendingWith(proposalId, function(error, result) {
                    if (error) {
                        errorFromContract = error;
                        console.log("errorFromContract:", errorFromContract);
                    } else {
                        proposalData.pendingWith = result;
                        sync = false;
                    }
                });
                while (sync) {
                    require('deasync').sleep(100);
                }

                sync = true;

                _this.brokerContract.getProposalData(proposalId, function(error, result) {
                    if (error) {
                        sync = false;
                        errorFromContract = error;
                        console.log("errorFromContract:", errorFromContract);
                    } else {
                        sync = false;
                        if (result[8] == true) {
                            proposalData.requesterPubkey = result[0];
                            proposalData.requesterAlias = result[1]
                            proposalData.ownerPubkey = result[2];
                            proposalData.ownerAlias = result[3];
                            proposalData.dimension = result[4]
                            proposalData.requesterSuggestedPrice = result[5].c[0];
                            proposalData.status = proposalStatus[result[6]];
                            proposalData.counteredPrice = result[7].c[0];
                        } else {
                            errorFromContract = "invalid proposal id given";
                            proposalData = null;
                        }
                        _this.handleProposalNotification(proposalData);
                    }
                }); // end of callback
            }
        });
    }
}
