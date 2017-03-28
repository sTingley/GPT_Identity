'use strict';
const util = require('util');
var Abi = require('./AbiManager.js');
var dmConfig = require('./config.json');

module.exports = function(){

  var __construct = function(that) {
     that._super = new Abi({
       'contract': 'Broker',
       "abi_file_path": "../contracts/abi/",
       "epm_file_path": "../contracts/jobs_output.json"
     });
     that.brokerContract = that._super.getContractInstance();
  }(this)

  var proposalStatus = dmConfig.proposalStatus;
  //Get the proposalId and submits the proposals
  //Calls setProposalData function
  this.submitProposal = function (formdata, callback) {
    var proposalId;
    var sync = true;
    var errorFromGetProposalId;
    var setProposalDataResult;

    // get a new proposalId from broker contract
    this.brokerContract.getProposalId(function (error, result) {
      if (error) {
        console.log("getProposalId error:",error);
        sync = false;
        errorFromGetProposalId = error;
      }
      else {
        proposalId = result;
        sync = false;
        console.log("proposalId is: " + result);
      }
    }); // end of callback of getProposalId
    while (sync) { require('deasync').sleep(100); }

    // set the proposal values if proposalId is created properly
    if(errorFromGetProposalId) {
      callback(errorFromGetProposalId,proposalId);
    }
    else {
      setProposalDataResult = this.setProposalData(proposalId, formdata);
      if(setProposalDataResult) {
        callback(null, proposalId);
      }
    }

  }; //end of submitProposal function

  //sets the proposal in the proposalId
  this.setProposalData = function (proposalId, formdata, callback) {
    var sync = true;
    var errorFromSetProposalData;
    var setProposalDataResult;
    // console.log("formdata ==>", formdata);
    this.brokerContract.setProposalData(
      proposalId,
      formdata.requesterPubkey,
      formdata.requesterAlias,
      formdata.ownerPubkey,
      formdata.ownerAlias,
      formdata.dimension,
      formdata.suggestedPrice,
      function(error, result) {
        if (error) {
          sync = false;
          errorFromSetProposalData = error;
          console.log("errorFromContract:",errorFromContract);
        }
        else {
          setProposalDataResult = result;
          sync = false;
          console.log("Proposal Values set successfully", result);
        }
      } // end of contract callback
    ); // end of setProposalData
    while (sync) { require('deasync').sleep(100); }
    return setProposalDataResult;
  }

  //verifies if the proposalId is present in the contract
  this.getProposalData = function (proposalId, callback) {

      var sync = true;
      var errorFromContract;
      var proposalData = {};
      this.brokerContract.getPendingWith(proposalId, function(error, result) {
        if (error) {
          sync = false;
          errorFromContract = error;
          console.log("errorFromContract:",errorFromContract);
        }
        else {
          proposalData.pendingWith = result;
          sync = false;
        }
      });
      while (sync) { require('deasync').sleep(100); }


      sync = true;
      this.brokerContract.getProposalData(proposalId,function (error, result) {
        if (error) {
          sync = false;
          errorFromContract = error;
          console.log("errorFromContract:",errorFromContract);
        }
        else {
          sync = false;
          if(result[8] == true) {
            proposalData.requesterPubkey = result[0];
            proposalData.requesterAlias = result[1];
            proposalData.ownerPubkey = result[2];
            proposalData.ownerAlias = result[3];
            proposalData.dimension = result[4]
            proposalData.requesterSuggestedPrice = result[5].c[0];
            proposalData.status = proposalStatus[result[6]];
            proposalData.counteredPrice = result[7].c[0];
            console.log(proposalData);
          }
          else {
            errorFromContract = "invalid proposal id given";
            proposalData = null;
          }
        }
      }); // end of callback

      while (sync) { require('deasync').sleep(100); }

      callback(errorFromContract, proposalData);
  }; //end of submitProposal function

  this.updateOwnerResponse = function(formdata, callback) {
    var sync = true;
    var proposalId = formdata.proposalId,
        responseStatusCode = formdata.responseStatusCode,
        counteredPrice = formdata.counteredPrice;

    var errorFromUpdateOwnerResponse, resultFromUpdateOwnerResponse;

    this.brokerContract.updateOwnerResponse(proposalId,responseStatusCode, counteredPrice, function (error, result) {
      if (error) {
        sync = false;
        errorFromUpdateOwnerResponse = error;
        console.log("errorFromContract:",errorFromContract);
      }
      else {
        sync = false;
        resultFromUpdateOwnerResponse = result;
      }
    }); // end of callback

    while (sync) { require('deasync').sleep(100); }
    callback(errorFromUpdateOwnerResponse, resultFromUpdateOwnerResponse);
  } // end of updateOwnerResponse function of dataBroker object

  this.updateProposal = function(formdata, callback) {
    var sync = true;
    var proposalId = formdata.proposalId,
        suggestedPrice = formdata.requesterSuggestedPrice,
        responseStatusCode = formdata.responseStatusCode;

    var errorFromUpdateProposal, resultFromUpdateProposal;
    this.brokerContract.updateProposal(proposalId, suggestedPrice, responseStatusCode, function (error, result) {
      if (error) {
        sync = false;
        errorFromUpdateProposal = error;
        console.log("errorFromContract:",errorFromContract);
      }
      else {
        sync = false;
        resultFromUpdateProposal = result;
      }
    }); // end of callback

    while (sync) { require('deasync').sleep(100); }
    callback(errorFromUpdateProposal, resultFromUpdateProposal);
  } // end of updateOwnerResponse function of dataBroker object

}; //end of dataBroker object
