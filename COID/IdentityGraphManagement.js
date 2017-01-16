'use strict'

var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256

//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')

//required library for accessing the contract
var erisC = require('eris-contracts');


//REMEMBER TO ADD PROOF OF CORRECT EXECUTION



var addrList = [];
var contractList = [];
var mutexList = [];

function registerContract(contractAddress)
{
        createContract(contractAddress, function()
        {
                //continuous event listening
        })
}

function createContract(contractAddress, callback)
{
        //TODO: consider making some of the below global
        //get the contract:
        var chain = 'primaryAccount'
        var erisdburl = chainConfig.chainURL
        var contractData = require('./epm.json')
        var contractAddr = contractAddress
        console.log("contract addr: " + contractAddr)
        var contractAbiAddress = this.contractData['CoreIdentity'];
        var erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAbiAddress));
        var accountData = require("./accounts.json");
        var contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
        var contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

        //add the contract 
        contractList.push(contract);
        mutexList.push(true);
        addrList.push(contractAddress);

        callback(); // to allow synchronous calling of this function
}

//todo: remember list must be nonempty; check async!
function getContract(contractAddr)
{
        var returnMe;
        for(var i = 0; i < addrList.length;i++)
        {
                if(addr[i] == contractAddr)
                {
                        returnMe = contractList[i];
                }
        }
        return returnMe;
}
//todo: remember list must be nonempty; check async!
function getMutex(contractAddr)
{
        var returnMe;
        for(var i = 0; i < addrList.length;i++)
        {
                if(addr[i] == contractAddr)
                {
                        returnMe = mutexList[i];
                }
        }
        return returnMe;
}




//recursive function to be called each time an event is triggered.
//todo: check async
//todo: input contract instead of contractAddress?
function implementTransactions(contractAddress)
{
        //first get the mutex
        var mutex = getMutex(contractAddress)
        var contract = getContract(contractAddress)
        
        if(mutex)
        {
                mutex = false;
                
                //1. check if list is empty
                //2. 
                
                
                mutex = true;
                implementTransactions(contractAddress);
        }
        
}
