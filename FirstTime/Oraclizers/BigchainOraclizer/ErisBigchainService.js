'use strict'


//grab the chain configuration:
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
console.log("Chain Configuration Account: " + chainConfig.primaryAccount)
console.log("Chain URL: " + chainConfig.chainURL)
var chain = 'primaryAccount';
var ErisAddress = chainConfig[chain].address;
console.log("\n\n\nChain Address: " + ErisAddress);
//this library is needed to calculate hash of blockchain id (chain name) and bigchain response
var keccak_256 = require('js-sha3').keccak_256;
console.log("\n\n\nChain Address Hash: " + keccak_256(ErisAddress));


//port listening libraries
var express = require('express')
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
app.use(morgan('dev'));
app.use(bodyParser.json());
app.set('trust proxy', true);
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, application/json-rpc");
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(morgan('dev'));


//for calling contract:
var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')
var address = require('./epm.json').deployStorageK
var abi = JSON.parse(fs.readFileSync('./abi/' + address, 'utf8'))
var accounts = require('./accounts.json')
var chainUrl
var manager
var contract
var waitingList = [];

//this is for signature generation:
var crypto = require('crypto')
var ed25519 = require('ed25519')

//for calling bigchaindb:
var request = require('request');
var bigchainServer = 'http://10.100.98.217:5000/'

//API for chain
chainUrl = chainConfig.chainURL;
//instantiate contract object manager (uses chain URL and account data)
manager = contracts.newContractManagerDev(chainUrl, chainConfig.primaryAccount)
//Make the contract object using ABI and address of deployed contract
contract = manager.newContractFactory(abi).at(address)


//This is for signature generation:
function createSignature(nonHashedMessage, callback) {
    //make message hash
    var hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex')

    var pubKey = chainConfig.primaryAccount.pubKey;
    var privKey = chainConfig.primaryAccount.privKey;

    var keyPair = { "publicKey": new Buffer(pubKey, "hex"), "privateKey": new Buffer(privKey, "hex") }

    var signature = ed25519.Sign(new Buffer(hash), keyPair)

    signature = signature.toString('hex')

    var result = { "signature": signature, "pubKey": pubKey, "msg": hash }

    callback(signature, pubKey, hash)
}


function bigchainPost(OwnerPubKey, proposalID, coidData, blockNumber, blockHash, blockchainID, timestamp, validatorSigs, serviceSig, callback) {

    var thePubkey = OwnerPubKey;
    console.log("In function bigchainIt, pubKey of eris account (ownerPubKey) is: " + thePubkey)

    var description = "Recovery";
    var attrs;
    if (typeof (coidData.uniqueIdAttributes) == 'string') {
        attrs = coidData.uniqueIdAttributes.split(',');
    }
    else { attrs = coidData.uniqueIdAttributes }

    let trimmed = []
    //trimming IPFS hashes and sha3 hashes from the uniqueIdAttrs before we write to bcdb
    for (var i = 0; i < attrs.length; i += 3) {
        trimmed.push(attrs[i]);
    }

    coidData.coidAddr = "";
    coidData.gatekeeperAddr = "";
    coidData.uniqueIdAttributes = trimmed;

    //NOTE: signatures inputted to this object should include msg hash, signature and public key
    //NOTE: Coid_Data should include uniqueID and the signature of the one requesting a core identity
    var bigchainInput = {
        "Description": description,
        "proposalID": proposalID,
        "Coid_Data": coidData,
        "blockNumber": blockNumber,
        "blockHash": blockHash,
        "blockchainID": blockchainID,
        "blockchain_timestamp": timestamp,
        "validator_signatures": validatorSigs,
        "service_signature": serviceSig
    };//end json struct

    var metadata = { "bigchainID": arguments[10], "bigchainHash": arguments[11] } || "";
    coidData.bigchainID = "";
    coidData.bigchainHash = "";

    bigchainInput = JSON.stringify({ "data": bigchainInput, "metadata": metadata })
    console.log("In function bigchainIt, the input to be sent to bigchain is: " + bigchainInput)
    var bigchainEndpoint = 'addData/' + thePubkey + '/1'
    var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint }
    console.log("Bigchain Request: " + JSON.stringify(theobj))

    contract.BigChainQuery(JSON.stringify(theobj), keccak_256(coidData.pubKey).toUpperCase(), function (error, result) {

        console.log("A million stars ***************************************************************************************")
        var theEvent;
        contract.CallbackReady(function (error, result) {
            theEvent = result;
        },
            function (error, result) {
                console.log("addr: " + result.args.addr + "\nkey: " + keccak_256(coidData.pubKey).toUpperCase())
                if (keccak_256(coidData.pubKey).toUpperCase() == result.args.addr) {

                    contract.myCallback(keccak_256(coidData.pubKey).toUpperCase(), function (error, result) {

                        console.log("RESULT: " + result);
                        var bigchainID = JSON.parse(result).response;
                        console.log("Result.response: " + bigchainID)
                        bigchainID = JSON.parse(bigchainID).id;
                        var bigchainHash = keccak_256(JSON.parse(result).response);
                        console.log("************: " + JSON.parse(result).response);

                        var signature = JSON.parse(result).signature
                        var msg = JSON.parse(result).msg
                        var pubKey = JSON.parse(result).pubKey
                        console.log("pubkey returns is ......: " + pubKey)

                        //verify oraclizer signature
                        var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
                        console.log(logme)

                        //for debugging--ignore:
                        if (logme == true) {
                            console.log("logme is the bool true");
                        }
                        else {
                            console.log("logme is not bool true but if this says true, it is a string: " + logme)
                        }

                        callback(result, bigchainID, bigchainHash)

                        //stop event listening
                        theEvent.stop();

                    })//end calling of myCallback

                }//end if statement

            })//end callback listening


    })//end bigchain query

}// end bigchain Post

function bigchainGet(pubKey, txid, callback) {
    var thePubkey = ErisAddress;
    var bigchainEndpoint = 'getTransaction/' + txid;
    var theobj = { "method": "GET", "stringJsonData": "", "endpoint": bigchainEndpoint }
    console.log("Bigchain Request: " + JSON.stringify(theobj))

    contract.BigChainQuery(JSON.stringify(theobj), keccak_256(pubKey).toUpperCase(), function (error, result) {

        var theEvent;
        contract.CallbackReady(function (error, result) {
            theEvent = result;
        },
            function (error, result) {

                if (keccak_256(pubKey).toUpperCase() == result.args.addr) {
                    console.log("callbackready: " + JSON.stringify(result))

                    contract.myCallback(keccak_256(pubKey).toUpperCase(), function (error, result) {

                        console.log("RESULT: " + result);
                        var bigchainID = JSON.parse(result).response;
                        console.log("\nResult.response: " + bigchainID)
                        bigchainID = JSON.parse(bigchainID).id;
                        var bigchainHash = keccak_256(JSON.parse(result).response);

                        var signature = JSON.parse(result).signature
                        var msg = JSON.parse(result).msg
                        var pubKey = JSON.parse(result).pubKey
                        console.log("pubkey returns is ......: " + pubKey)

                        //verify oraclizer signature
                        var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
                        console.log(logme)

                        //for debugging--ignore:
                        if (logme == true) {
                            console.log("logme is the bool true");
                        }
                        else {
                            console.log("logme is not bool true but if this says true, it is a string: " + logme)
                        }

                        callback(result, bigchainID, bigchainHash)

                        //stop event listening
                        theEvent.stop();

                    })//end calling of myCallback

                }//end if statement

            })//end callback listening

    })//end bigchain query
}//end bigchain get


function bigchainTransfer(toPubKey, fromPubKey, txid, flag, callback) {
    //var thePubkey = ErisAddress;
    var bigchainEndpoint = 'transfer';
    var bigchainInput = {
        "toPubKey": toPubKey,
        "fromPubKey": fromPubKey,
        "txid": txid,
        "flag": flag
    }
    var theobj = { "method": "POST", "stringJsonData": JSON.stringify(bigchainInput), "endpoint": bigchainEndpoint }
    console.log("Bigchain Request: " + JSON.stringify(theobj))

    contract.BigChainQuery(JSON.stringify(theobj), keccak_256(fromPubKey).toUpperCase(), function (error, result) {
        console.log("bigchain query called");
        var theEvent;
        contract.CallbackReady(function (error, result) {
            theEvent = result;
        },
            function (error, result) {
                console.log("callback ready called");
                if (keccak_256(fromPubKey).toUpperCase() == result.args.addr) {
                    console.log("callbackready: " + JSON.stringify(result))

                    contract.myCallback(keccak_256(fromPubKey).toUpperCase(), function (error, result) {

                        console.log("RESULT: " + result);
                        var bigchainID = JSON.parse(result).response;
                        console.log("\nResult.response: " + bigchainID)
                        bigchainID = JSON.parse(bigchainID).id;
                        var bigchainHash = keccak_256(JSON.parse(result).response);

                        var signature = JSON.parse(result).signature
                        var msg = JSON.parse(result).msg
                        var pubKey = JSON.parse(result).pubKey
                        console.log("pubkey returns is ......: " + pubKey)

                        //verify oraclizer signature
                        var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
                        console.log(logme)

                        //for debugging--ignore:
                        if (logme == true) {
                            console.log("logme is the bool true");
                        }
                        else {
                            console.log("logme is not bool true but if this says true, it is a string: " + logme)
                        }

                        callback(result, bigchainID, bigchainHash)

                        //stop event listening
                        theEvent.stop();

                    })//end calling of myCallback

                }//end if statement

            })//end callback listening

    })//end bigchain query
}//end bigchain transfer

function bigchainTransferFile(toPubKey, fromPubKey, callback) {
    //var thePubkey = ErisAddress;
    var bigchainEndpoint = 'transferFile';
    var bigchainInput = {
        "toPubKey": toPubKey,
        "fromPubKey": fromPubKey
    }
    var theobj = { "method": "POST", "stringJsonData": JSON.stringify(bigchainInput), "endpoint": bigchainEndpoint }
    console.log("Bigchain Request: " + JSON.stringify(theobj))

    contract.BigChainQuery(JSON.stringify(theobj), keccak_256(fromPubKey).toUpperCase(), function (error, result) {
        console.log("bigchain query called");
        var theEvent;
        contract.CallbackReady(function (error, result) {
            theEvent = result;
        },
            function (error, result) {
                console.log("callback ready called");
                if (keccak_256(fromPubKey).toUpperCase() == result.args.addr) {
                    console.log("callbackready: " + JSON.stringify(result))

                    contract.myCallback(keccak_256(fromPubKey).toUpperCase(), function (error, result) {

                        console.log("RESULT: " + result);

                        callback(JSON.parse(result).response)

                        //stop event listening
                        theEvent.stop();

                    })//end calling of myCallback

                }//end if statement

            })//end callback listening

    })//end bigchain query
}//end bigchain transferFile


//this service never stops
var queryAddr;
var currentQuery;
var endpoint;
var bigchainDataStringified;
var theMethod; //this is “true” or “false”, if the request requires data
var response;

var inProgress = 0;


//continuous listening for requestMade event
contract.requestMade(
    function (error, result) {
        //do nothing, we never want the event listening to stop
    },
    function (error, result) {
        //check if in progress
        var shouldProcess = waitingList.indexOf(result.args.addr);
        console.log("should process: " + shouldProcess);
        console.log("result: " + JSON.stringify(result.args.addr));
        console.log("wait list: " + waitingList);
        if (inProgress == 0 && shouldProcess >= 0) {
            setTimeout(function () {
                Process();
            }, 100)
        }
    }
)


//continuous listening for CallbackReady event
contract.CallbackReady(
    function (error, result) {
        //do nothing, we never want the event listening to stop
    },
    function (error, result) {
        //check if in progress
        var shouldProcess = waitingList.indexOf(result.args.addr);
        console.log("should process callbackready: " + shouldProcess);
        if (inProgress == 0 && shouldProcess >= 0) {
            setTimeout(function () {
                Process();
            }, 100)
        }
    }
)


function Process() {

    contract.listIsEmpty(function (error, result) {

        //this is the result for listIsEmpty
        var emptyList = result;
        console.log(emptyList)

        if (emptyList == false) {
            inProgress = 1;

            //get current query and address

            contract.getCurrentInList(function (error, result) {

                queryAddr = result;
                console.log(queryAddr + " is current in list")

                contract.getRequestByPubKey(queryAddr, function (error, result) {

                    currentQuery = result;
                    console.log(result + " is request by address");
                    currentQuery = JSON.parse(currentQuery);

                    endpoint = currentQuery.endpoint;
                    console.log(endpoint + " is the endpoint")
                    bigchainDataStringified = currentQuery.stringJsonData;

                    theMethod = currentQuery.method;
                    console.log(theMethod + " is the method")
                    console.log(bigchainDataStringified)
                    //where the response will be stored
                    var theResponse;

                    //query bigchain
                    if (theMethod == 'GET')//just a get
                    {
                        console.log("get requesting")
                        console.log(bigchainServer + endpoint)
                        request({
                            method: 'GET',
                            url: bigchainServer + endpoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: bigchainDataStringified //can be null if none required
                        }, function (error, response, body) {

                            var theResponse1 = body;
                            console.log(body)
                            createSignature(theResponse1, function (signature, pubKey, hash) {

                                console.log(theResponse1 + " was the response")

                                theResponse = { "response": theResponse1, "pubKey": pubKey, "signature": signature, "msg": hash }
                                theResponse = JSON.stringify(theResponse)

                                console.log("Response with signature: " + theResponse)

                                contract.setCurrentInList(queryAddr, theResponse, function (error) {
                                    inProgress = 0;

                                    console.log("the mutex should be zero: " + inProgress)
                                });
                                console.log(theResponse1)

                            })

                        });
                    }
                    else {
                        console.log("POST URL: " + bigchainServer + endpoint);
                        request({
                            method: 'POST',
                            url: bigchainServer + endpoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: bigchainDataStringified
                        }, function (error, response, body) {

                            var theResponse1 = body;
                            console.log(theResponse1)
                            createSignature(theResponse1, function (signature, pubKey, hash) {

                                console.log(theResponse1 + " was the response")

                                theResponse = { "response": theResponse1, "pubKey": pubKey, "signature": signature, "msg": hash }
                                theResponse = JSON.stringify(theResponse)

                                console.log("Response after signature: " + theResponse)

                                contract.setCurrentInList(queryAddr, theResponse, function (error) {
                                    inProgress = 0;

                                    console.log("The mutex should be zero: " + inProgress)
                                });

                            })
                        });
                    }


                })//end contract.getRequestByAddress

            })//end contract.getCurrentInList

        }//end if statement

    })//end contract.listIsEmpty

}//end recursive function

// the pubkey stored in the waiting list is hashed
//change name to postRequest later
app.post("/preRequest", function (req, res) {
    console.log("req: " + req.body);
    var formdata = req.body;
    waitingList.push(keccak_256(formdata.pubKey).toUpperCase());
    bigchainPost(formdata.pubKey, formdata.proposalID, JSON.parse(formdata.data), formdata.blockNumber, formdata.blockHash, formdata.blockchainID, formdata.timestamp, formdata.validatorSigs, formdata.serviceSig, function (result, theId, theHash) {
        var ret = {
            theId: theId,
            theHash: theHash
        }
        res.send(ret);
    }, formdata.bigchainID, formdata.bigchainHash)
    // console.log(result); 

})

app.post("/getRequest", function (req, res) {
    console.log("GET req: " + req.body);
    var formdata = req.body;
    waitingList.push(keccak_256(formdata.pubKey).toUpperCase());
    bigchainGet(formdata.pubKey, formdata.txid, function (getResult, getId, getHash) {
        var ret = {
            'getResult': getResult,
            'getId': getId,
            'getHash': getHash
        }
        console.log("sending file:\n" + JSON.stringify(ret));
        res.send(ret);
    })
})

app.post("/transferRequest", function (req, res) {
    console.log("req: " + req.body);
    var formdata = req.body;
    waitingList.push(keccak_256(formdata.fromPubKey).toUpperCase());
    bigchainTransfer(formdata.toPubKey, formdata.fromPubKey, formdata.txid, formdata.flag, function (getResult, getId, getHash) {
        var ret = {
            'transferResult': getResult,
            'transferId': getId,
            'transferHash': getHash
        }
        res.send(ret);
    })
})

app.post("/transferFileRequest", function (req, res) {
    console.log("req: " + req.body);
    var formdata = req.body;
    waitingList.push(keccak_256(formdata.fromPubKey).toUpperCase());
    bigchainTransferFile(formdata.toPubKey, formdata.fromPubKey, function (result) {
        res.send(result);
    })
})

app.listen(3018, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3018");
})

