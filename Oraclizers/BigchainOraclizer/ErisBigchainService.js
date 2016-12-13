'use strict'

//grab the chain configuration:
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
console.log("Chain Configuration Account: " + chainConfig.primaryAccount)
console.log("Chain URL: " + chainConfig.chainURL)

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
        if (inProgress == 0) {
            setTimeout(function () {
                Process();
            }, 100)
        }
    })


//continuous listening for CallbackReady event
contract.CallbackReady(
    function (error, result) {
        //do nothing, we never want the event listening to stop    
    },
    function (error, result) {
        //check if in progress
        if (inProgress == 0) {
            setTimeout(function () {
                Process();
            }, 100)
        }
    })


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

                contract.getRequestByAddress(queryAddr, function (error, result) {

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


