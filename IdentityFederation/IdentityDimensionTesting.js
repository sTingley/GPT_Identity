'use strict'

//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256

//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')

//this is for sending a notification for superagent
var superAgent = require("superagent");

//required library for accessing the contract
var erisC = require('eris-contracts');




var IdentityDimensionControl = function(contractAddress)
{

    //get the contract:
    this.chain = 'primaryAccount'
    this.erisdburl = chainConfig.chainURL
    this.contractData = require('./epm.json')
    var contractAddr = contractAddress
    console.log("contract addr: " + contractAddr)
    this.contractAbiAddress = this.contractData['IdentityDimensionControl'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

    var self = this;

    this.testing = function(val,callback)
    {
        self.contract.testing(val, function(error,result)
        {
                callback(error,result);
        })
    }

    //first function:
    this.Instantiation = function(formdata,callback)
    {

        var pubKey = formdata.pubKey;
        var coidAddr = formdata.coidAddr;
        console.log("SHA3 of PUBKEY: " + keccak_256(pubKey));

        self.contract.IdentityDimensionControlInstantiation(coidAddr, function(error,result)
        {
            callback(error,result);
        })
    }





    //result is boolean success from the contract
    this.CreateDimension = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var uniqueID = formdata.uniqueID;
        var typeInput = formdata.typeInput;
        var flag = formdata.flag;

        self.contract.CreateDimension(pubKey,uniqueID,typeInput,flag,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is boolean success from the contract
    this.RemoveDimension = function(formdata,callback)
    {
        var caller = formdata.caller;
        var descriptor = formdata.descriptor;
        var ID = formdata.ID;

        self.contract.RemoveDimension(caller,descriptor,ID, function(error,result)
        {
            callback(error,result);
        })
    }

    //result is boolean success from the contract
    this.changeDescriptor = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var oldDescriptor = formdata.oldDescriptor;
        var newDescriptor = formdata.newDescriptor;

        //SHOULD BE UPDATE ENTRY????????
        self.contract.changeDescriptor(pubKey, type, ID, oldDescriptor, newDescriptor, function (error,result)
        {
            callback(error,result);
        })
    }

    //result is the boolean success from the contract
    this.addEntry = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var attribute = formdata.attribute;
        var descriptor = formdata.descriptor;
        var flag = formdata.flag;

        self.contract.addEntry(pubKey,type,ID,attribute,descriptor,flag,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is the boolean success from the contract
    this.removeEntry = function(formdata,callback)
    {
         var pubKey = formdata.pubKey;
         var type = formdata.type;
         var ID = formdata.ID;
         var descriptor = formdata.descriptor;

         self.contract.removeEntry(pubKey,type,ID,descriptor,function(error,result)
         {
             callback(error,result);
         })
    }


    //result is the boolean success from the contract
    this.updateEntry = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;
        var attribute = formdata.attribute;
        var flag = formdata.flag;

        self.contract.updateEntry(pubKey,type,ID,descriptor,attribute,flag,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is a string which is the attribute of the entry
    this.readEntry = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;

        self.contract.readEntry(pubKey,type,ID,descriptor,function(error,result)
        {
            callback(error,result);
        })
    }


    //result is bytes32[100] of public descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPublicDescriptors = function(formdata,callback)
    {
        var type = formdata.type;
        var ID = formdata.ID;

        self.contract.getPublicDescriptors(type,ID,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is bytes32[100] of private descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPrivateDescriptors = function(formdata,callback)
    {
        var type = formdata.type;
        var ID = formdata.ID;

        self.contract.getPrivateDescriptors(type,ID,function(error,result)
        {
            callback(error,result);
        })
    }


    //result is the bool success
    this.delegate = function(formdata,callback)
    {
        var owner = formdata.owner;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var timeFrame = formdata.timeFrame;
        var accessCategories = formdata.accessCategories;

        self.contract.delegate(owner,delegatee,amount,dimesnion,timeFrame,accessCategories,function(error,result)
        {
            callback(error,result);
        })
    }

    //the result is the bool success
    this.addDelegation = function(formdata,callback)
    {
        var owner = formdata.owner;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var timeFrame = formdata.timeFrame;
        var accessCategories = formdata.accessCategories;

        self.contract.addDelegation(owner,delegatee,amount,dimension,timeFrame,accessCategories,function(error,result)
        {
            callback(error,result);
        })
    }

    //the result is the bool success
    this.revokeDelegation = function(fromdata,callback)
    {
        var owner = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var all = formdata.all;//boolean - true or false

        self.contract.revokeDelegation(controller,delegatee,amount,dimension,all,function(error,result)
        {
            callback(error,result);
        })
    }

    //returns amount
    this.delegateeAmount = function(formdata,callback)
    {
        var delegatee = formdata.delegatee;
        var dimension = formdata.dimension;
        var descriptor = formdata.descriptor;

        self.contract.delegateeAmount(delegatee,dimension,descriptor,function(error,result)
        {
            callback(error,result);
        })
    }


}


//TESTING:

var contractAddress = require('./epm.json').IdentityDimensionControl;
var coidAddress = require('./epm.json').CoreIdentity;
console.log("dimension control address: " + contractAddress);
console.log("coid address: " + coidAddress);

var dimension = new IdentityDimensionControl(contractAddress)

var InstantiationData = {"coidAddr": coidAddress, "pubKey": "a1"}

//1. INSTANTIATE THE DIMENSION
dimension.Instantiation(InstantiationData, function(error,result)
{
console.log("RESULT FROM INSTANTIATE: " + result);

//2. CREATE DIMENSION FINANCE
var newDim1 = {"pubKey": "a1", "uniqueID": "ABA", "typeInput": "FINANCE", "flag": 0}
dimension.CreateDimension(newDim1, function(error,result)
{
console.log("RESULT FROM CREATE FINANCE DIMENSION: " + result);

dimension.testing("A1",function(error,result)
{
        console.log(result)
})

//3. POPULATE DIMENSION FINANCE
var firstEntry = {"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "MondayAttribute", "descriptor": "Monday", flag: 0}
dimension.addEntry(firstEntry, function(error,result)
{
console.log("ADD FIRST ENTRY: " + result)
var secondEntry = {"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "TuesdayAttribute", "descriptor": "Monday", flag: 1}
dimension.addEntry(secondEntry, function(error,result)
{
console.log("ADD SECOND ENTRY: " + result)
var thirdEntry = {"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "WednesdasyAttribute", "descriptor": "Wednesday", flag: 0}
dimension.addEntry(secondEntry, function(error,result)
{
console.log("ADD THIRD ENTRY: " + result)
//4. CHECK PUBLIC AND PRIVATE DESCRIPTORS
var getDescriptors = {"type": "FINANCE", "ID": ""}
dimension.getPublicDescriptors(getDescriptors,function(error,result)
{

console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER POPULATION: " + result);
dimension.getPrivateDescriptors(getDescriptors,function(error,result)
{

//console.log("RESULT FROM GET PRIVATE DESCRIPTORS AFTER POPULATION: " + result);




})
})//END 4.

})
})
})//END 3.


})//END 2.

})//END 1.
