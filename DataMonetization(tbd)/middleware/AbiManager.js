'use strict';

var erisContracts = require('eris-contracts');
var config = require('./config.json');
var fs = require('fs');
var edb = require('eris-db');

module.exports = function(props) {
    this.props = props;

    this.mergeObj = function(obj1, obj2) {
        return Object.assign(obj1,obj2);
    }

    var __construct = function(that) {
       that.prop = that.mergeObj(config, that.props);
       if (that.prop.contract == "") {
           console.warn("Contract should be filled");
       }
    }(this)

    this.getEpmData = function() {
        return require(this.prop.epm_file_path);
    }

    this.erisdb = function(){
      return edb.createInstance(this.prop.eris_db_url);
    }

    this.getContractAddress = function() {
        return this.getEpmData()[this.prop.contract];
    }

    this.getAbi = function() {
        return JSON.parse(fs.readFileSync(this.prop.abi_file_path + this.getContractAddress(),'utf8'));
    }

    this.getAccounts = function() {
        return require(this.prop.accounts_file_path);
    }

    this.getContractMgr = function() {
        return erisContracts.newContractManagerDev(this.prop.eris_db_url, this.getAccounts()[this.prop.chain+"_full_000"]);
    }

    this.test = function(){
      console.log("testing,.......=>", this.erisdb().accounts())
    }

    this.accountAddress = function(){
      var data = require(this.prop.accounts_file_path);
      return data[this.prop.chain+"_full_000"].address;
    }

    this.getContractInstance = function() {
        var contractScope = this.getContractMgr().newContractFactory(this.getAbi()).at(this.getContractAddress());
        if (typeof contractScope !== 'object') console.warn("contract instance not created properly");
        return contractScope;
    }
};
