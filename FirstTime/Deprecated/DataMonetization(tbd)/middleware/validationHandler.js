'use strict';
const util = require('util');
var Abi = require('./AbiManager.js');
var deasync = require('deasync');
var secp256k1 = require('secp256k1');


module.exports = function(formdata){

  this.requested_data = {};

  var __construct = function(that) {
     that._super = new Abi({
       'contract': 'deployStorageK'
     });
     that.requested_data = formdata;
     that.contract = that._super.getContractInstance();
     that.owner_address = that._super.accountAddress();
  }(this)

  this.validate = function(callback){

    var publickey = this.requested_data.requester_publickey,
        msghash = this.requested_data.requester_msghash,
        signature = this.requested_data.requester_signature;
    var _this = this;

    this.contract.verifySignature(msghash, signature, publickey, function (error, result) {
        if(result == true){
          var state = _this.verify(msghash, signature, publickey);
          if(state == true){
            var data = _this.getCOID(_this.requested_data.requester_txnid) || {};
            callback.call(this,[data]);
          }
        }
    });

  }

  this.verify = function(msg, signature, pubKey) {
      msg = new Buffer(msg, "hex");
      signature = new Buffer(signature, "hex");
      pubKey = new Buffer(pubKey, "hex");
      var verified = secp256k1.verify(msg, signature, pubKey)
      return verified;
  }

  this.getCOID = function(txnID){
    var dataset = require('./bigchain.json');
    if(dataset.length > 0){
      for(var i=0; i<dataset.length; i++){
        if(dataset[i].id){
          if(dataset[i].id == txnID){
            return dataset[i];
            break;
          }
        }
      }
    }
  }

}
