
import "CoreIdentity.sol";
import "ballot.sol";
import "Dao.sol";
import "coidGateKeeper.sol";

contract MyGateKeeper
{




    bytes32[3] validatorsToVote; // randomly selected validators from the DAO list

    event resultReady(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr,uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);
    event proposalDeleted(string notify); // notify user if the proposal got deleted after experation




    struct UniqueId
    {
        bytes32 uniqueId;
        string [10] uniqueIdAttributes_name;
        bytes32 [10] uniqueIdAttributes_filehashvalue;
        string [10] uniqueIdAttributes_IPFSFileHash;
    }

    struct OwnershipId {
        bytes32 ownershipId;
        bytes32[10] ownerIdList;
    }
    struct ControlId {
        bytes32 controlId;
        bytes32[10] controlIdList;
    }
    struct OwnershipTokenId {
        bytes32 ownershipTokenId;
        string ownershipTokenAttributes;
        uint[10] ownershipTokenQuantity;
    }
    struct ControlTokenId {
        bytes32 controlTokenId;
        string controlTokenAttributes;
        uint[10] controlTokenQuantity;
    }
    struct IdentityRecoveryIdList {
        bytes32[10] identityRecoveryIdList;
        uint recoveryCondition;

    }

    //Struct to store key and signature of COID requester as proof of submission.
    //AF: needed to change bytes 32 to string
    struct IdentityAcct
    {

        string pubkey;  // hash of pubkey, for security
        string signature;
        string message; // hash of message

    }



    //COID struct to combine all sub structs into one COID data structure.
    //AF: If we use this structure as a submission for the BigChain payload, then we need to include -- BlockchainID, Blockhash (of block holding COID data). This serves as authentication stamp from the originating blockchain for BigChain

    struct CoidData
    {
        UniqueId myUniqueID;
        OwnershipId myOwnershipID;
        ControlId myControlID;
        OwnershipTokenId myOwnershipTokenID;
        ControlTokenId myControlTokenID;
        IdentityRecoveryIdList myIdentityRecoveryIdList;
        IdentityAcct myIdentityAcct;
       // ValidatorSignatures validatorSignatures;
        bytes32 blockHash;
        bytes32 blockChainId;

    }


    struct Proposal
    {
        // Instantiate CoidData Structure
        CoidData coidData;

        uint time;  //timestamp

        bool coid_requester_check;
        bool unique_ID_check;
        bool ownership_ID_check;
        bool control_ID_check;
        bool ownership_token_check;
        bool control_token_check;
        bool recovery_check;
        bool coidproposal_check;

        bytes32 requester; // the hash of public key which is going to be used in set functions
                           // to check if the requester has valid access

        uint yesVotesRequiredToPass;
        uint numberOfVoters;

        bool isHuman;

    }

    //The struct to keep track of proposalId, uniqueId, pubkey and signature
    //AF: changed audit trail to strong for pubkey, sig and mssg
       struct IdentityAuditTrail {

       bytes32 uniqueId;
       string pubkey;
       string message;
       string sig;
    }

    // The proposal Id is mapped with struct IdentityAuditTrail
    mapping (bytes32 => IdentityAuditTrail) myIdentityAuditTrail;

    bytes32[] uniqueIdList;

    // The proposal Id is mapped with struct Proposal
    mapping(bytes32 => Proposal) proposals;

    mapping(bytes32 => bool) calledBefore;

    address chairperson = 0xE6A299E460649D658504E1D887AE738321EDBD5B;
        //This sets the Eris account that deployed the gatekeeper contract as the chairperson of a proposal
    function MyGateKeeper()
    {
       // chairperson = msg.sender;
    }


    //debugging the uniqueIdList
    function debugIt(uint i) returns (bytes32 val)
    {
	val = uniqueIdList[i];
    }



    // Set coid requster of the Coid proposal
    //AF: Changed types to account for updated types in structs. Added if function to ensure only chairperson calls contract
    //This is going be to be used by gatekepper app to set up coid requster info including
    // pubkey, messagehash, and signature(hash) of the coide requester

    function setCoidRequester(string pubkeyVal, bytes32 proposalId, string signatureVal, string messageVal) returns (bool result)
    {
            if (msg.sender == chairperson) {

            proposals[proposalId].coidData.myIdentityAcct.signature = signatureVal;
            proposals[proposalId].coidData.myIdentityAcct.pubkey = pubkeyVal;
            proposals[proposalId].coidData.myIdentityAcct.message = messageVal;
            proposals[proposalId].requester = sha3(pubkeyVal);

            //Store pubkey and signature struct IdentityAuditTrail in order to track based on based on proposalId
            myIdentityAuditTrail[proposalId].pubkey = pubkeyVal;
            myIdentityAuditTrail[proposalId].message = messageVal;
            myIdentityAuditTrail[proposalId].sig = signatureVal;

            proposals[proposalId].coid_requester_check = true;

            result = proposals[proposalId].coid_requester_check;
            }
            else {result = false;}

    }



    //AF: updated types, added uniqueattrbute vals and cleaned up function and added if for msg.sender = chairperson condition
   function setmyUniqueID(
        string requesterVal,
        bytes32 proposalId,
        bytes32 uniqueIdVal,
        string uniqueIdAttributes_nameVal,
        bytes32 uniqueIdAttributes_filehashvalueVal,
        string uniqueIdAttributes_IPFSFileHashVal, uint index) returns (bool result)
    {

        if (msg.sender == chairperson) {

        if (sha3(requesterVal) == proposals[proposalId].requester &&  proposals[proposalId].coid_requester_check == true) {

             proposals[proposalId].coidData.myUniqueID.uniqueId = uniqueIdVal;

             proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_name[index] = uniqueIdAttributes_nameVal;
             proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_filehashvalue[index] = uniqueIdAttributes_filehashvalueVal;
             proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_IPFSFileHash[index] = uniqueIdAttributes_IPFSFileHashVal;

            //Store uniqueId into IdentityAuditTrail in oder to track

             myIdentityAuditTrail[proposalId].uniqueId = uniqueIdVal;

             proposals[proposalId].unique_ID_check = true;

             result = proposals[proposalId].unique_ID_check;
        }
             else {result = false;}
       }
       else {result = false;}
    }

    //AF: Update types and msg.sender condition
    function setmyOwnershipID(string requesterVal, bytes32 proposalId, bytes32 ownershipIdVal, bytes32[10] ownerIdListVal) returns (bool result)
    {

        if (msg.sender == chairperson) {

        if (sha3(requesterVal) == proposals[proposalId].requester &&  proposals[proposalId].unique_ID_check == true) {

            proposals[proposalId].coidData.myOwnershipID.ownershipId = ownershipIdVal;

            proposals[proposalId].coidData.myOwnershipID.ownerIdList = ownerIdListVal;

            proposals[proposalId].ownership_ID_check = true;

            result = proposals[proposalId].ownership_ID_check;
         }
           else {result = false;}
        }
        else {result = false;}
    }

    //AF: update type and if condition for msg.sender
    function setmyControlID(string requesterVal, bytes32 proposalId, bytes32 controlIdVal, bytes32[10] controlIdListVal) returns (bool result)
    {


      if (msg.sender == chairperson) {

        if (sha3(requesterVal) == proposals[proposalId].requester && proposals[proposalId].ownership_ID_check == true ) {

            proposals[proposalId].coidData.myControlID.controlId = controlIdVal;
            proposals[proposalId].coidData.myControlID.controlIdList = controlIdListVal;

            proposals[proposalId].control_ID_check = true;

            result = proposals[proposalId].control_ID_check;
            }
            else {result = false;}
        }
        else {result = false;}
    }

    //AF: Update types and condition on msg.sender
    function setmyOwnershipTokenID(string requesterVal, bytes32 proposalId, bytes32 ownershipTokenIdVal, string ownershipTokenAttributesVal, uint[10] ownershipTokenQuantityVal) returns (bool result)
    {

    if (msg.sender == chairperson) {

    //if(proposals[proposalId].isHuman = true){
                        //for(uint i=0; i< ownershipTokenQuantityVal.length(); i++){
                                //if (ownershipTokenQuantityVal[i] != 0) {throw;}
                        //}

        if (sha3(requesterVal) == proposals[proposalId].requester && proposals[proposalId].control_ID_check == true) {
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenId = ownershipTokenIdVal;
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenQuantity = ownershipTokenQuantityVal;
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenAttributes = ownershipTokenAttributesVal;
            proposals[proposalId].ownership_token_check = true;

            result = proposals[proposalId].ownership_token_check;
            } //end sha3
            else {result = false;}
        //}//end isHuman
        }
        else {result = false;}
    }

    //AF: change types and condition for msg.sender
    function setmyControlTokenID(string requesterVal, bytes32 proposalId, bytes32 controlTokenIdVal, string controlTokenAttributesVal, uint[10] controlTokenQuantityVal) returns (bool result)
    {

    if (msg.sender == chairperson) {

    //if(proposals[proposalId].isHuman = true){
                        //for(uint i=0; i< controlTokenQuantityVal.length(); i++){
                                //if (controlTokenQuantityVal[i] != 0) {throw;}
                        //}

        if (sha3(requesterVal) == proposals[proposalId].requester && proposals[proposalId].ownership_token_check == true ) {
            proposals[proposalId].coidData.myControlTokenID.controlTokenId = controlTokenIdVal;
            proposals[proposalId].coidData.myControlTokenID.controlTokenQuantity = controlTokenQuantityVal;
            proposals[proposalId].coidData.myControlTokenID.controlTokenAttributes = controlTokenAttributesVal;
            proposals[proposalId].control_token_check = true;

            result = proposals[proposalId].control_token_check;
            } //end sha3
            else {result = false;}
        //}//end ishuman
        }
        else {result = false;}
    }


    //AF: change types and condition for msg.sender
    function setmyIdentityRecoveryIdList(string requesterVal, bytes32 proposalId, bytes32[10] identityRecoveryIdListVal, uint recoveryConditionVal) returns (bool result)
    {

    if (msg.sender == chairperson) {

        if (sha3(requesterVal) == proposals[proposalId].requester && proposals[proposalId].control_token_check == true) {
            proposals[proposalId].coidData.myIdentityRecoveryIdList.recoveryCondition = recoveryConditionVal;
            proposals[proposalId].coidData.myIdentityRecoveryIdList.identityRecoveryIdList = identityRecoveryIdListVal;
            proposals[proposalId].recovery_check = true;

            result = proposals[proposalId].recovery_check;
            }
            else {result = false;}
        }
        else {result = false;}
    }


   // This is going to be used by the gatekeeper contract to submit the COID proposal
   // true if the coidproposal has been initiated, flse, if the
    function initiateCoidProposalSubmission(address ballotAddr, bytes32 proposalId, uint yesVotesRequiredToPass, bool isHuman, address myGKaddr) returns (bool result)
    {

        if (msg.sender == chairperson)  // the chairperson == gatekeeper
                {

            calledBefore[proposals[proposalId].requester] = true;

            proposals[proposalId].yesVotesRequiredToPass = yesVotesRequiredToPass;
            proposals[proposalId].numberOfVoters = validatorsToVote.length;
	    proposals[proposalId].isHuman = isHuman;

            Ballot B = Ballot(ballotAddr); // Instantiate the ballot contract, and allows it to talk to the ballot contract

            // Send the proposal to ballot contract with proposalId, numbers of voters for that proposal and yesVotesRequiredToPass
            B.setMyProposalID(proposalId, validatorsToVote.length, yesVotesRequiredToPass, isHuman,myGKaddr); // trigger the event COIDRequest in ballot.sol

            proposals[proposalId].coidproposal_check = true;

            result = proposals[proposalId].coidproposal_check;
        }
        else {result = false;}
    }

    // The validators signatures are not provided by the user but ballot contract
    //AF: The message sender is no longer the chairperson but the ballot contract address!!

    // This function is called by the owner of ballot contract which is ballot app
    // Because the owner of the ballot contract and the owner of the gatekeeper contract are the same
    // So when we check the msg.sender it can use the chairperson
    //AF: function no longer required
    //function setValidatorSignatures(bytes32 proposalId, bytes32[10] validatorsAddrVal, bytes32[10] validatorSigVal, bytes32[10] validatorMsgVal) {
    //    if (msg.sender == chairperson)

      //  {
        //    proposals[proposalId].coidData.validatorSignatures.validatorsAddr = validatorsAddrVal;
        //  proposals[proposalId].coidData.validatorSignatures.validatorSig = validatorSigVal;
        //    proposals[proposalId].coidData.validatorSignatures.validatorMsg = validatorMsgVal;

      //  }
      //  else {
      //      throw;
      //  }

    // }


     //COID Data retrieval functions used from gatekeper.js

    //AF: updated types and outputs based on struct changes
    function getmyUniqueID(bytes32 proposalId, string requesterVal, uint index) returns (bool result, bytes32 uniqueIdRet, string uniqueIdAttributes_nameRet,
        bytes32 uniqueIdAttributes_filehashvalueRet,
        string uniqueIdAttributes_IPFSFileHashRet, uint indexs)
    {
        result = false;
        if (sha3(requesterVal) == proposals[proposalId].requester || msg.sender == chairperson) // only requster and gatekeeper have access
        // to get functions
        {
            uniqueIdRet = proposals[proposalId].coidData.myUniqueID.uniqueId;
            uniqueIdAttributes_nameRet = proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_name[index];
            uniqueIdAttributes_filehashvalueRet = proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_filehashvalue[index];
            uniqueIdAttributes_IPFSFileHashRet = proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_IPFSFileHash[index];

            result = true;
        }
    }

    //AF: Updated type for requesterVal
    function getmyOwnershipID(bytes32 proposalId, string requesterVal) returns (bool result, bytes32 ownershipIdRet, bytes32[10] ownerIdListRet)

    {

        if (sha3(requesterVal) == proposals[proposalId].requester || msg.sender == chairperson) {
            ownershipIdRet = proposals[proposalId].coidData.myOwnershipID.ownershipId;
            ownerIdListRet = proposals[proposalId].coidData.myOwnershipID.ownerIdList;
            result = true;
        }
        else {
            result = false;
        }
    }

    //AF: Updated type for requesterVal
    function getmyControlID(bytes32 proposalId, string requesterVal) returns (bool result, bytes32 controlIdRet, bytes32[10] controlIdListRet)
    {
        if (sha3(requesterVal) == proposals[proposalId].requester || msg.sender == chairperson) {
            controlIdRet = proposals[proposalId].coidData.myControlID.controlId;
            controlIdListRet = proposals[proposalId].coidData.myControlID.controlIdList;
            result = true;
        }
        else {
            result = false;
        }
    }

    //AF: Updated type for requesterVal
    function getmyOwnershipTokenID(bytes32 proposalId, string requesterVal) returns (bool result, bytes32 ownershipTokenIdRet, string ownershipTokenAttributesRet, uint[10] ownershipTokenQuantityRet)

    {
        if (sha3(requesterVal) == proposals[proposalId].requester || msg.sender == chairperson) {
            ownershipTokenIdRet = proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenId;
            ownershipTokenAttributesRet = proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenAttributes;
            ownershipTokenQuantityRet = proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenQuantity;
            result = true;
        }
        else {
            result = false;
        }
    }


    //AF: Updated type for requesterVal
    function getmyControlTokenID(bytes32 proposalId, string requesterVal) returns (bool result, bytes32 controlTokenIdRet, string controlTokenAttributesRet, uint[10] controlTokenQuantityRet)
    {

        if (sha3(requesterVal) == proposals[proposalId].requester || msg.sender == chairperson) {
            controlTokenIdRet = proposals[proposalId].coidData.myControlTokenID.controlTokenId;
            controlTokenAttributesRet = proposals[proposalId].coidData.myControlTokenID.controlTokenAttributes;
            controlTokenQuantityRet = proposals[proposalId].coidData.myControlTokenID.controlTokenQuantity;
            result = true;
        }
        else {
            result = false;
        }
    }

    //AF: Updated type for requesterVal
    function getmyIdentityRecoveryIdList(bytes32 proposalId, string requesterVal) returns (bool result, bytes32[10] identityRecoveryIdListRet, uint recoveryConditionRet)
    {
        if (sha3(requesterVal) == proposals[proposalId].requester || msg.sender == chairperson) {
            identityRecoveryIdListRet = proposals[proposalId].coidData.myIdentityRecoveryIdList.identityRecoveryIdList;
            recoveryConditionRet = proposals[proposalId].coidData.myIdentityRecoveryIdList.recoveryCondition;
            result = true;
        }
        else {
            result = false;
        }
    }


    //Check if the uniqueID is unique
    //AF: This function is used by the gatekeeper app to check if the proporsal ID is unique, right?

    // This function is used by gatekeeper app to check if the coid uniqueID is unique
    function isUnique(bytes32 uniqueIdVal) returns (bool isUniqueRet)
    {
       isUniqueRet = true;

	if(uniqueIdList.length > 0)
	{
       	for (uint i = 0; i< uniqueIdList.length; i++ )
       	{
         	  if (uniqueIdVal == uniqueIdList[i])
		{
        	   isUniqueRet = false;
		}

       	}
	}

	if(isUniqueRet)
	{
          // Store uniqueId into the array uniqueIdList[]
       	uniqueIdList.push(uniqueIdVal);// if the uniqueID is unique Id is unique, then add to the uniqueID list
	}
       return isUniqueRet;
    }

    // To get pubkey and uniqueId and sig based on specifica proposal Id
    function getmyIdentityAuditTrail(bytes32 proposalId) constant returns (string pubkeyRet,bytes32 uniqueIdRet, string sigRet, string messageRet)
    {
        pubkeyRet = myIdentityAuditTrail[proposalId].pubkey;
        uniqueIdRet = myIdentityAuditTrail[proposalId].uniqueId;
        messageRet = myIdentityAuditTrail[proposalId].message;
        sigRet =  myIdentityAuditTrail[proposalId].sig;

    }





    //AF: This function is called by the gatekeeper contract right? so what msg.sender == address(this

    //This function is called by ballot app(which is the owner of the ballot contract)
    //Because the owner of ballot contract and gatekeeper contract are the same, so we can still use
    // if(msg.sender == chairperson) to check if the function actor has right to call the function
    function ResultIsReady(bool resultVal, bytes32 proposalId, bytes32 blockchainId) {

                 bool result;
                 address coidGKAddr;
                 address coidIdentityAddr;
                 uint blockNumber;

        if (msg.sender == chairperson)  // only IDF gateKeeper has right to call this function
        {
            result = resultVal;
            if (result == true) {
                // Trigger the event to notify the user the result

                coidIdentityAddr = createCOID(proposalId);

                coidGKAddr = createGateKeeper();

                //COIDgatekeeper(coidGKAddr);

                proposals[proposalId].coidData.blockChainId = blockchainId;

                proposals[proposalId].coidData.blockHash = 0x0;

                resultReady(proposalId, result, "Your identity has been integrated.", coidGKAddr, coidIdentityAddr, blockNumber, proposals[proposalId].coidData.blockHash, blockchainId, now);

            }
            else {
                //dont make coid
                resultReady(proposalId, result, "Sorry, your identity was rejected.", 0x0, 0x0, 0x0, 0x0,0X0,now);

            }
        }
        else {
            throw;
        }

    }

    CoreIdentity MyCoidIdentity;


    function createCOID(bytes32 proposalId) returns (address)
    {

        if (msg.sender == chairperson)  // only IDF gateKeeper has right to call this function
        {
            MyCoidIdentity = new CoreIdentity();

        }
        else {

            throw;
        }
        return MyCoidIdentity;
    }

    // Instantiate coidGateKeepr contract
    coidGateKeeper MycoidGateKeeper;

    function createGateKeeper() returns (address)
    {

        if (msg.sender == chairperson) {
            //create coidGateKeeper instance, and return the address to the requester
            MycoidGateKeeper = new coidGateKeeper();
        }
        else {
            throw;
        }

        return MycoidGateKeeper;
    }


    //set validators
    function setValidators(bytes32 proposalId, bytes32[3] validators, address ballotAddr)
    {
        if(msg.sender == chairperson)
        {
            uint total;
            bool stop;
            uint random;

            for(uint p = 0; p < 3; p++)
            {
                validatorsToVote[p] = validators[p];
            }

            // Has been added here
            Ballot B = Ballot(ballotAddr);

            B.addSelectedValidator(proposalId, validatorsToVote);

        }
        else
        {
            throw;
        }
    }


    function giveRightToVote(bytes32 proposalId, address ballotAddr)
    {

        if (msg.sender == chairperson) // Only the gatekeeper has access to give voting rights to validators
        {
            Ballot B = Ballot(ballotAddr);

            uint i;
            for (i = 0; i < validatorsToVote.length; i++) {
                B.giveRightToVote(proposalId, validatorsToVote[i]); // Send validator to ballot contract one by one
            }
        }
        else
        {
            throw;
        }
    }


      // will be called by the gatekeeper.js
    // If the proposal is created, expired, or denied user will recieve a notification
    function deleteProposal(bytes32 proposalId)
    {

          if (msg.sender == chairperson)
          {
            // delete all data from coidData struct
            delete proposals[proposalId];
            proposalDeleted("Your COID request has either expired or been rejected and the associated data is deleted.");
          }
    }
}
