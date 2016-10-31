'use strict'

//morgan and express are for working with contracts
//fs is to parse the json information from the epm

var erisContracts = require('eris-contracts')
var fs = require('fs')
//var http = require('http')
var express = require('express')
var bodyParser = require('body-parser');
var morgan = require('morgan');

//for verification
var crypto = require("crypto")
var ed25519 = require("ed25519")

//this library is needed to calculate hash of blockchain id (chain name)
var keccak_256 = require('js-sha3').keccak_256;


//These variables are for creating the server
//var hostname = 'localhost';


//defining the express app
var app = express();
app.use(morgan('dev'));

//app.use(bodyParser.json());


app.set('trust proxy', true);

//allow CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, application/json-rpc");
    next();
});
//for url encoded or json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(morgan('dev'));


//Instantiate validateTX function
var validateTX = function () {

    //Debugging Comment:
    console.log("A validateTX object has just been instantiated")

    //chain definition
    this.chain = 'newchain4_full_000';
    this.erisdburl = "http://10.100.98.218:1337/rpc";
    this.contractData = require("./epm.json");
    //'ValidateTX' is name of deploy job from epm.json
    this.contractAddress = this.contractData['ValidateTX'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, this.accountData[this.chain]);
    this.ValidateTxContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/demoadmin/Migration_from_Eris/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/Migration_from_Eris/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = this.accountData[this.chain].address;

    //use this to have the validateTX scope inside functions
    var _this = this;

	//for digital signature verification of requester by Digital Twin
    this.verifyIt = function (formdata) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var sync = true;
        var isValidResult = false;
        console.log("you have reached verifyIt internal function")
        console.log(msg)
        console.log(sig)
        console.log(pubKey)
        
        //submission of requester digital signature for verification
        _this.VerificationContract.VerificationQuery(msg, sig, pubKey, function (error, result) {
            
            //capture the event listening in the first callback function for event listening
            var elEvento;
            //waiting for CallbackReady event to trigger
            _this.VerificationContract.CallbackReady(function (error, result) { elEvento = result; }, function (error, result) {
                //listening for event only for the ErisAddress of the 
                if (_this.ErisAddress = result.args.addr) {
                    _this.VerificationContract.myCallback(function (error, result) {
                        
                        //stop listening when addresses match
                        elEvento.stop();
                        console.log("Received response from VerifyIt :" + result + "...if that says false, you should not be able to Result0,etc.!!!");
                        isValidResult = result;
                        //end synchronous execution
                        sync = false;
                    })//end myCallback

                }
            })  //end CallbackReady.once


        })//end VerificationQuery
        
        //a 100 ms wait state to make sure events are processed one-by-one
        while (sync) { require('deasync').sleep(100); }
        return isValidResult;
    } //end verification
	
	
	//validate trxn element by element
    this.validateTx = function (formdata) {
        var txn_type = formdata.txn_type;
        var txn_attributes = formdata.txn_attributes;
        var trxn_attribute_value = formdata.trxn_attribute_value;
		
        var sync = true;
        var isValidResult = false;
        console.log("you have reached validateTx internal function")
        console.log(txn_type)
        console.log(txn_attributes)
        console.log(trxn_attribute_value)
        
        //submission of requester digital signature for verification
        _this.ValidateTxContract.validateTransactionElement(txn_type, txn_attributes, trxn_attribute_value) {
            
            //capture the event listening in the first callback function for event listening
            var elEvento;
            //waiting for CallbackReady event to trigger
            _this.ValidateTxContract.CallbackReady(function (error, result) { elEvento = result; }, function (error, result) {
                //listening for event only for the ErisAddress of the 
                if (_this.ErisAddress = result.args.addr) {
                    _this.ValidateTxContract.myCallback(function (error, result) {
                        
                        //stop listening when addresses match
                        elEvento.stop();
                        console.log("Received response from validateTx :" + result + "...if that says 0,1,2, you should not be able to Result0,etc.!!!");
                        isValidResult = result;
                        //end synchronous execution
                        sync = false;
                    })//end myCallback

                }
            })  //end CallbackReady.once


        })//end validateTransactionElement
        
        //a 100 ms wait state to make sure events are processed one-by-one
        while (sync) { require('deasync').sleep(100); }
        return isValidResult;
    } //end ValidateTx
}	
	server = http.createServer(function (request, response) {

		if (request.method == 'POST' && request.url == '/validatetxelement') {
         
			request.on('data', function (chunk) {
				body += chunk
				console.log(body)
			})

			request.on('end', function () {
				body = JSON.parse(body)
				var result = this.verifyIt(body);

				if(result){
					var validateTxResult = this.validateTx(body);

					if(validateTxResult == 0){
						response.write("Transaction not defined! Transaction can proceed!");
						console.log("Transaction not defined! Transaction can proceed!");
					}else if(validateTxResult == 1){
						response.write("Transaction validated! Transaction can proceed");
						console.log("Transaction validated! Transaction can proceed");
					}else if(validateTxResult == 2){
						response.write("Transaction invalid! Transaction cannot proceed");
						console.log("Transaction invalid! Transaction cannot proceed");
					}
				}
			})// end request
		}// end "/validatetxelement"

		if (request.method == 'POST' && request.url == '/addtxrule') {
         
			request.on('data', function (chunk) {
				body += chunk
				console.log(body)
			})

			request.on('end', function () {
				body = JSON.parse(body)
				var result = this.verifyIt(body);

				if(result){
					var validateTxResult = this.validateTx(body);

					if(validateTxResult){
						response.write("Transaction rule added successfully!");
						console.log("Transaction rule added successfully!");
					}else{
						response.write("Transaction rule could not be added!");
						console.log("Transaction rule could not be added!");
					}
				}
			})// end request
		}// end "/addtxrule"

		if (request.method == 'POST' && request.url == '/changetxrule') {
         
			request.on('data', function (chunk) {
				body += chunk
				console.log(body)
			})

			request.on('end', function () {
				body = JSON.parse(body)
				var result = this.verifyIt(body);

				if(result){
					var validateTxResult = this.validateTx(body);

					if(validateTxResult){
						response.write("Transaction rule changed successfully!");
						console.log("Transaction rule changed successfully!");
					}else{
						response.write("Transaction rule could not be changed!");
						console.log("Transaction rule could not be changed!");
					}
				}
			})// end request
		}// end "/changetxrule"

		if (request.method == 'POST' && request.url == '/removetxrule') {
         
			request.on('data', function (chunk) {
				body += chunk
				console.log(body)
			})

			request.on('end', function () {
				body = JSON.parse(body)
				var result = this.verifyIt(body);

				if(result){
					var validateTxResult = this.validateTx(body);

					if(validateTxResult){
						response.write("Transaction rule removed successfully!");
						console.log("Transaction rule removed successfully!");
					}else{
						response.write("Transaction rule could not be removed!");
						console.log("Transaction rule could not be removed!");
					}
				}
			})// end request
		}// end "/removetxrule"
		
	}

	


	server.listen(port, hostname, function () {
		console.log(`Server running at http://${hostname}:${port}/`);
	});
	
