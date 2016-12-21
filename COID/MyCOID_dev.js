'use strict'

//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256

//this is for sending a notification for superagent
var superAgent = require("superagent");

//required library for accessing the contract
var erisC = require('eris-contracts');


//This is used to correlate the post requests to the function calls in MyCOID
var MyCoidConfig = require('./MyCOIDConfig.json');


//this function is intended to send a notification
var TwinConnector = function () 
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




//myCoid object
//To be used in post requests
//NOTE: The ABI can be obtained from the contractAddress because the location of the abi is known
//The location will always be where gatekeeper deployed it.
var MyCOID = function(contractAddress)
{
    //get the contract:
    this.chain = 'newchain4_full_000'
    this.erisdburl = 'http://10.100.98.218:1337/rpc'
    this.contractData = require('./epm.json')
    var contractAddr = contractAddress
    console.log("contract addr: " + contractAddr)
    this.contractAbiAddress = this.contractData['CoreIdentity'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, this.accountData[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

    //coid functions:
    var self = this;
    
    
    //ONE TIME INSTANTIATION
    //THIS FUNCTION IS INTENDED TO BE CALLED AT THE VERY BEGINNING
    //WHEN THEY MAKE THEIR TWIN
    //IT POPULATES THE ASSET SCREENS OF OTHER OWNERS, CONTROLLERS, DELEGATES
    this.updateTwin = function(creatorPubkey,callback)
    {
        //1. see if there are any other owners, if so,
    }



    // -> -> -> START CONTROL FUNCTIONS -> -> ->
    //
    //

    //GET CONTROLLER LIST
    this.getControllers = function(formdata,callback)
    {
        var pubKey = formdata.pubKey;
        var msg = formdata.msg;
        var sig = formdata.sig;

        self.contract.getList(function(error,result)
        {
            callback(error,result)
        })
    }



    //REVOKE DELEGATION TO A DELEGATEE AS A CONTROLLER
    this.revokeControlDelegation = function(formdata,callback)
    {
        var controller = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var msg = formdata.msg;
        var sig = formdata.sig;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        self.contract.revokeDelegation(controllerHash,delegateeHash,amount,function(error,result)
        {
            callback(error,result)
        })
    }



    //SPEND MY TOKENS AS A DELEGATEE
    this.spendMyTokens = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;

        //TODO:
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        self.contract.spendMyTokens(delegateeHash,amount,function(error,result)
        {
            callback(error,result)
        })
    }



    //GET YOUR AMOUNT AS A DELEGATEE
    this.myAmount = function(formdata,callback)
    {
        var delegatee = formdata.delegatee;
        var msg = formdata.msg;
        var sig = formdata.sig;

        //TODO:
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        self.contract.myAmount(delegateeHash,function(error,result)
        {
            callback(error,result)
        })
    }


    //DELEGATE TOKENS AS A CONTROLLER TO A DELEGATEE
    this.delegate = function(formdata,callback)
    {
        var delegatee = formdata.delegatee;
        var controller = formdata.controller;
        var amount = formdata.amount;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        self.contract.delegate(controllerHash,delegateeHash,amount,function(error,result)
        {
            callback(error,result)
        })
    }



    //CHANGE TOKEN CONTROLLER
    //ALLOWS A CONTROLLER TO GIVE TOKENS TO ANOTHER CONTROLLER
    //YOU MUST ADD A CONTROLLER BEFORE CALLING THIS FUNCTION
    this.changeTokenController = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var originalController = formdata.originalController;
        var newController = formdata.newController;
        var amount = formdata.amount;

        //TODO:
        var originalControllerHash = keccak_256(originalController).toUpperCase()
        var newControllerHash = keccak_256(newController).toUpperCase()

        self.contract.changeTokenController(originalControllerHash,newControllerHash,amount,function(error,result)
        {
            callback(error,result)
        })
    }



    //GIVES A CONTROLLER HOW MANY TOKENS THEY HAVE DELEGATED
    this.amountDelegated = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var controller = formdata.controller;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()

        self.contract.amountDelegated(controllerHash,function(error,result)
        {
            callback(error,result)
        })
    }



    //ADD A CONTROLLER
    this.addController = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var controller = formdata.controller;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()

        self.contract.addController(controllerHash,function(error,result)
        {
            callback(error,result)
        })
    }



    //REMOVE A CONTROLLER
    this.removeController = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey
        var controller = formdata.controller;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()

        self.contract.removeController(controllerHash,function(error,result)
        {
            callback(error,result)
        })
    }
    //
    // <- <- <- END CONTROL FUNCTIONS <- <- <-




    // -> -> -> START OWNERSHIP FUNCTIONS -> -> ->
    //
    //

    //Tells an owner how many tokens they have.
    this.myTokenAmount = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var owner = formdata.owner;

        //TODO:
        var ownershipHash = keccak_256(owner).toUpperCase()

        self.contract.myTokenAmount(ownershipHash,function(error,result)
        {
            callback(error,result)
        })
    }

    //Adds an owner
    this.addOwner = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var amount = formdata.amount;

        var newOwner = formdata.newOwner;

        //TODO:
        newOwner = keccak_256(newOwner).toUpperCase()

        self.contract.addOwner(newOwner,amount,function(error,result)
        {
            callback(error,result)
        })
    }

    //Removes an owner
    this.removeOwner = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var owner = formdata.owner;

        //TODO:
        owner = keccak_256(owner).toUpperCase()

        self.contract.removeOwner(owner,function(error,result)
        {
            callback(error,result)
        })

    }


    //Allows an owner to give tokens to another owner (they must already be an owner!)
    this.giveTokens = function(formdata,callback)
    {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var originalOwner = formdata.originalOwner;
        var newOwner = formdata.newOwner;
        var amount = formdata.amount

        //TODO:
        originalOwner = keccak_256(originalOwner).toUpperCase()
        newOwner = keccak_256(newOwner).toUpperCase()

        self.contract.giveTokens(originalOwner,newOwner,amount,function(error,result)
        {
            callback(error,result)
        })

    }

    //
    //
    // <- <- <- END OWNERSHIP FUNCTIONS <- <- <-


}



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




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
        //their contract address
        var contractAddress = req.body.address;
        console.log(contractAddress)
        console.log("endpoint is: " + endpoint)
        //instantiate their Coid
        var myCoid = new MyCOID(contractAddress)

        //function input
        var formdata = req.body;

        console.log("function call is: " + functionCall)

        res.json({'Status':'hi','Result':'hello'})

        //formulate the string of code for the function call
       // var toExecute = "myCoid." + MyCoidConfig[endpoint] + "(formdata,function(error,result)"
       // toExecute = toExecute + "{"
       // toExecute = toExecute + "res.json({'Status':error,'Result':(''+result)});"
       // toExecute = toExecute + "console.log(result + '');"
       // toExecute = toExecute + "console.log('result is: ' + result);"
       // toExecute = toExecute + "})"

        //for debugging
       // console.log(toExecute);

        //evaulate the given function
       // eval(toExecute);
    })
}


app.listen(3012)
console.log("running at port 3012")
