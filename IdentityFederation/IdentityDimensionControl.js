'use strict'
//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256
var DataFetcher = require('/.DataFetcher.js')
//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
//this is for sending a notification for superagent
var superAgent = require("superagent");
//required library for accessing the contract
var erisC = require('eris-contracts');

//this function is intended to send a notification
var TwinConnector = function() 
{
    //location of digital twin
    this.twinUrl = "http://10.100.98.218:5050";

    //for grabbing the appropriate scope
    var _this = this;
    
    //flag = 0 ==> owned
    //flag = 1 ==> controlled
    //flag = 2 ==> delegated
    
    //Get Asset data from the twin folder (owned, delegated, controlled)
    this.GetAsset = function(pubKey, fileName, flag)
    {
        superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if(res.status == 200){
                    return res.body;
                }
            });
    }
    
    
    //Create an Asset in the twin folder (owned, delegated, controlled)
    this.CreateAsset = function(pubKey, fileName, flag, data)
    {
         superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "data": data,
                "updateFlag": 0
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    }
    
    //Update an Asset in the twin folder (owned, delegated, controlled)
    this.UpdateAsset = function(pubKey, fileName, flag, data, keys, values)
    {
         superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "keys": keys,
                "values": values,
                "updateFlag": 1
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    }

    //Remove an Asset in the twin folder (owned, delegated, controlled)
    this.RemoveAsset = function(pubKey, fileName, flag)
    {
          superAgent.post(this.twinUrl + "/deleteAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    }

} //end var notifier

var connector = new TwinConnector();


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
        console.log("add entry public key: " + pubKey)
        self.contract.addEntry("TestingString",type,ID,attribute,descriptor,flag,function(error,result)
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
        
        //put info inside for how to remove asset
        //connector.RemoveAsset();
        
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
app.listen(3015, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3000");
});
//TODO: what will instantiate their contract???
app.post('readEntry', function(req,res)
{
    var formdata = req.body;
    //Instantiate dimension object
    var dimension = new IdentityDimensionControl(formdata.contractAddress)
    //1. call readEntry
    dimension.readEntry(formdata, function(error,result)
    {
        //TODO: double check null string in contract represents no access or entry not found
        if(result != "")
        {
            //2. get data
            //TODO: double check you are using this correctly:
            DataFetcher.getData(result,function(result)
            {
                //TODO: see if the result sends directly to the wallet
                //If it does not, we will be forced to have to talk to the digital twin
                res.json("Data": JSON.parse(result))
            })
        }
        else
        {
            response.json({"response":"Error. You either don't have enough tokens or the descriptor does not exist."})
        }        
    })
})


//This does all the endpoint listening:
//The variable endpoint references all keys in the json object.
for(let endpoint in MyCoidConfig)
{
    //this is the function to call
    var functionCall = MyCoidConfig[endpoint];
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
        var myCoid = new MyCOID(contractAddress)

        //function input
        var formdata = req.body;

        console.log("function call is: " + functionCall)

       // res.json({'Status':'hi','Result':'hello'})

        //formulate the string of code for the function call
        var toExecute = "myCoid." + IdentityConfig[endpoint] + "(formdata,function(error,result)"
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


app.listen(3012)
console.log("running at port 3012")
