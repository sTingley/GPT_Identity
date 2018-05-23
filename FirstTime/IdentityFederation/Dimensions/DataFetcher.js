'user strict'
// requires
var fs = require ('fs');
var prompt = require('prompt');
var erisC = require('eris-contracts');
var request = require('request');
//var superAgent = require("superagent");
// NOTE. On Windows/OSX do not use localhost. find the
// url of your chain with:
// docker-machine ls
// and find the docker machine name you are using (usually default or eris).
// for example, if the URL returned by docker-machine is tcp://192.168.99.100:2376
// then your erisdbURL should be http://192.168.99.100:1337/rpc
var erisdbURL = "http://localhost:1337/rpc";
// get the abi and deployed data squared away
var contractData = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json');
var idisContractAddress = contractData["deployStorageK"];
var idisAbi = JSON.parse(fs.readFileSync("/home/demoadmin/.eris/apps/BigchainOraclizer/abi/" + idisContractAddress));
// properly instantiate the contract objects manager using the erisdb URL
// and the account data (which is a temporary hack)
var accountData = require('./accounts.json');
var contractsManager = erisC.newContractManagerDev(erisdbURL, accountData.tuesday4_full_000);
// properly instantiate the contract objects using the abi and address
var idisContract = contractsManager.newContractFactory(idisAbi).at(idisContractAddress);
var DataFetcher = 
{
    getData: function(txID, callback)
    {
        //BIGCHAIN ENDPOINT:
        var endPoint = 'getTransaction/' + txID;
        //IPFS txID are 34 cahr long. alternatively, they starts with "QM"
        if(txID.length == 34)
        {
            callback(txID);
        }
        else
        {
            //Call Bigchain Oraclizer
            //var bigchainEndpoint = 'addData/' + thePubkey + '/1'
            var requestInfo = { "method": "GET", "stringJsonData": "", "endpoint": endPoint };//json obj
            idisContract.BigChainQuery(JSON.stringify(requestInfo),function(error,result)
            {
                var theEvent;
                //listen for when callback if ready so that we can retrieve a non-empty responce
                idisContract.CallbackReady(
                    function(error,result)//allows listening to event
                    {
                        theEvent = result;//allows you to control event listening
                    },
                    function(error,result)//what happens when event occurs
                    {
                        idisContract.myCallback(function(error,result)// call to myCallBack() defined in the contract
                        {
                            //TODO: CHECK PUBLIC KEY
                            theEvent.stop();//stop event listening
                            callback(result)//get the JSON string from the contract
                        })
                    }
                )
            })
        }
    }
}
module.exports = DataFetcher;
