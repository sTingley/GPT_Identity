'use strict'

//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256
var Web3 = require('web3')
var web3 = new Web3();

//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')

//this is for sending a notification for superagent
var superAgent = require("superagent");

//required library for accessing the contract
var erisC = require('eris-contracts');



function string2Bin ( str ) {
    return str.split("").map( function( val ) { 
        return val.charCodeAt( 0 ); 
    } );
}


var IdentityDimensionControl = function(contractAddress) {
   
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

    this.testing = function(valA,valB,valC,valD,valE,valF,callback)
    {
	self.contract.testing(valA,valB,valC,valD,valE,valF,function(error,result)
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
	console.log("COID ADDRESS: "+coidAddr);

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
        var ID = web3.toHex(String(formdata.ID));

        self.contract.RemoveDimension(caller,descriptor,ID, function(error,result)
        {
            callback(error,result);
        })
    }

    //result is boolean success from the contract
    this.changeDescriptor = function(formdata,callback)
    {
        var pubKey = web3.toHex(String(formdata.pubKey));
        var type = web3.toHex(String(formdata.type));
        var ID = web3.toHex(String(formdata.ID));
        var oldDescriptor = web3.toHex(String(formdata.oldDescriptor));
        var newDescriptor = web3.toHex(String(formdata.newDescriptor));

        self.contract.changeDescriptor(pubKey, type, ID, oldDescriptor, newDescriptor, function (error,result)
        {
            callback(error,result);
        })
    }

    //result is the boolean success from the contract
    this.addEntry = function(formdata,callback)
    {
	
	
	//var vars=web3.toHex(formdata.vars);
        var pubKey = formdata.pubKey;
        var type = web3.toHex(String(formdata.type));
        var ID = web3.toHex(String(formdata.ID));
        var attribute = web3.toHex(String(formdata.attribute));
        var descriptor = web3.toHex(String(formdata.descriptor));
        var flag = formdata.flag;
	console.log("add entry public key: " + pubKey)
	var pubKey1 = web3.toHex(String(pubKey));

	console.log("PUBKEY :"+pubKey1);
	console.log("TYPE :"+type);
	console.log("ID :"+ID);
	console.log("DESCRIPTOR :"+descriptor);
	console.log("ATTRIBUTE :"+attribute);

        self.contract.addEntry(pubKey1,type,ID,descriptor,attribute,flag,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is the boolean success from the contract
    this.removeEntry = function(formdata,callback)
    {
         var pubKey = web3.toHex(String(formdata.pubKey));
         var type = web3.toHex(String(formdata.type));
         var ID = web3.toHex(String(formdata.ID));
         var descriptor = web3.toHex(String(formdata.descriptor));

         self.contract.removeEntry(pubKey,type,ID,descriptor,function(error,result)
         {
             callback(error,result);
         })
    }


    //result is the boolean success from the contract
    this.updateEntry = function(formdata,callback)
    {
        var pubKey =  web3.toHex(String(formdata.pubKey));
        var type =  web3.toHex(String(formdata.type));
        var ID =  web3.toHex(String(formdata.ID));
        var descriptor =  web3.toHex(String(formdata.descriptor));
        var attribute =  web3.toHex(String(formdata.attribute));
        var flag = formdata.flag;

        self.contract.updateEntry(pubKey,type,ID,descriptor,attribute,flag,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is a string which is the attribute of the entry
    this.readEntry = function(formdata,callback)
    {
        var pubKey = web3.toHex(String(formdata.pubKey));
        var type = web3.toHex(String(formdata.type));
        var ID = web3.toHex(String(formdata.ID));
        var descriptor = web3.toHex(String(formdata.descriptor));

        self.contract.readEntry(pubKey,type,ID,descriptor,function(error,result)
        {
            callback(error,result);
        })
    }


    //result is bytes32[100] of public descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPublicDescriptors = function(formdata,callback)
    {
        var type = web3.toHex(String(formdata.type));
        var ID = web3.toHex(String(formdata.ID));
	console.log("TYPE: "+type);

        self.contract.getPublicDescriptors(type,ID,function(error,result)
        {
            callback(error,result);
        })
    }

    //result is bytes32[100] of private descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPrivateDescriptors = function(formdata,callback)
    {
        var type = web3.toHex(String(formdata.type));
        var ID = web3.toHex(String(formdata.ID));

        self.contract.getPrivateDescriptors(type,ID,function(error,result)
        {
            callback(error,result);
        })
    }


    //result is the bool success
    this.delegate = function(formdata,callback)
    {
        var owner = web3.toHex(String(formdata.owner));
        var delegatee = web3.toHex(String(formdata.delegatee));
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var timeFrame = formdata.timeFrame;
        var accessCategories = formdata.accessCategories;
console.log("\n\nOWNER :"+owner);
console.log("\n\ndelegatee :"+delegatee);
        self.contract.delegate(owner,delegatee,amount,dimension,timeFrame,accessCategories,function(error,result)
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
    this.revokeDelegation = function(formdata,callback)
    {
        var owner = web3.toHex(String(formdata.controller));
        var delegatee = web3.toHex(String(formdata.delegatee));
        var amount = formdata.amount;
        var dimension = String(formdata.dimension);
        var all = Boolean(formdata.all.toLowerCase()=='true');//boolean - true or false
console.log("BOOLEAN ALL: "+all);
        self.contract.revokeDelegation(owner,delegatee,amount,dimension,all,function(error,result)
        {
            callback(error,result);
        })
    }

    //returns amount
    this.delegateeAmount = function(formdata,callback)
    {
        var delegatee = web3.toHex(String(formdata.delegatee));console.log("DELEGATEE JS: "+delegatee);
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

dimension.testing("a1","a2","a3","a4","a5",3,function(error,result)
{
	console.log("result from testing: " + result);
})

setTimeout(function()
{


//1. INSTANTIATE THE DIMENSION
dimension.Instantiation(InstantiationData, function(error,result)
{
console.log("RESULT FROM INSTANTIATE: " + result);
//var str = web3.fromAscii('MonAttribute',32);
//console.log("\n\nWEB3 STUFF : "+str);
//console.log("BYTES : "+ string2Bin("MonAttribute"));
//2. CREATE DIMENSION FINANCE
var newDim1 = {"pubKey": "a1", "uniqueID": "ABA", "typeInput": "FINANCE", "flag": 0}
dimension.CreateDimension(newDim1, function(error,result)
{
console.log("RESULT FROM CREATE FINANCE DIMENSION: " + result);
newDim1 = {"pubKey": "a1", "uniqueID": "ABC", "typeInput": "HEALTH", "flag": 0}

dimension.CreateDimension(newDim1, function(error,result)
{
console.log("RESULT FROM CREATE HEALTH DIMENSION: " + result);


//3. POPULATE DIMENSION FINANCE
var firstEntry = {"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "MonAttribute", "descriptor": "Monday", flag: 0}
setTimeout(function(){
dimension.addEntry(firstEntry, function(error,result)
{
console.log("ADD FIRST ENTRY: " + result)
var secondEntry = {"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "TuesAttribute", "descriptor": "Tuesday", flag: 1}
dimension.addEntry(secondEntry, function(error,result)
{
console.log("ADD SECOND ENTRY: " + result)
var thirdEntry = {"pubKey": "a1", "type": "HEALTH", "ID": "", "attribute": "WedAttribute", "descriptor": "Wednesday", flag: 1}
dimension.addEntry(thirdEntry, function(error,result)
{
console.log("ADD THIRD ENTRY: " + result)

//4. CHECK PUBLIC AND PRIVATE DESCRIPTORS
var getDescriptors = {"type": "FINANCE", "ID": ""}
dimension.getPublicDescriptors(getDescriptors,function(error,result)
{

console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER POPULATION: " + result);
var entryR1={"pubKey": "a1", "type": "FINANCE", "ID": "","descriptor": "Tuesday"}
dimension.getPrivateDescriptors(getDescriptors,function(error,result)
{

console.log("\nRESULT FROM GET PRIVATE DESCRIPTORS AFTER POPULATION: " + result);

dimension.readEntry(entryR1,function(error,result)
{

console.log("\nRESULT FROM READ ENTRY: " + result);
var entryU1={"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "TacoTuesday", "descriptor": "Tuesday", flag: 0}
setTimeout(function(){

//CHANGE AN ENTRY
dimension.updateEntry(entryU1,function(error,result)
{

console.log("\nRESULT FROM UPDATE ENTRY: " + result);
var entryR2={"pubKey": "a1", "type": "FINANCE", "ID": "","descriptor": "Monday"}

dimension.readEntry(entryR1,function(error,result)
{

console.log("\nRESULT FROM READ AFTER UPDATE ENTRY: " + result);

dimension.getPublicDescriptors(getDescriptors,function(error,result)
{
console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER UPDATE: " + result);

dimension.getPrivateDescriptors(getDescriptors,function(error,result)
{

console.log("\nRESULT FROM GET PRIVATE DESCRIPTORS AFTER UPDATE: " + result);


//REMOVE AN ENTRY
dimension.removeEntry(entryR2,function(error,result)
{
console.log("\nRESULT FROM READ AFTER REMOVE ENTRY: " + result);

dimension.readEntry(entryR2,function(error,result)
{
console.log("\nRESULT FROM READ AFTER REMOVE ENTRY: " + result);
var entryR3={"pubKey": "a1", "type": "FINANCE", "ID": "","descriptor": "Tacos"}
var entryCD={"pubKey": "a1", "type": "FINANCE", "ID": "","oldDescriptor": "Tuesday", "newDescriptor":"Tacos"}


//CHANGE AN EXISTING DESCRIPTOR
dimension.changeDescriptor(entryCD,function(error,result)
{
console.log("\nRESULT FROM CHANGE DESCRIPTOR: " + result);

dimension.readEntry(entryR3,function(error,result)
{
console.log("\nRESULT FROM READ AFTER CHANGE DESCRIPTOR: " + result);

dimension.getPublicDescriptors(getDescriptors,function(error,result)
{
console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER UPDATE: " + result);

//DELEGATION OF TOKENS
var delegate = {"owner": "a1","delegatee": "b1", "amount":4, "dimension" :"FINANCE", "timeFrame":50000 , "accessCategories":"" }
var delegate2 = {"owner": "a1","delegatee": "b1", "amount":4, "dimension" :"HEALTH", "timeFrame":50000 , "accessCategories":"" }

dimension.delegate(delegate,function(error,result)
{
console.log("RESULT FROM DELEGATE: " + result);
var delegateR = {"delegatee":"b1","dimension" :"FINANCE","descriptor":"Tacos" }
var Rdelegate = {"controller":"a1","delegatee":"b1", "amount":2, "dimension" :"FINANCE", "all":"false" }

dimension.delegate(delegate2,function(error,result)
{
console.log("RESULT FROM DELEGATE2: " + result);

dimension.revokeDelegation(Rdelegate,function(error,result)
{
console.log("RESULT FROM REVOKE DELEGATE: " + result);

dimension.delegateeAmount(delegateR,function(error,result)
{
console.log("RESULT FROM DELEGATEE AMOUNT: " + result);
var delegateR2 = {"delegatee":"b1","dimension" :"HEALTH","descriptor":"Wednesday" }
dimension.delegateeAmount(delegateR2,function(error,result)
{
console.log("RESULT FROM DELEGATEE2 AMOUNT: " + result);

//REMOVE DIMENSION
var dim={ "caller":"a1", "ID": "", "descriptor": "FINANCE" }
dimension.RemoveDimension(dim,function(error,result)
{
console.log("RESULT FROM REMOVE DIMENSION: " + result);

dimension.readEntry(entryR3,function(error,result)
{
console.log("\nRESULT FROM READ AFTER REMOVE DIMENSION: " + result);

dimension.getPublicDescriptors(getDescriptors,function(error,result)
{
console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER REMOVE DIMENSION: " + result);
entryR3={"pubKey": "b1", "type": "HEALTH", "ID": "","descriptor": "Wednesday"}

dimension.readEntry(entryR3,function(error,result)
{
console.log("\nRESULT FROM READ DIMENSION2: " + result);
getDescriptors = {"type": "HEALTH", "ID": ""}

dimension.getPublicDescriptors(getDescriptors,function(error,result)
{
console.log("RESULT FROM GET PUBLIC DESCRIPTORS DIMENSION2: " + result);

dimension.getPrivateDescriptors(getDescriptors,function(error,result)
{
console.log("RESULT FROM GET PUBLIC DESCRIPTORS DIMENSION2: " + result);
setTimeout(function()
{

dimension.delegateeAmount(delegateR2,function(error,result)
{
console.log("RESULT FROM DELEGATEE2 AMOUNT: " + result);


})
},6000)
})
})
})
})//end 4th getpubdes
})//end 5th readentry
})//end remove dimension
})
})//end delegatee amount
})//end revoke delegation
})//end delegeate2
})//end delegate
})//end 3rd getpubdes
})//end 4th readEntry
})//end changeDescriptor
})//end 3rd readEntry
})//end removeEntry
})//end 2nd getprivdes
})//end 2nd getpubdes
})// end 2nd readEntry
}) //end updateEntry
},3000)
})//END readEntry
})
})//END 4.

})
})
})//END 3.
},3000)
})
})//END 2.

})//END 1.

},3000)
