'use strict'

var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json');

var erisContracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')
var express = require('express')
var bodyParser = require('body-parser');
var morgan = require('morgan');

//for sending a notification
var superAgent = require("superagent");

//for verification
var crypto = require("crypto")
var ed25519 = require("ed25519")

//this library is needed to calculate hash of blockchain id (chain name) and bigchain response
var keccak_256 = require('js-sha3').keccak_256;

//These variables are for creating the server
var hostname = 'localhost';

var Web3 = require('web3')
var web3 = new Web3(chainConfig.chainURL);
web3.setProvider(chainConfig.chainURL);

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

        var recoveryContract;
console.log("Provider: "+web3.eth.currentProvider);
        //var contractByteCode=fs.readFileSync("./Recovery.bin");// = web3.eth.getCode('C38C22F0942518191B8AB4287DEC2B453369D999');//fs.readFileSync("./Recovery.bin");
        //var code = "603d80600c6000396000f3007c01000000000000000000000000000000000000000000000000000000006000350463c6888fa18114602d57005b6007600435028060005260206000f3";
        var MyGKaddr = '2EE51E81DABB330CE43C927BDF82B8A7B6234ECB';
        var chain = 'primaryAccount';
        var erisdburl = chainConfig.chainURL;
        var contractData = require("./epm.json");
        var contractAbiAddress = contractData['Recovery'];
        var erisAbi = JSON.parse(fs.readFileSync("./abi/" + contractAbiAddress));
        var accountData = require("./accounts.json");
        var contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
        //var recoveryContract = web3.contract.Contract(erisAbi).at('9F008B829DA7AFB6DCDD64EC3D84DF22BDD85BF7')//contractMgr.newContractFactory(erisAbi).at('9F008B829DA7AFB6DCDD64EC3D84DF22BDD85BF7');
        var recoveryContractFactory = contractMgr.newContractFactory(erisAbi);
        console.log("--------------------------------------------------------------------");


        //idf
        // var COIDabiAddr = contractData['CoreIdentity'];
        // var abi_COID = JSON.parse(fs.readFileSync('./abi/' + COIDabiAddr))
        // var COIDcontract = contractMgr.newContractFactory(abi_COID).at('21AF36D9FC7D82E2F8EB781644CC9492FDD50813')

        // COIDcontract.recoverGetAll(function(error,results){
        //     for(var x=0;x<results.length;x++){console.log("res "+x+": \n"+results[x])}

        // })
        // COIDcontract.getUniqueID(function(error,result){
        //     console.log("getU:\n"+result);
        // })





        //coid contract variables    
        var newOwner = '03221f4a806b9bf2a59b41a763b3d969ef1ccc86627f330c33dfbaae34865be849';
        var newOwnerHash = keccak_256(newOwner).toUpperCase();
        var oldOwner = '02200a2359fd3dc7ce392137a056dd314326608439cb1f407d38910be69ccf789b';
        var oldOwnerHash = '6fccf99758c479a093bda9f5acf5e7432b2478078d3079a0422c1120f522f8fe'.toUpperCase();

        //make my new Coid contract
        var coidAddress = contractData['CoreIdentity'];
        var coidAbi = JSON.parse(fs.readFileSync("./abi/" + coidAddress));
        var coidContractFactory = contractMgr.newContractFactory(coidAbi);
        var oldCOIDAddress = '311963C5FE2EA76DA948EA68BB846611957D8633';// check name
        var oldCOIDcontract = contractMgr.newContractFactory(coidAbi).at(oldCOIDAddress);
        var COIDcontract;
	var byteCode = fs.readFileSync("./CoreIdentity.bin");
        coidContractFactory.new({data:byteCode},function (error, contract) {
            if (error) {
                console.log("\nerror creating recovery contractn\n");
                throw error;
            }
            COIDcontract = contract;
            console.log("new coid contract addr: " + JSON.stringify(COIDcontract))

            //get new values-----------------------------------------------------------------------------------------------------------------------------
            oldCOIDcontract.recoverGetAll(function (error, result) {
                var coidData = result;
                console.log("recov data"+coidData)
                //set new values-----------------------------------------------------------------------------------------------------------------------------
                COIDcontract.setUniqueID(coidData[0], coidData[1], coidData[2], coidData[3], function (error) {
                    //debugging function (getIt)
                    COIDcontract.getIt(function (error, result) {
                        console.log("setUniqueID: " + result);

                        var indexO = coidData[4].indexOf(oldOwnerHash);
                        if (indexO != -1) { coidData[4][indexO] = newOwnerHash; }
                        COIDcontract.setOwnership(coidData[4], coidData[5], function (error) {
                            //debugging function (getIt)
                            COIDcontract.getIt(function (error, result) {
                                console.log("setOwnership: " + result);

                                var indexO = coidData[6].indexOf(oldOwnerHash);
                                if (indexO != -1) { coidData[6][indexO] = newOwnerHash; }
                                COIDcontract.setControl(coidData[7], coidData[6], function (error) {

                                    //debugging function (getIt)
                                    COIDcontract.getIt(function (error, result) {
                                        console.log("setControl" + result);

					var indexR = coidData[8].indexOf(oldOwnerHash);
                                        if (indexR != -1) { coidData[8][indexR] = newOwnerHash; }
                                        COIDcontract.setRecovery(coidData[8], coidData[9], function (error, result) {

                                            //debugging function (getIt)
                                            COIDcontract.getIt(function (error, result) {
                                                console.log("setRecovery: " + result);

                                                COIDcontract.StartCoid(function (error, result) {
                                                    console.log("startCoid1: " + result);
                                                    COIDcontract.recoverGetAll(function(error,results){
                                                        for(var x=0;x<results.length;x++){console.log("New res "+x+": \n"+results[x])}
                                                    })

                                                })//end StartCoid

                                            })//end getIT

                                        })//end setRecovery

                                    })//end getIT

                                })//end setControl

                            })//end getIT

                        })//end setOwnership

                    })//end getIT

                })//end setUniqueID

            })//end setUniqueID


        })//end contract creation
    

        //var recoverContract2 = recoveryContract.clone();
        //recoveryContract.getBytes('9F008B829DA7AFB6DCDD64EC3D84DF22BDD85BF7',function(error,result){


        //console.log("got bytes\n"+result);
        //contractByteCode = result;


         //recoveryContractFactory.new({data:contractByteCode}, function (error, contract) {
           //      if (error) {
             //        console.log("\nerror creating recovery contractn\n");
               //      throw error;
                 //}
                //recoveryContract = contract;
                //console.log("recovery contract addr: " + JSON.stringify(recoveryContract2))
                //recoveryContract = recoveryContractFactory.at(contract.address);

                //recoveryContract.setHasRecovered(function(error){
                  //  console.log("set:" + error);
                    //recoveryContract.getHasRecovered(function(error,result){
                      //  console.log("Get Recovered: "+error + "     " + result);
                    //})
                //})
        //})


        //})//getbytey



