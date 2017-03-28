'use strict';
const util = require('util');
var Abi = require('./AbiManager.js');
var deasync = require('deasync');
var secp256k1 = require('secp256k1');


module.exports = function(formdata){

  this.requested_data = {};
  this.inProgress = 0;

  var __construct = function(that) {
     that._super = new Abi({
       'contract': 'deployStorageK'
     });
     that._super.test();
     that.requested_data = formdata;
     that.contract = that._super.getContractInstance();
     that.owner_address = that._super.accountAddress();
     that.contract.requestMade(function(err,hand){},function(err, event){
       console.log("sender address ==> ", event);
       if (that.inProgress == 0) {
           setTimeout(function() {
               that.onEvent();
           }, 100)
       }
     });

     that.contract.CallbackReady(function(err,hand){},function(err, event){
       if (that.inProgress == 0) {
           setTimeout(function() {
               that.onEvent();
           }, 100)
       }
     });

  }(this)

  this.validate = function(){

    var publickey = this.requested_data.requester_publickey,
        msghash = this.requested_data.requester_msghash,
        signature = this.requested_data.requester_signature;
    var _this = this;
    var sync = true,
        isValidResult = false;

    _this.contract.VerificationQuery(msghash, signature, publickey, function (error, result) {
        console.log("Contract address ----", _this.owner_address);
        var elEvento;
        _this.contract.CallbackReady(function (error, result) { elEvento = result; }, function (error, result) {
            if ( _this.prop.accountAddress() = result.args.addr) {
                _this.contract.myCallback(function (error, result) {
                    elEvento.stop();
                    console.log("Received response from VerifyIt :" + result + "...if that says false, you should not be able to Result0,etc.!!!");
                    isValidResult = result;
                    sync = false;
                })//end myCallback
            }
        })  //end CallbackReady.once
    })//end VerificationQuery
    while (sync) { require('deasync').sleep(100); }
    return isValidResult;
  }

  this.onEvent = function() {
      console.log("into onEvent method....");
      var that = this;
      this.contract.listIsEmpty(function(error, result) {
          var emptyList = result;
          console.log("contract list ------> ",emptyList);
          if (emptyList == false) {
              that.inProgress = 1;
              that.contract.getCurrentInList(function(error, result) {
                  var queryAddr = result;
                  console.log(queryAddr + " is current in list");
                  that.contract.getRequestByAddress(queryAddr, function(error, result) {
                      var msg = "";
                      var signature = "";
                      var pubKey = "";
                      var elResulto = result.toString().split(",");
                      msg = elResulto[0];
                      signature = elResulto[1];
                      pubKey = elResulto[2];
                      console.log("msg: " + msg);
                      console.log("sig: " + signature);
                      console.log("pubKey: " + pubKey);
                      //where the response will be stored
                      var theResponse = that.verify(msg, signature, pubKey).toString();
                      console.log("response is: " + theResponse);
                      console.log("query addr is: " + queryAddr);
                      that.contract.setCurrentInList(queryAddr, theResponse, function(error) {
                          that.inProgress = 0;
                      });
                  });
              });
          }
      });

  }

  this.verify = function(msg, signature, pubKey) {
      //INPUT msg: This is a hex string of the message hash from wallet
      //INPUT signature: This is a hex string of the signature from wallet
      //INPUT pubKey: This is a hex string of the public key from wallet

      //convert all to buffers:
      msg = new Buffer(msg, "hex");
      signature = new Buffer(signature, "hex");
      pubKey = new Buffer(pubKey, "hex");
      var verified = secp256k1.verify(msg, signature, pubKey)
      return verified;

  }

}
