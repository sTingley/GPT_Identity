'use strict'


//May need to change var db and these configurations
var Trie = require('merkle-patricia-tree')
var levelup = require('levelup')
var db = levelup('./testdb')

//Hashing and filesync libraries
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256


//Required library for accessing the contract
var erisC = require('eris-contracts');

//Grab the Chain Configuration
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json');
var chain = 'primaryAccount';
var erisdburl = chainConfig.chainURL;
var contractData = require("./epm.json");
var contractMgr = erisC.newContractManagerDev(erisdburl, chainConfig[chain]);

//GET THE BIGCHAIN ORACLIZER CONTRACT:
var bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
var bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
var bigchain_contract = contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)

//GET THE VERIFICATION ORACLIZER CONTRACT:
var VerificationAddress = require('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
var VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
var VerificationContract = contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)

//***TODO: GET THE UTILITY CONTRACT:
var UtilityAddress;
var UtilityABI;
var EventUtilitiesContract;

//For the Identity Graph Contract
var GraphAddress;
var GraphABI;



//-> -> -> START PM TRIE FUNCTIONS -> -> ->
//-> -> -> -> -> -> -> -> -> -> -> -> -> ->

//todo: test if the callback works as described
function PUT(trie,key,val,callback)
{
    trie.put(key,val,function(err,value)
    {
        callback(err,value)
    })
}

//todo: test if the callback works as described
function GET(trie,key,val,callback)
{
    trie.GET(key,val,function(err,value)
    {
        callback(err,value)
    })
}

// <- <- <- <- <- <- <- <- <- <- <- <- <-
// <- <- <- END PM TRIE FUNCTIONS <- <- <-




// -> -> -> LISTEN TO THE UTILITY CONTRACT EVENT -> -> ->
var listening;

EventUtilitiesContract.triggered(
    function(error,result)
    {
        listening = result;//this grabs the command to listen to the event.
    },
    function(error,result)
    {
        //the code here is executed every time an event is triggered in the utility contract
        
        //1. get the data
        
    })
// <- <- <- END UTILITY CONTRACT EVENT LISTENING <- <- <-






// -> -> -> RECURSIVE HELPER FUNCTION ON A CONTRACT -> -> ->
// -> -> -> -> -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
function processList(contractAddr)
{
    //get the contract
    var GraphContract = getIdentityGraph(contractAddr);
    
    //get the mutex
    GraphContract.getMutex(function(error,result)
    {
        //if the mutex is true, proceed
        if(result == true)
        {
            //set the mutex false to indicate already processing
            GraphContract.setMutex(false,function(error,result)
            {
                //see if the list of operations from the contract is empty
                GraphContract.listIsEmpty(function(error,result)
                {
                    //if the list is not empty, proceed    
                    if(result == false)
                    {
                            GraphContract.getCurrent(function(error,result)
                            {
                                //make result json
                                
                                
                                //route to the appropriate pm function
                                
                                
                                //now, add to bigchain
                            })
                    }
                })
            })
        }
    })
    
    
}
// <- <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-
// <- <- <- END RECURSIVE HELPER FUNCTION <- <- <-


//Helper function, gives you the relevant IdentityGraph contract
function getIdentityGraph(contractAddr)
{
    //TODO: add stuff here
    return
}




//REMEMBER TO ADD PROOF OF CORRECT EXECUTION




//mutex here?????? parallel writes???????????
//for writing into the bigchain oraclizer
 //this is for bigchain writing

function bigchainWrite(Trie,prevID,callback) 
{

    //TODO: get public key
    var thePubkey;
        
    console.log("In function bigchainIt, pubKey of eris account is: " + thePubkey)

    var bigchainInput = {"Trie": input, "prevID": prevID}


    var bigchainEndpoint = 'addData/' + thePubkey + '/1'
    var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint }
    console.log("Bigchain Request: " + JSON.stringify(theobj))

    bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) 
    {

            var theEvent;
            bigchain_contract.CallbackReady(function (error, result) 
            {
                theEvent = result;
            },
            function (error, result) 
            {

                    if (thePubkey == result.args.addr) 
                    {

                        bigchain_contract.myCallback(function (error, result) 
                        {

                            console.log("RESULT: " + result);
                            var bigchainID = JSON.parse(result).response;
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
}
