'use strict'

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

//*DEBUG--does this cause errors?
var crypto = require('crypto')
var secp256k1 = require('secp256k1')
var keccak_256 = require('js-sha3').keccak_256
var ed25519 = require('ed25519')//for oraclizer signature generation

//API for chain
chainUrl = 'http://localhost:1337/rpc'
//instantiate contract object manager (uses chain URL and account data)
manager = contracts.newContractManagerDev(chainUrl, accounts.newchain4_full_000)
//Make the contract object using ABI and address of deployed contract
contract = manager.newContractFactory(abi).at(address)

//events use this to take action or not
var inProgress = 0;

//these are for the function Process
var queryAddr;
var currentQuery;
var response;


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
            //get current query and address

            inProgress = 1;

            contract.getCurrentInList(function (error, result) {

                queryAddr = result;
                console.log(queryAddr + " is current in list")

                contract.getRequestByAddress(queryAddr, function (error, result) {
                    var msg = "";
                    var signature = "";
                    var pubKey = "";

                    var elResulto = result.toString().split(",");
                    msg = elResulto[0];
                    signature = elResulto[1];
                    pubKey = elResulto[2];
                    console.log("msg: " + msg);
                    console.log("sig: " + signature);
                    console.log("pubKey: " + pubKey);
                    //where the response will be stored
                    var theResponse = verify(msg, signature, pubKey).toString();
                    console.log("response is: " + theResponse);
                    console.log("query addr is: " + queryAddr);
                    contract.setCurrentInList(queryAddr, theResponse, function (error) {
                        inProgress = 0;
                    });

                })//end contract.getRequestByAddress

            })//end contract.getCurrentInList

        }//end if statement


    })//end contract.listIsEmpty

}//end recursive function


//verify function
function verify(msg, signature, pubKey) {
    //INPUT msg: This is a hex string of the message hash from wallet
    //INPUT signature: This is a hex string of the signature from wallet
    //INPUT pubKey: This is a hex string of the public key from wallet
    
    //convert all to buffers:
    msg = new Buffer(msg, "hex");
    signature = new Buffer(signature, "hex");
    pubKey = new Buffer(pubKey, "hex");
    var verified = secp256k1.verify(msg, signature, pubKey)
    return verified;
    
}



