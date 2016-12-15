/*
 *      TODO: Create Event listener for Ballot contract
 *      TODO: Test with real data (end to end notification flow)
 *      TODO: Proposal expiary notification
 */


var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json');

var app = require("express")();
var request = require("superagent");
var erisC = require('eris-contracts');
//var erisContracts = require('eris-contracts')
var fs = require('fs')
var bodyParser = require('body-parser')

// eris:chain id with full privilages
var chain = "primaryAccount";
// Change eris:db url
var erisdburl = chainConfig.chainURL;

var contractData = require("./epm.json");
var contractAddress = contractData['GateKeeper'];
var erisAbi = JSON.parse(fs.readFileSync("./abi/" + contractAddress));
var myGKaddressABI = contractData['MyGateKeeper'];
var myGK_Abi = JSON.parse(fs.readFileSync("./abi/" + myGKaddressABI));
var accountData = require("./accounts.json");
var contractMgr = erisC.newContractManagerDev(erisdburl, chainConfig[chain]);
var gateKeeper = contractMgr.newContractFactory(erisAbi).at(contractAddress);


var ballotApp = function () {

    // eris:chain id with full privilages
    this.chain = 'primaryAccount';
    // Change eris:db url
    this.erisdburl = chainConfig.chainURL;

    this.contractData = require("./epm.json");
    this.contractAddress = this.contractData['ballot'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.ballotContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);
    //console.log(this.ballotContract);

    this.ballotContract.proposalExpired(
        function (error, result)
        { },
        function (error, result) {
            console.log("hello");
        })

    this.twinUrl = "http://10.100.98.218:5050";
    var self = this;

    this.createNotification = function (inputs) {
        request.post(this.twinUrl + "/ballot/writeNotify")
            .send(inputs)
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    // do something
                }
            });
    };

    this.createExpiredProposalNotification = function (inputs) {
        request.post(this.twinUrl + "/ballot/writeExpiredProposal")
            .send(inputs)
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    // do something
                }
            });
    };

    this.createCoid = function (inputs) {
        request.post(this.twinUrl + "/ballot/writeCoid")
            .send(inputs)
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    // do something
                }
            });
    };

    this.f1 = function () {
        var filter = this.ballotContract.TestEvent();
        filter.watch(callbackFun());
    }

    function callbackFun() {
        console.log("inside test event watcher");
    }

    var _this = this;

    this.ballotContract.notifyValidator(function (error, result) {
        //do nothing with event, continuously listen.

    }, function (error, result) {
        if (error) {
            console.log("Notification event exists with err", error);
        }
        console.log("notifyValidator event reached")
        console.log(JSON.stringify(result.args))
        var proposal = result.args.proposalIdToVote;
        var validator = result.args.validator;
        var isHuman = result.args.isHuman;
        var address = result.args.myGKaddr;

        console.log("isHuman val: " + isHuman);
        console.log("address is: " + address);
        _this.createNotification({ "pubKey": validator, "proposalID": proposal, "message": "You have been selected to vote on the proposal.", "isHuman":isHuman, "gatekeeperAddr": address });
        console.log("pass on err check: ballot contract notify event");
    })
} //end of ballotApp


var ballot = new ballotApp();

//This endpoint is for voting
//Input Fields (as JSON): msg, signature, publicKey, proposalID, vote

app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


app.post("/vote", function (req, res) {
    console.log("request body ", req.body)
    var msg = req.body.msg;
    var signature = req.body.signature;
    var publicKey = req.body.publicKey;
    var proposalID = req.body.proposalID;
    var vote = parseInt(req.body.vote);
    var txnDesc = req.body.txnDesc;

    console.log(publicKey + " is pub key");
    console.log(proposalID + " is proposalID");
    console.log(signature + " is signature");
    console.log(vote + " is vote")
    console.log(msg + " is msg")

    //Commenting this block to skip verification & bigchain

    /*this.verifyIt(msg, signature, publicKey, function(result)
    {
        if(result == true)
        {
            //they are able to vote
            ballot.ballotContract.vote(txnDesc, proposalID,vote,publicKey,function(error,result)
            {
                console.log("This is result from ballot contract for your vote: " + JSON.stringify(result));
                //write into bigchainDB if they were able to vote:
                if(result == true)
                {
                    this.bigchainIt(proposalID, signature, publicKey, msg, function(error,result)
                    {
                        bigchainTransactions.push(result);
                    })
                }
            })
        }
    })*/


    ballot.ballotContract.vote(proposalID, vote, publicKey, msg, signature, function (error, result) {
        if (error) {
            res.json({ "status": "failed", "msg": "Error on submitting vote", "proposal_id": proposalID });
            console.log("Error on submitting vote proposal ID : " + proposalID, error);
        } else {
            res.json({ "status": "Ok", "proposalID": proposalID, "msg": result });
            console.log("You voted " + vote);
            console.log("this is the result of your vote acceptance: " + result[0]);
        }
    });

})


//This endpoint is for receiving COID Data
//Input Fields (as JSON): proposalId, requesterVal
//TODO: ISHUMAN VALUE CHANGE?
//TODO: YESVOTESREQUIREDTOPASS?
//TODO: Add Verification
app.post("/getCoidData", function (req, res) {


    if(req.body.isHuman || req.body.isHuman == "true")
    {
        retrieveData(gateKeeper, function (result) {
            res.json(result);
        });
    }
    else
    {
        var theAddr = req.body.gatekeeperAddr;
        var myGK = contractMgr.newContractFactory(myGK_Abi).at(theAddr);

        retrieveData(myGK, function (result) {
            res.json(result);
        });
    }

    function retrieveData(theContract, callback) {


        //because a local variable supercedes global variable in this scope:
        var gateKeeper = theContract;

        //get input:
        var params = req.body;
        var proposalId = params.proposalId;
        var requesterVal = params.publicKey;
        //var gatekeeperAddr = params.gatekeeperAddr;
        var response = {
            "pubKey": "",
            "sig": "",
            "msg": "",
            "uniqueId": "",
            "uniqueIdAttributes": [],
            "ownershipId": "",
            "ownerIdList": [],
            "ownershipTokenId": "",
            "controlId": "",
            "controlIdList": [],
            "ownershipTokenAttributes": "",
            "ownershipTokenQuantity": [],
            "controlTokenId": "",
            "controlTokenAttributes": "",
            "controlTokenQuantity": [],
            "identityRecoveryIdList": [],
            "recoveryCondition": [],
            "yesVotesRequiredToPass": 2,
            "isHuman": true

        };

        var functionCount = 0;


        //getmyUniqueID contract return structure:
        // index 0: bool result
        // index 1: bytes32 uniqueIdRet
        // index 2: string uniqueIdAttributes_nameRet
        // index 3: bytes32 uniqueIdAttributes_filehashvalueRet
        // index 4: string uniqueIdAttributes_IPFSFileHashRet
        // index 5: uint index

        var _this = this;
        var err_detected = false;

        //Formulate uniqueIdAttributes
        var counter = 0; //(since you can't use i, i = 8 doesn't mean we are on the 8th iterations -- async property)
        var uniqueArray = [];
        for (let i = 0; i < 10; i++) {
            console.log("roposalId is: " + proposalId);
            console.log("requesterVal is: " + requesterVal);
            gateKeeper.getmyUniqueID(proposalId, requesterVal, i, function (error, result) {
                // Throws an error if result is empty
                // Changes by Arun

                /* Output from contract
                 [ true,
                  'D86AC9BD045D139D5D89381EC86572382AC74ABD9CDD314583CDE6C33D8843D8',
                  'acacca',
                  'DB82D7ADF0E611098EE1762A690B1D6FA83D7E5E53A939AAC9CD5D8B3B08F882',
                  'QmbBdfWHkyqvH9fjB9mcT7Hfh4RvUbcHAEfYozKv29NUDW',
                  { [String: '0'] s: 1, e: 0, c: [ 0 ] } ]
                */
                if (error) {
                    console.log("Error on getmyUniqueID ", error);
                    err_detected = true;
                } else if (Array.isArray(result)) {

                    console.log("inside Array.isArray(result)..")
                    console.log("before trim, result is: " + result)

                    counter++;
                    var rex = /[0-9A-Fa-f]{6}/g;
                    if (result[2].trim() && result[4].trim() && result[3].trim() && rex.test(result[3])) {
                        console.log("result after trim: " + result)
                        uniqueArray.push([result[2], result[4], result[3]]);
                    }

                    if (counter == 9) {
                        response.uniqueIdAttributes = uniqueArray;
                        uniqueArray = [];   // reset array for another method use
                        functionCount++;
                        _this.proceed();
                    }
                }
            })
        }


        //CONTRACT RETURNS: bool result, bytes32 ownershipIdRet, bytes32[10] ownerIdListRet)
        gateKeeper.getmyOwnershipID(proposalId, requesterVal, function (error, result) {

            if (error) {
                console.log("Error on getmyOwnershipID ", error);
                err_detected = true;
            } else if (Array.isArray(result)) {
                response.ownershipId = result[1];
                response.ownerIdList = (result[2].filter(_this.filterFunction));

                functionCount++;
                _this.proceed();
            }
        })


        //CONTRACT RETURNS: bool result, bytes32 ownershipTokenIdRet, bytes32[10] ownershipTokenAttributesRet, uint ownershipTokenQuantityRet
        setTimeout(function () {
            gateKeeper.getmyOwnershipTokenID(proposalId, requesterVal, function (error, result) {
                if (error) {
                    console.log("Error on getmyOwnershipTokenID ", error);
                    err_detected = true;
                } else if (Array.isArray(result)) {
                    response.ownershipTokenId = result[1];
                    response.ownershipTokenAttributes = "" + result[2];
                    for (var i = 0; i < response.ownerIdList.length; i++) {
                        response.ownershipTokenQuantity[i] = result[3][i] + " ";
                        console.log(result[3][i])
                    }
                    functionCount++;
                    _this.proceed();
                }

            })
        }, 6000)


        //CONTRACT RETURNS: bool result, bytes32 controlIdRet, bytes32[10] controlIdListRet
        gateKeeper.getmyControlID(proposalId, requesterVal, function (error, result) {
            if (error) {
                console.log("Error on getmyControlID ", error);
                err_detected = true;
            } else if (Array.isArray(result)) {
                response.controlId = result[1];
                response.controlIdList = (result[2].filter(_this.filterFunction));
                functionCount++;
                _this.proceed();
            }
        })

        //CONTRACT RETURNS: bool result, bytes32 controlTokenIdRet, bytes32[10] controlTokenAttributesRet, uint controlTokenQuantityRet
        //brief delay for asynch
        setTimeout(function () {
            gateKeeper.getmyControlTokenID(proposalId, requesterVal, function (error, result) {
                if (error) {
                    console.log("Error on getmyControlTokenID ", error);
                    err_detected = true;
                } else if (Array.isArray(result)) {
                    response.controlTokenId = result[1];
                    response.controlTokenAttributes = "" + result[2];
                    for (var i = 0; i < response.controlIdList.length; i++) {
                        response.controlTokenQuantity[i] = result[3][i] + " ";
                        console.log(result[3][i]);
                    }
                    console.log(result[3])
                    functionCount++;
                    _this.proceed();
                }
            })
        }, 6000)

        //CONTRACT RETURNS: bool result, bytes32[10] identityRecoveryIdListRet, uint recoveryConditionRet
        gateKeeper.getmyIdentityRecoveryIdList(proposalId, requesterVal, function (error, result) {
            if (error) {
                console.log("Error on getmyIdentityRecoveryIdList ", error);
                err_detected = true;
            } else if (Array.isArray(result)) {
                response.identityRecoveryIdList = (result[1].filter(_this.filterFunction));
                response.recoveryCondition = result[2];

                functionCount++;
                _this.proceed();
            }
        })

        //CONTRACT RETURNS: string pubkeyRet,bytes32 uniqueIdRet, string sigRet, string messageRet
        gateKeeper.getmyIdentityAuditTrail(proposalId, function (error, result) {
            if (error) {
                console.log("Error on getmyIdentityRecoveryIdList ", error);
                err_detected = true;
            } else if (Array.isArray(result)) {
                response.msg = result[3];
                response.sig = result[2];
                response.pubKey = result[0];
                response.uniqueId = result[1];
                _this.proceed();
                functionCount++;
            }
        })

        //only will execute when all functions have been called
        //due to the asynchronous nature of javascript, we call it at the end of each function
        this.proceed = function () {
            //we are done --write the response
            if (functionCount >= 7) {
                // res.write(response);
                if (err_detected) {
                    callback({ "error": "Unknow error detected" });
                } else {
                    callback(response);
                }
            }
        }

        this.filterFunction = function (value) {
            var rex = /[0-9A-Fa-f]{6}/g;
            if (typeof (value) == 'string') {
                return value != '' && rex.test(value) && value != "0000000000000000000000000000000000000000000000000000000000000000";
            } return false;
        }

        this.filterFunction2 = function (value) {
            return value != 0;
        }

    } //End of retrieveData function
}) //End of 'getCoidData' POST


//This endpoint is for voting
//Input Fields (as JSON): msg, signature, publicKey, proposalID, vote
app.post("/delegate", function (req, res) {
    var msg = req.body.msg;
    var signature = req.body.signature;
    var publicKey = req.body.publicKey;
    var proposalID = req.body.proposalID;
    var toDelegate = req.body.toDelegate;
    var txnDesc = "Validator Delegate";

    //Commenting this block to skip verification & bigchain

    /*this.verifyIt(msg, signature, publicKey, function(result)
    {
        if(result == true)
        {
            //they are able to vote
            ballot.ballotContract.delegate(proposalID,toDelegate,publicKey,function(error,result)
            {
                //write into bigchainDB if they were able to vote:
                if(result == true)
                {
                    this.bigchainIt(txnDesc, proposalID, signature, publicKey, msg, function(error,result)
                    {
                        bigchainTransactions.push(result);
                    })
                }
            })
        }
    })*/

    ballot.ballotContract.delegate(proposalID, toDelegate, publicKey, signature, msg, function (error, result) {
        console.log(JSON.stringify(result));
        res.send("Your delegate request has been submitted");
    });

})

app.get("/getIsProposalExpired", function (req, res) {/*
    console.log("inside /getProposalExpired "+ req);
    ballot.ballotContract.IsProposalExpired(function (error, result) {
                        res.statusCode = error ? 500 : 200
                        if (error) {
                                console.log("After calling isProposalExpired error : "+ error);
                                res.write(error + "\n")
                        }
                        else {
                                this.watchForEvent();
                                console.log("After calling isProposalExpired result : "+ result);
                                res.write("result: " + result + "\n")
                        }
                        res.end()
                })*/
    ballot.ballotContract.IsProposalExpired(function (error, result) {
        res.send("proposal expired event has returned");
    });

});


app.listen(8082);
console.log("running at 8082 port");


