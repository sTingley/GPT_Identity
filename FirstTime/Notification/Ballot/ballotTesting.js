var erisC = require('eris-contracts');
//var erisContracts = require('eris-contracts')
var fs = require('fs')
var bodyParser = require('body-parser')



        // eris:chain id with full privilages
    var chain = 'newchain4_full_000';
    // Change eris:db url
    var erisdburl = "http://10.100.98.218:1337/rpc";

    var contractData = require("./epm.json");
    var contractAddress = contractData['GateKeeper'];
    var erisAbi = JSON.parse(fs.readFileSync("./abi/"+contractAddress));
    var accountData = require("./accounts.json");
    var contractMgr = erisC.newContractManagerDev(erisdburl, accountData[chain]);
    var gateKeeper = contractMgr.newContractFactory(erisAbi).at(contractAddress);






//This endpoint is for receiving COID Data
//Input Fields (as JSON): proposalId, requesterVal
//TODO: ISHUMAN VALUE CHANGE?
//TODO: YESVOTESREQUIREDTOPASS?
//TODO: Add Verification
function doIt()
{

    //get input:
   // var params = req.body;
    //var proposalId = params.proposalId;
    //var requesterVal = params.requesterVal;

    var proposalId = '2DE7C671B97875A5A4676E6D284033823D56A1510A12FBCBC5409C548AC3850A';
    var requesterVal = '0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055';



    //json data to return
    pubKey = "";
    sig = "";
    msg = "";
    uniqueId = "";
    uniqueIdAttributes = "";
    ownershipId = "";
    ownerIdList = "";
    ownershipTokenId = "";
    controlId = "";
    controlIdList = "";
    ownershipTokenAttributes = "";
    ownershipTokenQuantity = "";
    controlTokenId = "";
    controlTokenAttributes = "";
    controlTokenQuantity = "";
    identityRecoveryIdList = "";
    recoveryCondition = "";
    yesVotesRequiredToPass = 2;
    isHuman = true;

    var response =
    {

        "pubKey":pubKey,
        "sig":sig,
        "msg":msg,
        "uniqueId":uniqueId,
        "uniqueIdAttributes": uniqueIdAttributes,
        "ownershipId":ownershipId,
        "ownerIdList":ownerIdList,
        "ownershipTokenId": ownershipTokenId,
        "controlId": controlId,
        "controlIdList": controlIdList,
        "ownershipTokenAttributes": ownershipTokenAttributes,
        "ownershipTokenQuantity": ownershipTokenQuantity,
        "controlTokenId": controlTokenId,
        "controlTokenAttributes": controlTokenAttributes,
        "controlTokenQuantity": controlTokenQuantity,
        "identityRecoveryIdList": identityRecoveryIdList,
        "recoveryCondition": recoveryCondition,
        "yesVotesRequiredToPass": yesVotesRequiredToPass,
        "isHuman": isHuman

    }

    var functionCount = 0;


    //getmyUniqueID contract return structure:
    // index 0: bool result
    // index 1: bytes32 uniqueIdRet
    // index 2: string uniqueIdAttributes_nameRet
    // index 3: bytes32 uniqueIdAttributes_filehashvalueRet
    // index 4: string uniqueIdAttributes_IPFSFileHashRet
    // index 5: uint index

    var _this = this;

    //Formulate uniqueIdAttributes
    var counter = 0; //(since you can't use i, i = 8 doesn't mean we are on the 8th iterations -- async property)
    var uniqueArray = [];
    for(let i = 0; i < 10; i++)
    {

        gateKeeper.getmyUniqueID(proposalId, requesterVal,i, function(error,result)
        {
		counter++;

		uniqueArray.push(result[1]);
		uniqueArray.push(result[2]);
		uniqueArray.push(result[3]);

            	if(counter==9)
            	{
               		response.uniqueIdAttributes = (uniqueArray.filter(_this.filterFunction)).toString();;
               		functionCount++;
	       		_this.proceed();
            	}

        })
     }


    //CONTRACT RETURNS: bool result, bytes32 ownershipIdRet, bytes32[10] ownerIdListRet)
    gateKeeper.getmyOwnershipID(proposalId, requesterVal, function(error,result)
    {
        response.ownershipId = result[1];
        response.ownerIdListRet = (result[2].filter(_this.filterFunction)).toString();

        functionCount++;
	_this.proceed();
    })


    //CONTRACT RETURNS: bool result, bytes32 ownershipTokenIdRet, bytes32[10] ownershipTokenAttributesRet, uint ownershipTokenQuantityRet
    gateKeeper.getmyOwnershipTokenID(proposalId, requesterVal, function(error,result)
    {
        response.ownershipTokenId = result[1];
        response.ownershipTokenAttributes = (result[2].filter(_this.filterFunction)).toString();
        response.ownershipTokenQuantity = (result[3].filter(_this.filterFunction)).toString();

        functionCount++;
	_this.proceed();
    })


    //CONTRACT RETURNS: bool result, bytes32 controlIdRet, bytes32[10] controlIdListRet
    gateKeeper.getmyControlID(proposalId, requesterVal, function(error,result)
    {
        response.controlId = result[1];
        response.controlIdList = (result[2].filter(_this.filterFunction)).toString();

        functionCount++;
	_this.proceed();
    })

    //CONTRACT RETURNS: bool result, bytes32 controlTokenIdRet, bytes32[10] controlTokenAttributesRet, uint controlTokenQuantityRet
    gateKeeper.getmyControlTokenID(proposalId, requesterVal, function(error,result)
    {
        response.controlTokenId = result[1];
        response.controlTokenAttributes = (result[2].filter(_this.filterFunction)).toString();
        response.controlTokenQuantity = (result[3].filter(_this.filterFunction)).toString();

        functionCount++;
	_this.proceed();
    })


    //CONTRACT RETURNS: bool result, bytes32[10] identityRecoveryIdListRet, uint recoveryConditionRet
    gateKeeper.getmyIdentityRecoveryIdList(proposalId, requesterVal, function(error,result)
    {
        response.identityRecoveryIdList = (result[1].filter(_this.filterFunction)).toString();
        response.recoveryCondition = result[2];

        functionCount++;
	_this.proceed();
    })

    //CONTRACT RETURNS: string pubkeyRet,bytes32 uniqueIdRet, string sigRet, string messageRet
    gateKeeper.getmyIdentityAuditTrail(proposalId, function(error,result)
    {
        response.msg = result[3];
        response.sig = result[2];
        response.pubKey = result[0];
        response.uniqueId = result[1];
	_this.proceed();
        functionCount++;
    })

    //only will execute when all functions have been called
    //due to the asynchronous nature of javascript, we call it at the end of each function
    this.proceed = function()
    {
        //we are done --write the response
        if(functionCount >= 7)
        {
           // res.write(response);
            console.log(JSON.stringify(response));
        }
    }

    this.filterFunction = function(value)
    {
	return (value != "" && value != "0000000000000000000000000000000000000000000000000000000000000000" && value != 0 
		&& value != "0")
    }

}



doIt();

