import "CoreIdentity.sol";
import "ballot.sol";
import "Dao.sol";
import "MyGatekeeper.sol";
import "IdentityDimensionControl.sol";

contract GateKeeper {

    //ResultIsReady function creates contracts
    CoreIdentity MyCoidIdentity;
    IdentityDimensionControl dimensionControl;
    MyGateKeeper MycoidGateKeeper;

    //defined globally to save memory in ResultIsReady
    address coidGKAddr;
    address coidIdentityAddr;
    address dimensionCtrlAddr;

    bytes32[35] list; //list of validstors from DAO
    bytes32[3] validatorsToVote; //randomly selected validators from the DAO list
    bytes32[10] temp; //used in selectValidators function

    uint nonce = 0; //incremented every time we call rand function

    //the IDFgatekeeper.js listens for this event and inspects the results to know whether or not to create a COID, MyGatekeeper, and IdentityDimensionControl contract
    event resultReady(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr, address dimensionCtrlAddr, uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);
    //IDFgatekeeper.js listens for this event and inspects the results to know whether or not to update the COID uniqueIDAttributes
    event resultReadyUniqueId(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr, address dimensionCtrlAddr, uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);
    //notify user if the proposal got deleted after experation
    event proposalDeleted(string notify); 

    //Structs for the COID elements as per TCS Digital Identity protocol
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
    //Store key and signature of COID requester as proof of submission.
    struct IdentityAcct {
        string pubkey;  //hash of pubkey
        string signature; //generated inside wallet
        string message; //hash of message
    }

    /*COID struct to combine all sub structs into one COID data structure.
    blockChainId, blockHash (of block holding COID data) serve as authentication stamp from the originating blockchain for BigChain*/
    struct CoidData {
        UniqueId myUniqueID;
        OwnershipId myOwnershipID;
        ControlId myControlID;
        OwnershipTokenId myOwnershipTokenID;
        ControlTokenId myControlTokenID;
        IdentityRecoveryIdList myIdentityRecoveryIdList;
        IdentityAcct myIdentityAcct;
        bytes32 blockHash;
        bytes32 blockChainId;
    }

    //hold all submitted identity data
    struct Proposal {
        CoidData coidData;
        uint time;
        bool coid_requester_check;
        bool unique_ID_check;
        bool ownership_ID_check;
        bool control_ID_check;
        bool ownership_token_check;
        bool control_token_check;
        bool recovery_check;
        bool coidproposal_check;
        
        bytes32 requester; //hash of wallet public key
        uint yesVotesRequiredToPass; //consensus condition
        uint numberOfVoters; //3 validators for COID creation
        bool isHuman; //true for initial COID
        bool forUID;
    }

    //keep track of proposalId, uniqueId, pubkey and signature for auditing
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

    address chairperson;
    
    modifier onlyBy(address account) {
        if (account != chairperson) throw;
        _
    }

    //wallet user will send unhashed pubkey in inital COID request
    modifier requesterMatches(string pubkey, bytes32 proposalId) {
        if (sha3(pubkey) != proposals[proposalId].requester) throw;
        _
    }
    
    //Sets the Eris account that deployed the gatekeeper contract as chairperson
    function GateKeeper() {
        chairperson = msg.sender;
    }

    //function setCoidType will be called by app to check if the COID proposal is for an individual or a thing
    function setisHuman(bytes32 proposalId, bool isHumanVal) onlyBy(msg.sender) returns (bool isHuman, address caller) {

        caller = msg.sender;

        proposals[proposalId].isHuman = isHumanVal;

        if (isHumanVal == true) {
            isHuman = true;

        } else {isHuman = false;}
    }

    //function to determine update route
    function setForUID(bytes32 proposalId, bool forUIDVal) onlyBy(msg.sender) returns (bool UID) {

        proposals[proposalId].forUID = forUIDVal;
        
        if (forUIDVal == true) {
            UID = true;

        } else {UID = false;}
    }

    /*Set coid requster of the Coid proposal
    This is going be to be used by gatekepper app to set up coid requster info including
    pubkey, messagehash, and signature(hash) of the coid requester*/
    function setCoidRequester(string pubkeyVal, bytes32 proposalId, string signatureVal, string messageVal)
    onlyBy(msg.sender) returns (bool result, address caller) {

        caller = msg.sender;
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
    
    function setmyUniqueID(
        string requesterVal,
        bytes32 proposalId,
        bytes32 uniqueIdVal,
        string uniqueIdAttributes_nameVal,
        bytes32 uniqueIdAttributes_filehashvalueVal,
        string uniqueIdAttributes_IPFSFileHashVal,
        uint index) onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {
        
        if (proposals[proposalId].coid_requester_check == true) {
            proposals[proposalId].coidData.myUniqueID.uniqueId = uniqueIdVal;
            proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_name[index] = uniqueIdAttributes_nameVal;
            proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_filehashvalue[index] = uniqueIdAttributes_filehashvalueVal;
            proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_IPFSFileHash[index] = uniqueIdAttributes_IPFSFileHashVal;

            //Store uniqueId into IdentityAuditTrail in order to audit (we set pubkey, sig, msg in setCoidRequester)
            myIdentityAuditTrail[proposalId].uniqueId = uniqueIdVal;
            proposals[proposalId].unique_ID_check = true;
            result = proposals[proposalId].unique_ID_check;

        } else {result = false;}
    }

    //AF: Update types and msg.sender condition
    function setmyOwnershipID(string requesterVal, bytes32 proposalId, bytes32 ownershipIdVal, bytes32[10] ownerIdListVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {

        if (proposals[proposalId].unique_ID_check == true) {
            proposals[proposalId].coidData.myOwnershipID.ownershipId = ownershipIdVal;
            proposals[proposalId].coidData.myOwnershipID.ownerIdList = ownerIdListVal;
            proposals[proposalId].ownership_ID_check = true;
            result = proposals[proposalId].ownership_ID_check;

         } else {result = false;}
    }

    //AF: update type and if condition for msg.sender
    function setmyControlID(string requesterVal, bytes32 proposalId, bytes32 controlIdVal, bytes32[10] controlIdListVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {
        
        if (proposals[proposalId].ownership_ID_check == true ) {
            proposals[proposalId].coidData.myControlID.controlId = controlIdVal;
            proposals[proposalId].coidData.myControlID.controlIdList = controlIdListVal;
            proposals[proposalId].control_ID_check = true;
            result = proposals[proposalId].control_ID_check;

        } else {result = false;}
    }

    //AF: Update types and condition on msg.sender
    function setmyOwnershipTokenID(string requesterVal, bytes32 proposalId, bytes32 ownershipTokenIdVal, string ownershipTokenAttributesVal, uint[10] ownershipTokenQuantityVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {
        
        if (proposals[proposalId].isHuman = true) {
                for (uint i=0; i<ownershipTokenQuantityVal.length; i++) {
                        if (ownershipTokenQuantityVal[i] != 0) {throw;}
                }

            if (proposals[proposalId].control_ID_check == true) {
                proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenId = ownershipTokenIdVal;
                proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenQuantity = ownershipTokenQuantityVal;
                proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenAttributes = ownershipTokenAttributesVal;
                proposals[proposalId].ownership_token_check = true;
                result = proposals[proposalId].ownership_token_check;

            } else {result = false;}
            
        }//end isHuman
    }

    //AF: change types and condition for msg.sender
    function setmyControlTokenID(string requesterVal, bytes32 proposalId, bytes32 controlTokenIdVal, string controlTokenAttributesVal, uint[10] controlTokenQuantityVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {

        if(proposals[proposalId].isHuman = true) {

            if (proposals[proposalId].ownership_token_check == true ) {
                proposals[proposalId].coidData.myControlTokenID.controlTokenId = controlTokenIdVal;
                proposals[proposalId].coidData.myControlTokenID.controlTokenQuantity = controlTokenQuantityVal;
                proposals[proposalId].coidData.myControlTokenID.controlTokenAttributes = controlTokenAttributesVal;
                proposals[proposalId].control_token_check = true;
                result = proposals[proposalId].control_token_check;

            } else {result = false;}

        }//end isHuman
    }


    //AF: change types and condition for msg.sender
    function setmyIdentityRecoveryIdList(string requesterVal, bytes32 proposalId, bytes32[10] identityRecoveryIdListVal, uint recoveryConditionVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {
        
        if (proposals[proposalId].control_token_check == true) {
            proposals[proposalId].coidData.myIdentityRecoveryIdList.recoveryCondition = recoveryConditionVal;
            proposals[proposalId].coidData.myIdentityRecoveryIdList.identityRecoveryIdList = identityRecoveryIdListVal;
            proposals[proposalId].recovery_check = true;
            result = proposals[proposalId].recovery_check;

        } else {result = false;}
    }


   // This is going to be used by the gatekeeper contract to submit the COID proposal
   // true if the coidproposal has been initiated, flse, if the
    function initiateCoidProposalSubmission(address ballotAddr, bytes32 proposalId, uint yesVotesRequiredToPass, bool isHuman)
    onlyBy(msg.sender) returns (bool result) {
        
        calledBefore[proposals[proposalId].requester] = true;
        proposals[proposalId].yesVotesRequiredToPass = yesVotesRequiredToPass;
        proposals[proposalId].numberOfVoters = validatorsToVote.length;
	    proposals[proposalId].isHuman = isHuman;

        Ballot B = Ballot(ballotAddr);
        //setMyProposalID will trigger the event notifyValidator in ballot.sol
        result = B.setMyProposalID(proposalId, validatorsToVote.length, yesVotesRequiredToPass, isHuman, 0x0,0);
        if (result) {
            proposals[proposalId].coidproposal_check = true;
        }

    }
    

    /*/////////////////////////////////////////////////////
    COID Data retrieval functions called in ballot.js
        NOTE: we do not check pubkey here but in javascript
    *//////////////////////////////////////////////////////

    function getmyUniqueID(bytes32 proposalId, uint index) onlyBy(msg.sender)
    returns (bool result, bytes32 uniqueIdRet, string uniqueIdAttributes_nameRet,
    bytes32 uniqueIdAttributes_filehashvalueRet, string uniqueIdAttributes_IPFSFileHashRet, uint indexs) {

        result = false;
        uniqueIdRet = proposals[proposalId].coidData.myUniqueID.uniqueId;
        uniqueIdAttributes_nameRet = proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_name[index];
        uniqueIdAttributes_filehashvalueRet = proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_filehashvalue[index];
        uniqueIdAttributes_IPFSFileHashRet = proposals[proposalId].coidData.myUniqueID.uniqueIdAttributes_IPFSFileHash[index];
        result = true;
    }

    function getmyOwnershipID(bytes32 proposalId) onlyBy(msg.sender)
    returns (bool result, bytes32 ownershipIdRet, bytes32[10] ownerIdListRet) {

        result = false;
        ownershipIdRet = proposals[proposalId].coidData.myOwnershipID.ownershipId;
        ownerIdListRet = proposals[proposalId].coidData.myOwnershipID.ownerIdList;
        result = true;
    }

    function getmyControlID(bytes32 proposalId) onlyBy(msg.sender)
    returns (bool result, bytes32 controlIdRet, bytes32[10] controlIdListRet) {

        result = false;
        controlIdRet = proposals[proposalId].coidData.myControlID.controlId;
        controlIdListRet = proposals[proposalId].coidData.myControlID.controlIdList;
        result = true;
    }

    function getmyOwnershipTokenID(bytes32 proposalId) onlyBy(msg.sender)
    returns (bool result, bytes32 ownershipTokenIdRet, string ownershipTokenAttributesRet, uint[10] ownershipTokenQuantityRet) {

        result = false;
        ownershipTokenIdRet = proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenId;
        ownershipTokenAttributesRet = proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenAttributes;
        ownershipTokenQuantityRet = proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenQuantity;
        result = true;
    }

    function getmyControlTokenID(bytes32 proposalId) onlyBy(msg.sender)
    returns (bool result, bytes32 controlTokenIdRet, string controlTokenAttributesRet, uint[10] controlTokenQuantityRet) {

        result = false;
        controlTokenIdRet = proposals[proposalId].coidData.myControlTokenID.controlTokenId;
        controlTokenAttributesRet = proposals[proposalId].coidData.myControlTokenID.controlTokenAttributes;
        controlTokenQuantityRet = proposals[proposalId].coidData.myControlTokenID.controlTokenQuantity;
        result = true;
    }

    function getmyIdentityRecoveryIdList(bytes32 proposalId) onlyBy(msg.sender)
    returns (bool result, bytes32[10] identityRecoveryIdListRet, uint recoveryConditionRet) {

        result = false;
        identityRecoveryIdListRet = proposals[proposalId].coidData.myIdentityRecoveryIdList.identityRecoveryIdList;
        recoveryConditionRet = proposals[proposalId].coidData.myIdentityRecoveryIdList.recoveryCondition;
        result = true;
    }

    // To get pubkey and uniqueId and sig based on specific proposal Id
    function getmyIdentityAuditTrail(bytes32 proposalId, string requesterVal) onlyBy(msg.sender)
    constant returns (string pubkeyRet, bytes32 uniqueIdRet, string sigRet, string messageRet) {
        pubkeyRet = myIdentityAuditTrail[proposalId].pubkey;
        uniqueIdRet = myIdentityAuditTrail[proposalId].uniqueId;
        messageRet = myIdentityAuditTrail[proposalId].message;
        sigRet =  myIdentityAuditTrail[proposalId].sig;
    }

    // This function is used by gatekeeper app to check if the coid uniqueID is unique
    function isUnique(bytes32 uniqueIdVal) returns (bool isUniqueRet) {
        
        isUniqueRet = true;

        for (uint i = 0; i<uniqueIdList.length; i++) {
           if (uniqueIdVal == uniqueIdList[i])
           isUniqueRet = false;
        }

        if (isUniqueRet) {
            // Store uniqueId if it is unique
            uniqueIdList.push(uniqueIdVal);
        }
    }


    /*GET VOTING RESULT---
    This function is called by the gatekeeper app after catching ballot event, 'resultIsReadyIDF'.
    The owner of ballot contract and gatekeeper contract are the same, so we can still use onlyBy(chairperson)
    modifer. This function fires its own events depending on resultVal.*/
    function ResultIsReady(bool resultVal, bytes32 proposalId, bytes32 blockchainId) onlyBy(chairperson) {
        
        bool result;
        uint blockNumber;
        result = resultVal;

        if (result == true) {
            //these addresses are declared globally
            coidIdentityAddr = createCOID(proposalId);
            coidGKAddr = createGateKeeper();
            dimensionCtrlAddr = createDimensionControl();

            proposals[proposalId].coidData.blockChainId = blockchainId;
            proposals[proposalId].coidData.blockHash = 0x0;

            if (proposals[proposalId].forUID) {
                resultReadyUniqueId(proposalId, result, "Your identity has been integrated.", coidGKAddr, coidIdentityAddr, dimensionCtrlAddr, blockNumber, proposals[proposalId].coidData.blockHash, blockchainId, now);
            } else {
                resultReady(proposalId, result, "Your identity has been edited.", coidGKAddr, coidIdentityAddr, dimensionCtrlAddr, blockNumber, proposals[proposalId].coidData.blockHash, blockchainId, now);
            }

        } else { //dont make coid

            if (proposals[proposalId].forUID) {
                resultReadyUniqueId(proposalId, result, "Sorry, your identity was rejected.", 0x0, 0x0, 0x0, 0x0, 0x0, 0X0, now);
            } else {
                resultReady(proposalId, result, "Sorry, your identity was rejected.", 0x0, 0x0, 0x0, 0x0, 0x0, 0X0, now);
            }

        }

        coidGKAddr = 0x0;
        coidIdentityAddr = 0x0;
        dimensionCtrlAddr = 0x0;
    }


    /*/////////////////////////////////////////////////////
    CREATE COID, DIMENSIONCONTROL, MYGATEKEEPER contracts
    *//////////////////////////////////////////////////////
    function createCOID(bytes32 proposalId) onlyBy(chairperson) returns (address) {
        MyCoidIdentity = new CoreIdentity();
        return MyCoidIdentity;
    }
    function createDimensionControl() onlyBy(chairperson) returns (address) {
        dimensionControl = new IdentityDimensionControl();
        return dimensionControl;
    }
    // Instantiate MyGateKeeper contract
    function createGateKeeper() onlyBy(chairperson) returns (address) {
        MycoidGateKeeper = new MyGateKeeper();
        return MycoidGateKeeper;
    }


    /*/////////////////////////////////////////////////////
    DAO functions...
    *//////////////////////////////////////////////////////

    //Get validator list from the DAO contract
    function getList(address daoAddr) onlyBy(chairperson) returns (bytes32[35] list) {
        Dao D = Dao(daoAddr);
        list = D.getList(); // get list from the Dao.getlist
    }

    //Get total number of IDF validators in the list
    function totalOfValidators(address daoAddr) returns (uint total) {
        Dao D = Dao(daoAddr);
        total = D.totalValidator();
    }

    // select 3 validators out of 5 and send proposal to ballot app
    // ST: Update random generator necessary?
    function selectValidators(bytes32 proposalId, address daoAddr, address ballotAddr) onlyBy(chairperson) returns (bytes32[3] validators1) {
        
        uint total;
        bool stop;
        uint random;

        for (uint p = 0; p < 3; p++) {
            validatorsToVote[p] = 0x0;
        }

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

                    } else {stop = false;}
                }
            }
        }
        
        validators1 = validatorsToVote;
        Ballot B = Ballot(ballotAddr);
        
        for (uint k = 0; k < 10; k++) {
            temp[k] = 0x0;
        }
        
        temp[0]=validatorsToVote[0];
        temp[1]=validatorsToVote[1];
        temp[2]=validatorsToVote[2];
        
        B.addSelectedValidator(proposalId, temp);
    }

    //used inside selectValidators
    function rand(uint min, uint max) internal returns(uint rnum) {
        nonce++;
        rnum = uint(sha3(nonce)) % (min + max) - min;
        return rnum;
    }

    //If the proposal is created, expired, or denied the proposal data should be deleted
    function deleteProposal(bytes32 proposalId) onlyBy(chairperson) {
        
        delete proposals[proposalId];
        proposalDeleted("Your COID request has either expired or been rejected and the associated data is deleted.");
    }

    //kills the contract
    // function kill() {
    //     suicide(this);
    // }
    
}
