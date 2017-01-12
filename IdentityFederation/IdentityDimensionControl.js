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


//This is used to correlate the post requests to the function calls in MyCOID
var IdentityConfig = require('./IdentityDimensionConfig.json');


var IdentityDimensionControl = function(contractAddress)
{
    
    //get the contract:
    this.chain = 'primaryAccount'
    this.erisdburl = chainConfig.chainURL
    this.contractData = require('./epm.json')
    var contractAddr = contractAddress
    console.log("contract addr: " + contractAddr)
    this.contractAbiAddress = this.contractData['CoreIdentity'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

    var self = this;
    
    //result is boolean success from the contract
    this.CreateDimension = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var uniqueID = formdata.uniqueID;
        var typeInput = formdata.typeInput;
        var descriptorInput = formdata.descriptorInput;
        var flag = formdata.flag;
        
        self.contract.CreateDimension(pubKey,uniqueID,typeInput,descriptorInput,flag,function(error,result)
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
         var attribute = formdata.attribute;
         
         self.contract.removeEntry(pubKey,type,ID,attr,bute,function(error,result)
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
        var attribute = formdata.attribute;
        var descriptor = formdata.descriptor;
        
        self.contract.updateEntry(pubKey,type,ID,attribute,descriptor,function(error,result)
        {
            callback(error,result)
        })
    }
    
    //QUESTION******** SHOULD THIS BE PUBLIC
    //result is the bool found from the contract, as well as address of the dimension
    this.getDimensionAddress = function(formdata,callback)
    {
        var type = formdata.type;
        var ID = formdata.ID;
        
        self.contract.getDimensionAddress(type,ID,function(error,result)
        {
            callback(error,result);
        })
    }
    
    //result is the bool success
    this.delegate = function(formdata,callback)
    {
        var controller = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var timeFrame = formdata.timeFrame;
        
        self.contract.delegate(controller,delegatee,amount,deimsnion,timeFrame,function(error,result)
        {
            callback(error,result);
        })
    }
    
    
    //SHOULD THIS FUNCTION EVEN BE HERE:?
    //result is the bool exists, and uint index -- shouldn't we make that private
    this.controllerExists = function(formdata,callback)
    {
        var controllerHash = formdata.controllerHash;
        
        self.contract.controllerExists(controllerHash,function(error,result)
        {
            callback(error,result);
        })
    }

    
    this.addDelegation = function(formdata,callback)
    {
        var controller = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var timeFrame = formdata.timeFrame;
        
        self.contract.addDelegation(controller,delegatee,amount,dimension,timeFrame,function(error,result)
        {
            callback(error,result);
        })
    }

    this.revokeDelegation = function(fromdata,callback)
    {
        var controller = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var all = formdata.all;
        
        self.contract.revokeDelegation(controller,delegatee,amount,dimension,all,function(error,result)
        {
            callback(error,result);
        })
    }
    
    
    this.removeController = function(formdata,callback)
    {
        var controller = formdata.controller;
        
        self.contract.removeController(controller,function(error,result)
        {
            callback(error,result);
        })
    }

    this.spendTokens = function(formdata,callback)
    {
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var identityDimension = formdata.identityDimension;
        
        self.contract.spendTokens(delegatee,amount,identityDimension,function(error,result)
        {
            callback(error,result);
        })
    }
    
    //returns amount
    this.delegateeAmount = function(formdata,callback)
    {
        var delegatee = formdata.delegatee;
        var dimension = formdata.dimension;
        
        self.contract.delegateeAmount(delegatee,dimension,function(error,result)
        {
            callback(error,result);
        })
    }
 
     //TODO: addController
     this.addController = function(formdata,callback)
     {
         var controller = formdata.controller;
         var amount = formdata.amount;
         
         self.contract.addController(controller,amount,function(error,result)
         {
             callback(error,result);
         })
     }
     
}


//This does all the endpoint listening:
//The variable endpoint references all keys in the json object.
for(let endpoint in IdentityConfig)
{
    //this is the function to call
    var functionCall = IdentityConfig[endpoint];
    console.log(functionCall)
    console.log(endpoint)
    app.post('/'+endpoint,function(req,res)
    {

	console.log("POSTED ENDPOINT: " + endpoint);

        //their contract address
        var contractAddress = req.body.address;
        console.log(contractAddress)
        console.log("endpoint is: " + endpoint)
        //instantiate their Coid
        var dimension = new IdentityDimensionControl(contractAddress)

        //function input
        var formdata = req.body;

        console.log("function call is: " + functionCall)

       // res.json({'Status':'hi','Result':'hello'})

        //formulate the string of code for the function call
        var toExecute = "dimension." + IdentityConfig[endpoint] + "(formdata,function(error,result)"
        toExecute = toExecute + "{"
        toExecute = toExecute + "res.json({'Status':error,'Result':(''+result)});"
        toExecute = toExecute + "console.log(result + '');"
        toExecute = toExecute + "console.log('result is: ' + result);"
        toExecute = toExecute + "})"

        //for debugging
        console.log(toExecute);

        //evaulate the given function
        eval(toExecute);
    })
}
