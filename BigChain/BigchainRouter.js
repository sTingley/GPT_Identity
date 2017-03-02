//THIS FILE IS CALLED BY THE ANDROID APP (scans digital identity QR Code)
//Bigchain is called directly


'use strict'

//for allowing a post request
var app = require("express")();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


//for interaction with the bigchain driver
var request = require('request');
var bigchainServer = 'http://10.100.98.217:5000'

//for hash checks
var keccak_256 = require('js-sha3').keccak_256

//for ed25519 verification
var ed25519 = require("ed25519")

//for secp256k1 verification
var secp256k1 = require('secp256k1')



//ED25519 VERIFICATION FUNCTION:
function EDVerify(msg,signature,pubKey)
{
    var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
    return logme;
}


//SECP VERIFICATION FUNCTION:
function SECPVerify(msg, signature, pubKey)
{
    msg = new Buffer(msg, "hex");
    signature = new Buffer(signature, "hex");
    pubKey = new Buffer(pubKey, "hex");

    var verified = secp256k1.verify(msg, signature, pubKey)
    return verified;
}


//THIS WILL BE USED IN THE POST REQUEST:
var QRValidator = function()
{
    var self = this;

    //MAIN FUNCTION:
    this.validate = function(formdata,bigchainResponse,bigchainResponseFull,body,callback)
    {
        //PARSE DATA
        console.log(bigchainResponse.uniqueId)

        //for condition1
        var msg = formdata.msgHash;
        var signature = formdata.sig;
        var pubKey = formdata.pubKey;

        //for condition2
        var providedHash = formdata.bigchainHash;

        //for condition3 //TODO: UPDATE!
        var uniqueID_formdata = formdata.uniqueId;
        var ownershipID_formdata = formdata.ownershipId;
        var uniqueID = bigchainResponse.uniqueId;
        var ownershipID = bigchainResponse.ownershipId;
        console.log("uniqueID_formdata: " + uniqueID_formdata);
        console.log("ownershipID_formdata: " + ownershipID_formdata);
        console.log("uniqueID: " + bigchainResponse.uniqueId)
        console.log("ownershipID: " + ownershipID)

        //for condition4
        var QRpubKey = formdata.pubKey;
        var msgBigchain = bigchainResponse.msg;
        var sigBigchain = bigchainResponse.sig;
        var pubKeyBigchain = bigchainResponse.pubKey;

        //for condition5
        var sigs = bigchainResponseFull.transaction.asset.data.validator_signatures;

        console.log(sigs)
        var condition0 = self.timeCheck(formdata.timestamp,msg);
        var condition1 = self.checkSig(msg,signature,pubKey);
        var condition2 = self.compareHash(providedHash,body);
        var condition3 = self.compareIDS(uniqueID_formdata,ownershipID_formdata,uniqueID,ownershipID);
        var condition4 = self.bigchainVerify(msgBigchain,sigBigchain,pubKeyBigchain,QRpubKey);
        var condition5 = self.ValidatorValidation(sigs);

        //debugging:
        console.log("condition0: " + condition0)
        console.log("condition1: " + condition1)
        console.log("condition2: " + condition2)
        console.log("condition3: " + condition3)
        console.log("condition4: " + condition4)
        console.log("condition5: " + condition5)

        var result = (condition0 & condition1 && condition2 && condition3 && condition4 && condition5);

        callback(result);
    }

    //HELPER FUNCTIONS:

    //0. CHECK TIME AND TIME HASH
    this.timeCheck = function(timestamp,msg)
    {
        var sync = true;

        var QRdate = new Date(timestamp);
        var currentdate = new Date();

        //var check = currentdate.getUTCMonth() == QRdate.month;
        //check = check & (currentdate.getUTCDate() == QRdate.day);
        //check = check & (currentdate.getUTCFullYear() == QRdate.year);
        //check = check & (currentdate.getUTCHours() == QRdate.hour);
        //check = check & (currentdate.getUTCMinutes() == QRdate.minute);
        //check = check & (Math.abs(currentdate.getUTCSeconds() - QRdate.second) < 10);
        var check = (msg == keccak_256(timestamp))
        check = check && (Math.abs(currentdate.getTime() - QRdate.getTime()) < 30000)
        sync = false;
        while(sync)
        {
            require('deasync').sleep(100);
        }


        return check;
    }

    //1. CHECK DIGITAL SIGNATURE:
    this.checkSig = function(msg,signature,pubKey)
    {
        return SECPVerify(msg,signature,pubKey)
    }

    //2. COMPARSE HASH SUPPLIED VS. BIGCHAIN HASH:
    this.compareHash = function(providedHash, calculateFromResponse)
    {
        return (keccak_256(calculateFromResponse) == providedHash)
    }

    //3. CHECK OWNERSHIP AND UNIQUE IDS:
    this.compareIDS = function(uniqueID_formdata,ownershipID_formdata,uniqueID,ownershipID)
    {
        return ((uniqueID_formdata == uniqueID) && (ownershipID_formdata == ownershipID))
    }

    //4. CHECK SIGNATURE FROM BIGCHAIN OF REQUESTER, MAKE SURE IS SAME AS QR PUBKEY:
    this.bigchainVerify = function(msg,signature,pubKey,QRpubKey)
    {
        return ((SECPVerify(msg,signature,pubKey)) && (QRpubKey == pubKey))
    }

    //5. VALIDATE DIGITAL SIGNATURES OF COID VALIDATORS FROM BIGCHAIN DATA
    this.ValidatorValidation = function(sigs)
    {

        var sync = true;

        var result = true;
        console.log("sigs is: " + sigs)
        for(let i = 0; i < sigs.length; i+=1)
        {
           console.log("length of sigs is: " + sigs.length)
           //order i is sig, i+1 is msg, i+2 is pubkey
           var msg = sigs[i][0];
           var signature = sigs[i][1];
           var pubKey = sigs[i][2];

           if(signature != "") //make sure the validator voted
           {
               if(!SECPVerify(msg,signature,pubKey))
               {
                   result = false;
               }
           }
           else
           {
                console.log("empty sig")
           }
        }

        sync = false;
        while(sync)
        {
            require('deasync').sleep(100);
        }

        return result;
    }
}



//POST REQUEST FOR QR VALIDATION:
app.post("/QRValidation",function(req,res)
{

    console.log(req.body)
    var txID = req.body.bigchainID;
    console.log(txID);

    var formdata = req.body;


    //BIGCHAIN ENDPOINT:
    var endpoint = '/getTransaction/' + txID;


    request({
        method: 'GET',
        url: bigchainServer + endpoint,
        headers:
        {
            'Content-Type': 'application/json'
        }
        },
        function (error, response, body)
        {
            //the response is body -- send that
            console.log(body)
            var full_data = JSON.parse(body)
            var short_data = JSON.parse(body).transaction.asset.data.Coid_Data;
            console.log("short data is..." + short_data.ownershipId)
            console.log(JSON.stringify(full_data))
            console.log(JSON.stringify(short_data))

            var validator = new QRValidator();

            validator.validate(formdata,short_data,full_data,body,function(result)
            {
                if(result)
                {
                        res.json({"Result":"1"});
                }
                else
                {
                        res.json({"Result":"0"});
                }
            })


        });

})


//listen to the port
app.listen(3333);

