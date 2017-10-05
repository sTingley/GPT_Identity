'use strict';
const util = require('util');
var Abi = require('./AbiManager.js');
var sha3 = require('solidity-sha3');

module.exports = function(){

  var __construct = function(that) {
     that._super = new Abi({
       'contract': 'daoContract'
     });
     that.contract = that._super.getContractInstance();
  }(this)

  this.getDAOValidators = function(callback){
    this.contract.getList(function (error, result) {
        if (error) { throw error }
        callback.call(this,[result]);
    });
  }

  this.filterDaoValidators = function(arr){
    var validators = [];
    arr.map(function(data){
      var matcher = /^(?![0-9]*$)[a-zA-Z0-9]+$/g
      if(matcher.test(data)){
          validators.push(data);
      }
    });
    return validators;
  }

  this.flushEmpty = function(arr){
    var newArray = [];
    var len = arr.length;
    if(len > 0){
      for(var i=0; i<len; i++){
        var flushed = arr[i].filter(function(v){ return v!=='' });
        if(flushed.length > 0) newArray.push(flushed);
      }
    }
    return newArray;
  }

  this.validate = function(coid, callback){
    var _this = this;
    for(var i=0; i<coid.length; i++){
      var resultset = [];
      (function(coidEle, index){
        _this.contract.isExist(coidEle, function(err, result){
          resultset.push(result);
          if(coid.length - 1 <= index){
            callback.call(null,resultset);
          }
        });
      })(coid[i][1], i);
    }
  }

  this.validateValidators = function(daoValidators, coidValidators, callback){
    var status = true;
    var coid = this.flushEmpty(coidValidators);
    var results = this.validate(coid, function(results){
      if(results.indexOf(false) >= 0){
        callback.call(null, false);
      } else callback.call(null, true);
    });
  }

}
