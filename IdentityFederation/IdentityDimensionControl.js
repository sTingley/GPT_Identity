'use strict'
//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256
var DataFetcher = require('./DataFetcher.js')
//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
var IdentityConfig = require('./IdentityDimensionConfig.json')
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
    this.GetDimension = function(pubKey, fileName, flag,callback)
    {
        superAgent.post(this.twinUrl + "/getDimension")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if(res.status == 200){
                console.log("GET RESBODY : "+JSON.stringify(res.body));
console.log("CALLBACK IS A :"+ typeof(callback));
for (var i = 0; i < arguments.length; i++) {
        console.log(String(arguments[i]));
        }
                    var results = res.body;
                    callback(results);
                    //return res.body;
                }
            });
    }

    this.SetDimension = function(pubKey, fileName, flag, updateFlag, data,keys,values,callback)
    {console.log("\nSetDimension called\n");
        superAgent.post(this.twinUrl + "/setDimension")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "updateFlag":updateFlag,
                "data":data,
                "keys":keys,
                "values":values
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if(res.status == 200){
                    console.log("SET RESBODY: "+JSON.stringify(res.body));
                        if(typeof callback === "function"){callback();}
                        else{console.log("Callback is not a Function");}
                        //return res.body;
                }
            });
    }

    //Remove an Dimension in the twin folder (owned, delegated, controlled,callback)
    this.deleteDimension = function (pubKey, fileName, flag,callback) {
        superAgent.post(this.twinUrl + "/deleteDimension")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                 if(res.status == 200){
                     console.log("REMOVE RESBODY: "+JSON.stringify(res.body));
                     callback();
                 }
            });
    }

} //end var notifier

var connector = new TwinConnector();


var IdentityDimensionControl = function (iDimensionCtrlContractAddress) {
    //get the contract:
    this.chain = 'primaryAccount'
    this.erisdburl = chainConfig.chainURL
    this.contractData = require('./epm.json')
    var iDimensionCtrlContractAddress = iDimensionCtrlContractAddress
    console.log("iDimCtrl contract addr: " + iDimensionCtrlContractAddress)
    this.contractAbiAddress = this.contractData['IdentityDimensionControl'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(iDimensionCtrlContractAddress);
    var self = this;

    //NOTE: contract is identityDimensionControl contract that is passed as input

    this.testing = function (valA, valB, valC, valD, valE, valF, callback) {
        self.contract.testing(valA, valB, valC, valD, valE, valF, function (error, result) {
            callback(error, result);
        })
    }
    //first function:
    this.Instantiation = function (formdata, callback) {

        console.log("formdata inside Instantiation: " + JSON.stringify(formdata))
        var pubKey = formdata.pubKey;
        var coidAddr = formdata.coidAddr;
        console.log("SHA3 of PUBKEY: " + keccak_256(pubKey));

        self.contract.IdentityDimensionControlInstantiation(coidAddr, function (error, result) {
            callback(error, result);
        })
    }
    //result is boolean success from the contract
    this.CreateDimension = function(formdata,callback)
    {
        //create a json
        var log = {
                "dimension": {
                        "dimensionName":"",
                        "address":"",
                        "uniqueID":"",
                        "pubKey":"",
                        "controllers":[""],
                        "owner":[""],
                        "flag":"",
                        "delegations" : [ {"owner":"","delegatee":"","amount":"","dimension":"","expiration":"","accessCategories":""}],
                        "data": [{"descriptor":"","attribute":"","flag":"","ID":"" }]
                }
        }
        var pubKey = formdata.pubKey;
        var uniqueID = formdata.uniqueId;
        var typeInput = formdata.dimensionName;
        var flag = formdata.flag;
        var address = formdata.address;
        var controller = formdata.controllers;
        var owner = formdata.owner;
        var delegations = formdata.delegations;
        var data = formdata.data;
        console.log(JSON.stringify(formdata) +"\nTYPE"+typeof(formdata));
        console.log("CONTROLLER"+controller);
        console.log("PUBKEY :"+pubKey);
        console.log("TYPE :"+typeInput);
        console.log("ID :"+uniqueID);

        self.contract.CreateDimension(pubKey,uniqueID,typeInput,flag,function(error,result)
        {
            if(result[0]){
                console.log("made it create");
                log.dimension.dimensionName=typeInput;
                log.dimension.address=address;
                log.dimension.uniqueID=uniqueID;
                log.dimension.publicKey=pubKey;
                log.dimension.controllers=controller;
                log.dimension.owner=owner;
                log.dimension.flag=flag;
                log.dimension.delegations=delegations;
                log.dimension.data=data;

                //change contract using calls
                /*
                function createWrite(){
                    var max=Math.max(controller.length,owner.length);
                    console.log("MAX :"+max);
                    for(var i=0;i<max;i++){
                        if(typeof(owner[i])!='undefined' && typeof(owner[i])!='null'){connector.SetDimension(owner[i],typeInput+".json",0,0,log,"","",function(){})}
                        if(typeof(controller[i])!='undefined' && typeof(controller[i])!='null'){connector.SetDimension(controller[i],typeInput+".json",1,0,log,"","",function(){})}
                        if(i==(max-1)){callback(error,result);}
                        console.log("OWNER :"+typeof(owner[i]))
                        console.log("CONTROLLER :"+typeof(controller[i]))
                    }
                }

                // the reason they are nested is because the other functions also read/write the json. Due to the async nature of js you want to make sure
                // that the file being pulled is the latest.
                if(data.length>0 && data[0].descriptor!="" && delegations.length>0 && delegations[0].owner !=""){
                    self.addEntry(data,function(error,result){
                        self.delegate(delegations,function(error,result){
                            createWrite();
                        }
                    }
                }
                else if(data.length>0 && data[0].descriptor!=""){
                    self.addEntry(data,function(error,result){
                        createWrite();
                    }
                }
                else if(delegations.length>0 && delegations[0].owner !=""){
                    self.delegate(delegations,function(error,result){
                        createWrite();
                    }
                }
                else{
                    createWrite();
                }

                */
                //log.dimension.data[0].flag=flag;
                //send json
                var max=Math.max(controller.length,owner.length);
                console.log("MAX :"+max);
                for(var i=0;i<max;i++){
                    if(typeof(owner[i])!='undefined' && typeof(owner[i])!='null'){connector.SetDimension(owner[i],typeInput+".json",0,0,log,"","",function(){})}
                    if(typeof(controller[i])!='undefined' && typeof(controller[i])!='null'){connector.SetDimension(controller[i],typeInput+".json",1,0,log,"","",function(){})}
                    if(i==(max-1)){callback(error,result);}
                    console.log("OWNER :"+typeof(owner[i]))
                    console.log("CONTROLLER :"+typeof(controller[i]))
                }
                //connector.SetDimension(pubKey,typeInput+".json",0,0,log,"","",function(){callback(error,result)})
            }
            console.log("\n\nCreation LOG: "+JSON.stringify(log) + "\n\n");
//            callback(error,result);
        })
    }

    //result is boolean success from the contract
    this.RemoveDimension = function (formdata, callback) {

        var caller = formdata.caller;
        var descriptor = formdata.descriptor;
        var ID = formdata.ID;

        self.contract.RemoveDimension(caller,descriptor,ID, function(error,result)
        {
            if(result){
               connector.deleteDimension(formdata.caller,formdata.descriptor+".json",0,function(results){callback(error,result)})
            }
            else{callback(error,result);}
        })
    }
    
    //result is boolean success from the contract
    this.changeDescriptor = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var oldDescriptor = formdata.oldDescriptor;
        var newDescriptor = formdata.newDescriptor;
        console.log("----------CHANGE DESCRIPTOR--------------");
        console.log("PUBKEY :"+pubKey);
        console.log("TYPE :"+type);
        console.log("ID :"+ID);
        console.log("oldDESCRIPTOR :"+oldDescriptor);
        console.log("newDESCRIPTOR :"+newDescriptor);

        self.contract.changeDescriptor(pubKey, type, ID, oldDescriptor, newDescriptor, function (error,result)
        {
            if(result){
                connector.GetDimension(formdata.pubKey,formdata.type+".json",0,function(results){
                   for(var i=0;i<results.dimension.data.length;i++){
                       if(results.dimension.data[i].descriptor==oldDescriptor){
                            results.dimension.data[i].descriptor=newDescriptor;
                            break;
                       }
                   }
                    //send json
                    connector.SetDimension(formdata.pubKey,formdata.type+".json",0,0,results,"","",function(){callback(error,result)});
                })
            }
            else{callback(error,result);}
        })
    }

    //result is the boolean success from the contract
    this.addEntry = function (formdata, callback) {

        for(var i=0;i<formdata.length;i++){

            var pubKey = formdata[i].pubKey;
            var type = formdata[i].type;
            var ID = formdata[i].ID;
            var attribute = formdata[i].attribute;
            var descriptor = formdata[i].descriptor;
            var flag = formdata[i].flag;
            console.log("----------ADD ENTRY--------------");
            console.log("PUBKEY :"+pubKey);
            console.log("TYPE :"+type);
            console.log("ID :"+ID);
            console.log("DESCRIPTOR :"+descriptor);
            console.log("ATTRIBUTE :"+attribute);

            self.contract.addEntry(pubKey,type,ID,descriptor,attribute,flag,function(error,result)
            {
                if(result){
                    connector.GetDimension(formdata.pubKey,formdata.type+".json",0,function(results){
                    console.log("\n\nBefore ADD ENTRY LOG: "+JSON.stringify(results) + "\n\n");
                    results.dimension.data.push(entry);
                    console.log("\n\nAFTER ADD ENTRY LOG: "+JSON.stringify(results) + "\n\n");
                    connector.SetDimension(formdata.pubKey,formdata.type+".json",0,0,results,"","","");
                    },formdata.descriptor)
                    if(i == (fromdata.length-1)){
                        callback(error,result);
                    }
                }
                else{
                    callback(error,result);
                    i=formdata.length;
                    console.log("Error occurred while adding entry");
                }
            })
        }
    }

    //result is the boolean success from the contract
    this.removeEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;
        console.log("----------REMOVE ENTRY--------------");
        console.log("PUBKEY :"+pubKey);
        console.log("TYPE :"+type);
        console.log("ID :"+ID);
        console.log("DESCRIPTOR :"+descriptor);

        self.contract.removeEntry(pubKey,type,ID,descriptor,function(error,result)
         {
             if(result){
                 connector.GetDimension(formdata.pubKey,formadata.type+".json",0,function (results)
                 {
                        console.log("ENTERED RE GDJ"+results);
                     if(results.dimension.data.length>0){
                        for(var i=0;i<results.dimension.data.length;i++){
                            if(results.dimension.data[i].descriptor==descriptor){
                                results.dimension.data.splice(i, 1);
                                connector.SetDimension(formdata.pubKey,formdata.type+".json",0,0,results,"","",function(){callback(error,result)});
                                console.log("\n\nLOG: "+JSON.stringify(results) + "\n\n");
                                break;
                            }
                        }
                     }
                 })
             }
             else{callback(error,result);}
         })
    }

    //result is the boolean success from the contract
    this.updateEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;
        var attribute = formdata.attribute;
        var flag = formdata.flag;
        console.log("----------UPDATE ENTRY--------------");
        console.log("PUBKEY :"+pubKey);
        console.log("TYPE :"+type);
        console.log("ID :"+ID);
        console.log("DESCRIPTOR :"+descriptor);
        console.log("ATTRIBUTE :"+attribute);

        self.contract.updateEntry(pubKey,type,ID,descriptor,attribute,flag,function(error,result)
        {
            if(result){
                connector.GetDimension(formdata.pubKey,String(formdata.type)+".json",0,function(results){
                    for(var i=0;i<results.dimension.data.length;i++){
                        if(results.dimension.data[i].descriptor==descriptor){
                            results.dimension.data[i].attribute=attribute;
                            if(flag==2 || flag =="2"){}
                            else{results.dimension.data[i].flag=flag;}
                            connector.SetDimension(formdata.pubKey,String(formdata.type)+".json",0,0,results,"","",function(){callback(error,result)});
                            console.log("\n\nUPDATE LOG: "+JSON.stringify(results) + "\n\n");
                            break;
                        }
                    }

                })
            }
            else{callback(error,result);}
        })
    }
    //result is a string which is the attribute of the entry
    this.readEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;

        self.contract.readEntry(pubKey, type, ID, descriptor, function (error, result) {
            callback(error, result);
        })
    }

    //QUESTION******** SHOULD THIS BE PUBLIC
    //result is the bool found from the contract, as well as address of the dimension
    this.getDimensionAddress = function (formdata, callback) {

        var type = formdata.type;
        var ID = formdata.ID;

        self.contract.getDimensionAddress(type, ID, function (error, result) {
            callback(error, result);
        })
    }

    //result is bytes32[100] of public descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPublicDescriptors = function (formdata, callback) {
        
        var type = formdata.type;
        var ID = formdata.ID;

        self.contract.getPublicDescriptors(type, ID, function (error, result) {
            callback(error, result);
        })
    }
    //result is bytes32[100] of private descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPrivateDescriptors = function (formdata, callback) {

        var type = formdata.type;
        var ID = formdata.ID;

        self.contract.getPrivateDescriptors(type, ID, function (error, result) {
            callback(error, result);
        })
    }

    //result is the bool success
    this.delegate = function (formdata, callback) {

        for(var i=0;i<formdata.length;i++){

            var owner = formdata[i].owner;
            var delegatee = formdata[i].delegatee;
            var amount = formdata[i].amount;
            var dimension = formdata[i].dimension;
            var timeFrame = formdata[i].timeFrame;
            var accessCategories = formdata[i].accessCategories;
            //var entry={"owner":owner,"delegatee":delegatee,"amount":amount,"dimension":dimension,"expiration":timeFrame,"accessCategories":accessCategories};
            console.log("----------Delegate Tokens--------------");
            console.log("Owner :"+owner);
            console.log("Delegatee :"+delegatee);
            console.log("Amount :"+amount);
            console.log("Dimension :"+dimension);
            console.log("Time Frame :"+timeFrame);
            console.log("Access Categories :"+accessCategories);

            self.contract.delegate(owner,delegatee,amount,dimension,timeFrame,accessCategories,function(error,result)
            {
                if(result){
                    connector.GetDimension(formdata.owner,formdata.dimension+".json",0,function(results){
                        results.dimension.delegations.push(entry);
                        connector.SetDimension(formdata[i].owner,formdata[i].dimension+".json",0,0,results,"","","");
                        //connector.SetDimension(entry);
                        console.log("\n\nDELEGATE LOG: "+JSON.stringify(results) + "\n\n");
                        if(i == (fromdata.length-1)){
                            callback(error,result);
                        }
                    })
                }
                else{
                    callback(error,result);
                    i=formdata.length;
                    console.log("Error occurred while delegating");
                }
            })
        }//end for loop
        callback(error,result);
    }

    //the result is the bool success
    this.revokeDelegation = function (fromdata, callback) {
        var owner = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var all = Boolean(formdata.all.toLowerCase()=='true');//boolean - true or false

        //put info inside for how to remove asset
        //connector.RemoveAsset();

        self.contract.revokeDelegation(owner,delegatee,amount,dimension,all,function(error,result)
        {
            console.log("REVOKE RESULT: "+result);
            if(result){
                connector.GetDimension(formdata.controller,String(formdata.dimension)+".json",0,function(results){
                    log=results;
                    if(all)//if the flag is true, just revoke everything from the owner
                    {
                        if(log.dimension.delegations.length > 0)
                        {

                        for(j = 0; j < log.dimension.delegations.length; j++)
                            {
                                if(log.dimension.delegations[j].owner == owner && log.dimension.delegations[j].delegatee == delegatee)
                                {
                                    log.dimension.delegations.splice(j, 1);
                                }
                            }
                        }

                    }
                    else{
                        //logic below is similar to the function spendTokens

                        //first make sure they have the amount FROM that owner:
                        var actualAmount = 0;

                        if(log.dimension.delegations.length > 0)
                        {
                            for( var z = 0; z < log.dimension.delegations.length; z++)
                            {
                                if(log.dimension.delegations[z].delegatee == delegatee && log.dimension.delegations[z].owner == owner && log.dimension.delegations[z].dimension == dimension)
                                {
                                    actualAmount = actualAmount + log.dimension.delegations[z].amount;
                                }
                            }
                        }

                        //if they have less than the owner wants to remove, just remove how much they have
                        if(actualAmount < amount)
                        {
                            amount = actualAmount;
                        }

                        if(amount > 0)
                        {

                            var keepGoing = true;

                            var index=0;
                            while(keepGoing)
                            {
                                //first find index in delegations with closest expiration.
                                //uint index = 0;
                                //This correctly sets var index as the 1st available owner
                                for(var n=0;n<log.dimension.delegations.length;n++){
                                    if(log.dimension.delegations[n].owner == owner && log.dimension.delegations[index].dimension == dimension){
                                            index=n;
                                            break;
                                    }
                                }

                                //size of delegations must be greater than zero because actualAmount != 0
                                //could probably initialize k=index to save cycles later
                                for(var k = 0; k < log.dimension.delegations.length; k++)
                                {
                                    if(log.dimension.delegations[k].owner == owner)
                                    {
                                        if(log.dimension.delegations[k].expiration <= log.dimension.delegations[index].expiration && log.dimension.delegations[index].dimension == dimension)
                                        {
                                            index = k;
                                        }
                                    }
                                }

                                //now spend the amount
                                if(amount >= log.dimension.delegations[index].amount)
                                {
                                    amount = amount - log.dimension.delegations[index].amount;
                                    log.dimension.delegations.splice(index, 1);//this function clears and returns coins back to owner
                                }
                                else
                                {
                                    //no need to give tokens back to owner--they are infinite and created on the fly

                                    //just subtract remaining amount from the current delegation amount
                                    log.dimension.delegations[index].amount = log.dimension.delegations[index].amount - amount;

                                    //now set amount = 0 since we are done
                                    amount = 0;

                                }

                                if(amount == 0)
                                {
                                    keepGoing = false;
                                }

                            }//end while(keepgoing)

                        }// end if amount>0
                    }//end else

                    console.log("\n\nREVOKE LOG: "+JSON.stringify(log) + "\n\n");
                    connector.SetDimension(formdata.controller,String(formdata.dimension)+".json",0,0,log,"","",function(){callback(error,result)});
                })//end get json
            }
            else{callback(error,result);}
        })
    }
    //returns amount
    this.delegateeAmount = function (formdata, callback) {

        var delegatee = formdata.delegatee;
        var dimension = formdata.dimension;
        var descriptor = formdata.descriptor;

        self.contract.delegateeAmount(delegatee, dimension, descriptor, function (error, result) {
            callback(error, result);
        })
    }

    //  ST: COMMENTED THIS OUT BECAUSE idimCtrlToken has this method. it is called internally by delegate (see above)

    // //the result is the bool success
    // this.addDelegation = function(formdata,callback)
    // {
    //     var owner = formdata.owner;
    //     var delegatee = formdata.delegatee;
    //     var amount = formdata.amount;
    //     var dimension = formdata.dimension;
    //     var timeFrame = formdata.timeFrame;
    //     var accessCategories = formdata.accessCategories;
    //     self.contract.addDelegation(owner,delegatee,amount,dimension,timeFrame,accessCategories,function(error,result)
    //     {
    //         callback(error,result);
    //     })
    // }

    //************************************************************************************ */

    this.removeController = function (formdata, callback) {
        var controller = formdata.controller;

        self.contract.removeController(controller, function (error, result) {
            callback(error, result);
        })
    }
    //SHOULD THIS FUNCTION EVEN BE HERE:?
    //result is the bool exists, and uint index -- shouldn't we make that private
    this.controllerExists = function (formdata, callback) {
        var controllerHash = formdata.controllerHash;

        self.contract.controllerExists(controllerHash, function (error, result) {
            callback(error, result);
        })
    }
    //TODO: addController
    this.addController = function (formdata, callback) {
        var controller = formdata.controller;
        var amount = formdata.amount;

        self.contract.addController(controller, amount, function (error, result) {
            callback(error, result);
        })
    }
    //*********************************************************************************** */

}//end IdentityDimensionControl



/*SPEND TOKENS IS A TOKEN CONTROL FUNCTION THAT is called internally inside identityDimensionControl.sol
//  !!!!!!!!!!! (Called inside readEntry)

this.spendTokens = function(formdata,callback)
{
    var delegatee = formdata.delegatee;
    var amount = formdata.amount;
    var identityDimension = formdata.identityDimension;

    self.contract.spendTokens(delegatee,amount,identityDimension,function(error,result)
    {
        callback(error,result);
    })
}*/

//TODO: what will instantiate their contract???
app.post('readEntry', function (req, res) {
    var formdata = req.body;
    //Instantiate dimension object
    var dimension = new IdentityDimensionControl(formdata.contractAddress)
    //1. call readEntry
    dimension.readEntry(formdata, function (error, result) {
        //TODO: double check null string in contract represents no access or entry not found
        if (result != "") {
            //2. get data
            //TODO: double check you are using this correctly:
            DataFetcher.getData(result, function (result) {
                //TODO: see if the result sends directly to the wallet
                //If it does not, we will be forced to have to talk to the digital twin
                res.json({ "Data": JSON.parse(result) })
            })
        }
        else {
            response.json({ "response": "Error. You either don't have enough tokens or the descriptor does not exist." })
        }
    })
})


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//This does all the endpoint listening:
//The variable endpoint references all keys in the json object.
for (let endpoint in IdentityConfig) {
    //this is the function to call
    var functionCall = IdentityConfig[endpoint];
    console.log("functionCall: " + functionCall)
    console.log("endpoint: " + endpoint)
    app.post('/' + endpoint, function (req, res) {

        console.log("POSTED ENDPOINT: " + endpoint);
        console.log("req: " + JSON.stringify(req.body))

        var formdata = req.body

        //their contract address
        var contractAddress = formdata.dimensionCtrlAddr;
        console.log("dimensionCtrl address: " + contractAddress)
        //instantiate their IdentityDimensionControl
        var dimension = new IdentityDimensionControl(contractAddress)

        // res.json({'Status':'hi','Result':'hello'})

        //formulate the string of code for the function call
        var toExecute = "dimension." + IdentityConfig[endpoint] + "(formdata,function(error,result)"
        toExecute = toExecute + "{"
        toExecute = toExecute + "res.json({'Status':error,'Result':(''+result)});"
        toExecute = toExecute + "console.log(result + '');"
        toExecute = toExecute + "console.log('result is: ' + result);"
        toExecute = toExecute + "})"

        //for debugging
        console.log("calling eval on: " + toExecute);

        //evaulate the given function
        eval(toExecute, function(err,res){
            if(err){console.log("error: " + err)}
            console.log("res from eval: " + res)
        });
    })
}

app.listen(8001, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 8001");
});
