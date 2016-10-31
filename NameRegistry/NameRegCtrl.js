'use strict'


var contracts = require('eris-contracts');
var fs = require('fs');
var http = require('http');
var app = require('express')();
var bodyParser = require('body-parser');
var accounts = require('./accounts.json');
//for verification
var crypto = require("crypto");
var ed25519 = require("ed25519");

var server = http.createServer(app);

var chainUrl;
var manager;
var contract;
var server;

app.set('trust proxy', true);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var ErisAddress = accounts.newchain2_full_000.address;
console.log(ErisAddress);

//********************All abi and adress go here
var identity_address = require('./epm.json').identity
var identity_abi = JSON.parse(fs.readFileSync('./abi/' + identity_address, 'utf8'))

var requester_address = require('/home/demoadmin/.eris/apps/SOLIDITY/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK
var requester_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/SOLIDITY/VerifyOraclizerEthereum/wallet2/abi/' + requester_address, 'utf8'))

var validate_address = require('./epm.json').validator
var validate_abi = JSON.parse(fs.readFileSync('./abi/' + validate_address, 'utf8'))

var bigchain_query_addr = require('/home/demoadmin/.eris/apps/SOLIDITY/BigchainOraclizer/epm.json').deployStorageK
var bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/SOLIDITY/BigchainOraclizer/abi/' + bigchain_query_addr, 'utf8'))


//URL to the rpc endpoint of the eris-db server
chainUrl = 'http://localhost:1337/rpc'


//Instantiate the contract object manager using the chain URL
//and the account data.
var manager_full = contracts.newContractManagerDev(chainUrl, accounts.newchain2_full_000)

// Instantiate the contract object using the ABI and the address.
//var contract_full = manager_full.newContractFactory(abi).at(address)
//var contract = manager_full.newContractFactory(abi).at(address)

// **************************Instantiate the contract object using the ABI and the address.
var identity_contract = manager_full.newContractFactory(identity_abi).at(identity_address)
var VerificationContract = manager_full.newContractFactory(requester_abi).at(requester_address)
var validate_contract = manager_full.newContractFactory(validate_abi).at(validate_address)
var bigchain_contract = manager_full.newContractFactory(bigchain_abi).at(bigchain_query_addr)




//this is for verification:
function verifyIt(msg, sig, pubKey, callback)
{
    VerificationContract.VerificationQuery(msg,sig,pubKey, function(error,result)
    {

        var elEvento;

        VerificationContract.CallbackReady(function(error,result){elEvento = result;},function(error,result)
        {
            if(ErisAddress = result.args.addr)
            {
                VerificationContract.myCallback(function(error,result)
                {
                        callback(result);
                        elEvento.stop();
                })//end myCallback
            }
        })  //end CallbackReady.once
    })//end VerificationQuery
}
//end verification





//for writing into bigchaindb:
function bigchainIt(payload, callback)
{
    var thePubkey = "" + accounts.new_chain_root_000 //public key
        console.log(thePubkey)
    
    var bigchainInput = payload;//should be a string json object
    

    var bigchainEndpoint = 'addData/' + '12321' + '/1'

    var theobj = {"method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint}
   // console.log(JSON.stringify(theobj))

    bigchain_contract.BigChainQuery(JSON.stringify(theobj),function(error,result){

        var theEvent;

        bigchain_contract.CallbackReady(function(error,result){theEvent = result;},function(error,result){

            if(ErisAddress == result.args.addr)
            {

                //console.log(result.args.addr + JSON.parse(accounts.newchain_root_000).pubKey)

                bigchain_contract.myCallback(function(error,result){

                console.log(result)

                var signature = JSON.parse(result).signature
                var msg = JSON.parse(result).msg
                var pubKey = JSON.parse(result).pubKey
                console.log("pubkey returns is ......: " + pubKey)
                console.log("pubkey is supposed to be: " + "C01382EE2C4522B0857B4B4E2F2935A558238AEC9ACD7BE449BF253D3202AE88")

                //verify oraclizer signature
                var logme = ed25519.Verify(new Buffer(msg),new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
                console.log(logme)
                if(logme != "false")
                {
                    callback(result)
                }
                theEvent.stop();
            })
            }//end if statement
        })

    })

}



app.post("/toRegister", function(req, res) {

    var body = ''
    var username
    var nameRegAddress
    var random
    var alternative
    //*********var
    var requestInfo
    var thePubkey
    var theMessage
    var theSignature
    var input
    var requesterResult
    var validateResult

    //    var stop = false;
    var availability

            console.log('********************************************')
            body = JSON.parse(req.body)

            console.log('body after JSON parse ' + body)
            console.log('********************************************')


            username = body.name


            nameRegAddress = body.address
            //publickey = body.pubkey

            // ******************
            thePubkey = body.pub
            theMessage = body.msg
            theSignature = body.sig
            input = body.input


            // ******************Get user inpur for verifyRequester


            //requestInfo = { "pub": thePubkey, "msg": theMessage, "sig": theSignature }

            requestInfo = { "pub": thePubkey, "msg": theMessage, "sig": theSignature, "input": input, "name": username, "address": nameRegAddress }
            requestInfo = JSON.stringify(requestInfo)
            console.log("made this json obj: " + requestInfo)
            //****************************Test fot verifyRequester***************//
            
            verifyIt(theMessage,theSignature,thePubkey,function(result){

                        //  console.log(JSON.parse(result).Response)
                        requesterResult = result;
                        console.log("This is the result for verification: " + requesterResult + "\n");
                       // response.write("This is the result for verification: " + requesterResult + "\n");

                        // bigchain logic
                        bigchainIt(requestInfo,function(result)
                        {
                            console.log(result);
                        })


                        // *************check transaction type if the requesterResult is true
                        // The requesterResult is a string
                        if (requesterResult == "true") {

                            validate_contract.checkTxs(input, username, function (error, result1) {
                                validateResult = JSON.parse(result1).toString();
                                console.log("This is the result for validating transaction type:" + validateResult + "\n");
                               // response.write("This is the result for validating transaction type:" + validateResult + "\n");


                                // ***********************call NameReg contract if the transaction type is true
                                // which the transactio type will be NamespaceRegister


                                // The validateResult is a string
                                if (validateResult == "true") {


                                    nameRegAddress = "DCA1DB1ED0DE30CCCC8D2DA9501BAEB7369FAF1B";
                                    identity_contract.toRegister(nameRegAddress, username, thePubkey, function (error, result) {
                                        console.log("This is the result for checking namespace: " + result + "\n");
                                        //get back result to user
                                       // response.write("This is the result for checking namespace: " + result + "\n");
                                       // response.write("You have been registered!");
                                        if (result == false) {
                                            random = Math.floor(Math.random() * 101);
                                            alternative = username.concat(random);
                                            do {

                                                identity_contract.checkAvailable(nameRegAddress, alternative, thePubkey, function (error, result1) {
                                                    availability = result1;
                                                    if(availability == true)
                                                    {
                                                  
                                res.end();
                                                    }
                                                }

                                                )
                                            } while (availability == false);
                                            //    contract.
                                            console.log("You name is already taken, you can use: " + alternative);
                                            res.send("You name is already taken, you can use: " + alternative + "\n");

                                        }
                                        else
                                        {
                                               res.send("You have been registered!"); 
                                        }


                                    })

                                } // end of the last if statement

                                else {


                                    console.log("Your transaction type is invalid. If you want to register a name, please enter 'NamespaceRegister'. ");
                                    res.send("Your transaction type is invalid. If you want to register a name, please enter 'NamespaceRegister'. ");

                                }

                                //**********Test here

                            })


                        } // end of the second if statement


                        else {

                            console.log("Invalid information provided; check your public key, message and signature are right.\n ");
                            res.send("Invalid information provided; check your public key, message and signature are right.\n ");
                        }


                        //***** response.end()

                    }) // end of verify it




});

server.listen(8003, function(){
  console.log('Listening for HTTP requests on port 8003.');
});
