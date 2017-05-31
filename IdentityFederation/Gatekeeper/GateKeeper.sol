import "CoreIdentity.sol";
import "ballot.sol";
import "Dao.sol";
import "MyGatekeeper.sol";
import "IdentityDimensionControl.sol";

contract GateKeeper {



    // Global variables

    bytes32[3] validatorsToVote; // randomly selected validators from the DAO list
    bytes32[35] list; // list of validstors from DAO
    bytes32[10] temp;

    uint nonce = 0;


    //To notify the user the CoreIdentity request is accepted or rejected
    // the gk.js mines the event and get the results if it is true or false as well as a message for the user
    event resultReady(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr, address dimensionCtrlAddr, uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);
    // event COIDgatekeeper(address gkAddr);
    event proposalDeleted(string notify); // notify user if the proposal got deleted after experation
    event resultReadyUniqueId(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr, address dimensionCtrlAddr, uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);



    // Structs for the COID elements as per TCS Digital Identity protocol
    //AF: updated old struct to new one to hold longer hashes and text
    //struct UniqueId {
      //  bytes32 uniqueId;
      //  bytes32[3][10] uniqueIdAttributes;
    //}

    struct UniqueId {
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
    struct IdentityAcct {

        string pubkey;  // hash of pubkey, for security
        string signature;
        string message; // hash of message

    }

    //AF: The validator signatures will be calleddirectly from Ballot.sol through the gatekeeper.js once the proposal has been approved
    // Therefore, we can remove it here!
    // Struct to store the validators and validator signatures as proof of attestation
    //struct ValidatorSignatures {
      //  bytes32[10] validatorsAddr;
      //  bytes32[10] validatorSig;
      //  bytes32[10] validatorMsg;
    //}

    //COID struct to combine all sub structs into one COID data structure.
    //AF: If we use this structure as a submission for the BigChain payload, then we need to include -- BlockchainID, Blockhash (of block holding COID data). This serves as authentication stamp from the originating blockchain for BigChain

    struct CoidData  {
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
        bool forUID;

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

    address public chairperson;
        //This sets the Eris account that deployed the gatekeeper contract as the chairperson of a proposal
    function GateKeeper() {

        chairperson = msg.sender;
    }


        //function setCoidType will be called by app to check if the COID proposal is for an individual or a thing
    function setisHuman(bytes32 proposalId, bool isHumanVal) returns (bool isHuman)
    {
        if (msg.sender == chairperson){
            proposals[proposalId].isHuman = isHumanVal;
        }
        if (isHumanVal == true){
            isHuman = true;
        }
        else {isHuman = false;}


    }

    //function to determine update route
    function setForUID(bytes32 proposalId, bool forUIDVal) returns (bool UID)
    {
        if (msg.sender == chairperson){
            proposals[proposalId].forUID = forUIDVal;
        }
        if (forUIDVal == true){
            UID = true;
        }
        else {UID = false;}

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

                if(proposals[proposalId].isHuman = true){
                        for(uint i=0; i< ownershipTokenQuantityVal.length; i++){
                                if (ownershipTokenQuantityVal[i] != 0) {throw;}
                        }

        if (sha3(requesterVal) == proposals[proposalId].requester && proposals[proposalId].control_ID_check == true) {
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenId = ownershipTokenIdVal;
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenQuantity = ownershipTokenQuantityVal;
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenAttributes = ownershipTokenAttributesVal;
            proposals[proposalId].ownership_token_check = true;

            result = proposals[proposalId].ownership_token_check;
            } //end sha3
            else {result = false;}

        }//end isHuman

        }//end msg.sender

        else {result = false;}
    }

    //AF: change types and condition for msg.sender
    function setmyControlTokenID(string requesterVal, bytes32 proposalId, bytes32 controlTokenIdVal, string controlTokenAttributesVal, uint[10] controlTokenQuantityVal) returns (bool result)
    {

                if (msg.sender == chairperson) {

                if(proposals[proposalId].isHuman = true){
                        //for(uint i=0; i< controlTokenQuantityVal.length; i++){
                        //        if (controlTokenQuantityVal[i] != 0) {throw;}
                        //}

        if (sha3(requesterVal) == proposals[proposalId].requester && proposals[proposalId].ownership_token_check == true ) {
            proposals[proposalId].coidData.myControlTokenID.controlTokenId = controlTokenIdVal;
            proposals[proposalId].coidData.myControlTokenID.controlTokenQuantity = controlTokenQuantityVal;
            proposals[proposalId].coidData.myControlTokenID.controlTokenAttributes = controlTokenAttributesVal;
            proposals[proposalId].control_token_check = true;

            result = proposals[proposalId].control_token_check;
            } //end sha3
            else {result = false;}

                }//end isHuman

        }//end msg.sender

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
    function initiateCoidProposalSubmission(address ballotAddr, bytes32 proposalId, uint yesVotesRequiredToPass, bool isHuman) returns (bool result)
    {

        if (msg.sender == chairperson)  // the chairperson == gatekeeper
                {

            calledBefore[proposals[proposalId].requester] = true;

            proposals[proposalId].yesVotesRequiredToPass = yesVotesRequiredToPass;
            proposals[proposalId].numberOfVoters = validatorsToVote.length;
            proposals[proposalId].isHuman = isHuman;

            Ballot B = Ballot(ballotAddr); // Instantiate the ballot contract, and allows it to talk to the ballot contract

            // Send the proposal to ballot contract with proposalId, numbers of voters for that proposal and yesVotesRequiredToPass
            B.setMyProposalID(proposalId, validatorsToVote.length, yesVotesRequiredToPass, isHuman, 0x0); // trigger the event COIDRequest in ballot.sol

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

       for (uint i = 0; i< uniqueIdList.length; i++ )
       {
           if (uniqueIdVal == uniqueIdList[i])

           isUniqueRet = false;

       }

          // Store uniqueId into the array uniqueIdList[]
       uniqueIdList.push(uniqueIdVal);// if the uniqueID is unique Id is unique, then add to the uniqueID list

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
                 address dimensionCtrlAddr;
                 uint blockNumber;

        if (msg.sender == chairperson)  // only IDF gateKeeper has right to call this function
        {
            result = resultVal;
            if (result == true) {
                // Trigger the event to notify the user the result

                coidIdentityAddr = createCOID(proposalId);

                coidGKAddr = createGateKeeper();

                dimensionCtrlAddr = createDimensionControl();

                //COIDgatekeeper(coidGKAddr);

                proposals[proposalId].coidData.blockChainId = blockchainId;

                proposals[proposalId].coidData.blockHash = 0x0;

                if(proposals[proposalId].forUID){
                    resultReadyUniqueId(proposalId, result, "Your identity has been integrated.", coidGKAddr, coidIdentityAddr, dimensionCtrlAddr, blockNumber, proposals[proposalId].coidData.blockHash, blockchainId, now);
                }
                else{
                    resultReady(proposalId, result, "Your identity has been editted.", coidGKAddr, coidIdentityAddr, dimensionCtrlAddr, blockNumber, proposals[proposalId].coidData.blockHash, blockchainId, now);
                }
            }
            else {
                if(proposals[proposalId].forUID){
                    //dont make coid
                    resultReadyUniqueId(proposalId, result, "Sorry, your identity was rejected.", 0x0, 0x0, 0x0, 0x0, 0x0, 0X0, now);
                }
                else{
                    resultReady(proposalId, result, "Sorry, your identity was rejected.", 0x0, 0x0, 0x0, 0x0, 0x0, 0X0, now);
                }

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

    IdentityDimensionControl dimensionControl;

    function createDimensionControl() returns (address)
    {

        if (msg.sender == chairperson)
        {
            dimensionControl = new IdentityDimensionControl();
        }
        else {
            throw;
        }
        return dimensionControl;
    }


    // Instantiate coidGateKeepr contract
    MyGateKeeper MycoidGateKeeper;

    function createGateKeeper() returns (address)
    {

        if (msg.sender == chairperson) {
            //create coidGateKeeper instance, and return the address to the requester
            MycoidGateKeeper = new MyGateKeeper();
        }
        else {
            throw;
        }

        return MycoidGateKeeper;
    }

    function getList(address daoAddr) returns (bytes32[35] list)
    {

        if ( msg.sender==chairperson) {
            Dao D = Dao(daoAddr);
            list = D.getList(); // get list from the Dao.getlist
        }
        else {
            throw;
        }
        return list;
    }




    function totalOfValidators(address daoAddr) returns (uint)
    {
        uint total;

        if (msg.sender == chairperson) {
            Dao D = Dao(daoAddr);

            //Get total number of IDF validators in the list

            total = D.totalValidator();
        }
        else {
            throw;
        }

        return total;
    }


    // select 3 validators out of 5 and send proposal to ballot app
    // need to do a random genarator in the next step
    function selectValidators(bytes32 proposalId, address daoAddr, address ballotAddr) returns (bytes32[3] validators1)
    {
            uint total;
                        bool stop;
                        uint random;

        for(uint p = 0; p < 3; p++)
        {
                validatorsToVote[p] = 0x0;
        }

        if (msg.sender == chairperson) {
            list = getList(daoAddr);

            total = totalOfValidators(daoAddr);

            //check through the loop to check if the validator is unique
            for (uint i = 0; i < validatorsToVote.length; i++) {
                stop = false;
                while (stop == false) {
                    stop = true;
                    random = rand(0, total);

                    if (list[random] != 0x0) {
                        for (uint j = 0; j < validatorsToVote.length; j++) {
                            if (list[random] == validatorsToVote[j])
                                stop = false;
                        }

                        if (list[random] != 0x0 && stop == true) {
                            validatorsToVote[i] = list[random];
                        }
                     else {
                        stop = false;
                    }}
                }
            }

        validators1 = validatorsToVote;
        // Has been added here
        Ballot B = Ballot(ballotAddr);

        for(uint l = 0; l < 10; l++)
        {
                temp[l] = 0x0;
        }
        temp[0]=validatorsToVote[0];
        temp[1]=validatorsToVote[1];
        temp[2]=validatorsToVote[2];

        B.addSelectedValidator(proposalId, temp);

//NO need to call giveRightToVote, addSelectedValidator does that now
//(see above comment)         B.giveRightToVote(proposalId, validatorsToVote);
        }
        else {
            throw;
        }
    }


    function giveRightToVote(bytes32 proposalId, address ballotAddr) {

        if (msg.sender == chairperson) // Only the gatekeeper has access to give voting rights to validators
        {
            Ballot B = Ballot(ballotAddr);

            uint i;
            for (i = 0; i < validatorsToVote.length; i++) {
                B.giveRightToVote(proposalId, validatorsToVote[i]); // Send validator to ballot contract one by one
            }
        }
        else {
            throw;
        }
    }

    function rand(uint min, uint max) public returns(uint rnum)
    {
        nonce++;
        rnum = uint(sha3(nonce)) % (min + max) - min;
        return rnum;
    }

      // will be called by the gatekeeper.js
    // If the proposal is created, expired, or denied user will recieve a notification
    function deleteProposal(bytes32 proposalId){

          if (msg.sender == chairperson)
           {
            // delete all data from coidData struct
            delete proposals[proposalId];
            proposalDeleted("Your COID request has either expired or been rejected and the associated data is deleted.");
            }
    }
}
