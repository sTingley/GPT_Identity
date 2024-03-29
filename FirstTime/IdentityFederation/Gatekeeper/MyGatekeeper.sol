import "CoreIdentity.sol";
import "ballot.sol";
import "Dao.sol";
import "IdentityDimensionControl.sol";

contract MyGateKeeper {

    //ResultIsReady function creates contracts
    CoreIdentity MyCoidIdentity;
    IdentityDimensionControl dimensionControl;

    //defined globally to save memory in ResultIsReady
    address coidIdentityAddr;
    address dimensionCtrlAddr;

    bytes32[10] validatorsToVote; // randomly selected validators from the DAO list
    address recoveryAddr = 0x0;
    uint public counter = 0;

    //MyGatekeeper.js listens for this event and inspects the results to know whether or not to create a COID and IdentityDimensionControl contract
    event resultReady(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr, address dimensionCtrlAddr, uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);
    //MyGatekeeper.js listens for this event and inspects the results to know whether or not to create an identity claim asset
    event resultReadyKYC(bytes32 proposalId, bool result, string resultMessage, address coidGKAddr, address coidAddr, address dimensionCtrlAddr, uint blockNumberVal, bytes32 blockHashVal, bytes32 blockchainIdVal, uint timestamp);
    //notify user if the proposal got deleted after experation
    event proposalDeleted(string notify);

    struct UniqueId {
        bytes32 uniqueId;
        string[10] uniqueIdAttributes_name;
        bytes32[10] uniqueIdAttributes_filehashvalue;
        string[10] uniqueIdAttributes_IPFSFileHash;
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
    struct IdentityAcct {
        string pubkey;  // hash of pubkey
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
        uint propType;
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
    mapping(bytes32 => IdentityAuditTrail) myIdentityAuditTrail;

    bytes32[] uniqueIdList;

    // The proposal Id is mapped with struct Proposal
    mapping(bytes32 => Proposal) proposals;

    mapping(uint => bytes32) proposalIdList;

    mapping(bytes32 => bool) calledBefore;

    address chairperson;
    
    modifier onlyBy(address _account) {
        if (_account != chairperson) throw;
        _
    }

    modifier requesterMatches(string _pubkey, bytes32 _proposalId) {
        if (sha3(_pubkey) != proposals[_proposalId].requester) throw;
        _
    }

    modifier accessCheck(address caller) {
        if(sha3(caller) != sha3(chairperson)) throw;
        _
    }

    /*This sets the Eris account that deployed the gatekeeper contract as the chairperson of a proposal
    tx.origin because this contract is created inside a Gatekeeper.sol function..*/
    function MyGateKeeper() {
       chairperson = tx.origin;
    }


    //debugging the uniqueIdList
    function debugIt(uint i) returns (bytes32 val) {
        val = uniqueIdList[i];
    }

    //function to determine update route
    function setPropType(bytes32 proposalId, uint propType) onlyBy(msg.sender) returns (uint success) {

        proposals[proposalId].propType = propType;

        if (proposals[proposalId].propType != 0){
            success =  proposals[proposalId].propType;
        }
    }

    //function to determine update route
    function getPropType(bytes32 proposalId) returns (uint) {
        return (proposals[proposalId].propType);
    }

    function initalizeRecovery(bytes32 proposalId) onlyBy(msg.sender) {
        //here we need to decide what to send as input...
    }

    // atStage(Stages.Recovery) transitionNext
    function getRecoveryAddress(bytes32 pubKey) returns (address) {
        return (recoveryAddr);
    }

    function setRecoveryAddress(address RecoveryAddress){
        //atStage(Stages.Active)
        recoveryAddr = RecoveryAddress;
    }

    /*Set coid requster of the Coid proposal
    This is going be to be used by gatekepper app to set up coid requster info including
    pubkey, messagehash, and signature(hash) of the coid requester*/
    function setCoidRequester(string pubkeyVal, bytes32 proposalId, string signatureVal, string messageVal)
    onlyBy(msg.sender) returns (bool result) {

        proposals[proposalId].coidData.myIdentityAcct.signature = signatureVal;
        proposals[proposalId].coidData.myIdentityAcct.pubkey = pubkeyVal;
        proposals[proposalId].coidData.myIdentityAcct.message = messageVal;
        proposals[proposalId].requester = sha3(pubkeyVal);
        //Store pubkey and signature struct IdentityAuditTrail in order to track based on based on proposalId
        myIdentityAuditTrail[proposalId].pubkey = pubkeyVal;
        myIdentityAuditTrail[proposalId].message = messageVal;
        myIdentityAuditTrail[proposalId].sig = signatureVal;
        proposals[proposalId].coid_requester_check = true;
        proposalIdList[counter] = proposalId;
        counter = counter + 1;
        result = proposals[proposalId].coid_requester_check;
    }


    //AF: updated types, added uniqueattrbute vals and cleaned up function and added if for msg.sender = chairperson condition
    function setmyUniqueID(
        string requesterVal,
        bytes32 proposalId,
        bytes32 uniqueIdVal,
        string uniqueIdAttributes_nameVal,
        bytes32 uniqueIdAttributes_filehashvalueVal,
        string uniqueIdAttributes_IPFSFileHashVal, uint index)
        onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {
        
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

        } else { result = false; }
    }

    //AF: update type and if condition for msg.sender
    function setmyControlID(string requesterVal, bytes32 proposalId, bytes32 controlIdVal, bytes32[10] controlIdListVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {

        if (proposals[proposalId].ownership_ID_check == true) {
            proposals[proposalId].coidData.myControlID.controlId = controlIdVal;
            proposals[proposalId].coidData.myControlID.controlIdList = controlIdListVal;
            proposals[proposalId].control_ID_check = true;
            result = proposals[proposalId].control_ID_check;

        } else { result = false; }
    }

    //AF: Update types and condition on msg.sender
    function setmyOwnershipTokenID(string requesterVal, bytes32 proposalId, bytes32 ownershipTokenIdVal, string ownershipTokenAttributesVal, uint[10] ownershipTokenQuantityVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {

        if (proposals[proposalId].control_ID_check == true) {
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenId = ownershipTokenIdVal;
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenQuantity = ownershipTokenQuantityVal;
            proposals[proposalId].coidData.myOwnershipTokenID.ownershipTokenAttributes = ownershipTokenAttributesVal;
            proposals[proposalId].ownership_token_check = true;
            result = proposals[proposalId].ownership_token_check;

        } else { result = false; }
    }

    //AF: change types and condition for msg.sender
    function setmyControlTokenID(string requesterVal, bytes32 proposalId, bytes32 controlTokenIdVal, string controlTokenAttributesVal, uint[10] controlTokenQuantityVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {

        if (proposals[proposalId].ownership_token_check == true) {
            proposals[proposalId].coidData.myControlTokenID.controlTokenId = controlTokenIdVal;
            proposals[proposalId].coidData.myControlTokenID.controlTokenQuantity = controlTokenQuantityVal;
            proposals[proposalId].coidData.myControlTokenID.controlTokenAttributes = controlTokenAttributesVal;
            proposals[proposalId].control_token_check = true;
            result = proposals[proposalId].control_token_check;

        } else { result = false; }

    }


    //AF: change types and condition for msg.sender
    function setmyIdentityRecoveryIdList(string requesterVal, bytes32 proposalId, bytes32[10] identityRecoveryIdListVal, uint recoveryConditionVal)
    onlyBy(msg.sender) requesterMatches(requesterVal, proposalId) returns (bool result) {

        if (proposals[proposalId].control_token_check == true) {
            proposals[proposalId].coidData.myIdentityRecoveryIdList.recoveryCondition = recoveryConditionVal;
            proposals[proposalId].coidData.myIdentityRecoveryIdList.identityRecoveryIdList = identityRecoveryIdListVal;
            proposals[proposalId].recovery_check = true;
            result = proposals[proposalId].recovery_check;

        } else { result = false; }
    }

    // This is going to be used by the gatekeeper contract to submit the COID proposal
    // true if the coidproposal has been initiated, flse, if the
    function initiateCoidProposalSubmission(address ballotAddr, bytes32 proposalId, uint yesVotesRequiredToPass, bool isHuman, address myGKaddr, uint propType)
    onlyBy(msg.sender) returns (bool result) {

            calledBefore[proposals[proposalId].requester] = true;
            proposals[proposalId].yesVotesRequiredToPass = yesVotesRequiredToPass;
            proposals[proposalId].numberOfVoters = validatorsToVote.length;
            proposals[proposalId].isHuman = isHuman;

            Ballot B = Ballot(ballotAddr);
            //setMyProposalID will trigger the event notifyValidator in ballot.sol
            result = B.setMyProposalID(proposalId, validatorsToVote.length, yesVotesRequiredToPass, isHuman, myGKaddr, propType);
            if (result) {
                proposals[proposalId].coidproposal_check = true;
            }

    }

    /*COID Data retrieval functions used in ballot.js
        NOTE: We will call the ballot method
                isValidatorPresent before we call these!
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

    // To get pubkey and uniqueId and sig based on specifica proposal Id
    function getmyIdentityAuditTrail(bytes32 proposalId) returns (string pubkeyRet, bytes32 uniqueIdRet, string sigRet, string messageRet) {

        pubkeyRet = myIdentityAuditTrail[proposalId].pubkey;
        uniqueIdRet = myIdentityAuditTrail[proposalId].uniqueId;
        messageRet = myIdentityAuditTrail[proposalId].message;
        sigRet = myIdentityAuditTrail[proposalId].sig;
    }

    function setmyIdentityAuditTrail(bytes32 proposalId,string pubkeyRet, bytes32 uniqueIdRet, string sigRet, string messageRet){
        myIdentityAuditTrail[proposalId].pubkey = pubkeyRet;
        myIdentityAuditTrail[proposalId].uniqueId = uniqueIdRet;
        myIdentityAuditTrail[proposalId].message = messageRet;
        myIdentityAuditTrail[proposalId].sig = sigRet;
    }

    // This function is used by gatekeeper app to check if the coid uniqueID is unique
    function isUnique(bytes32 uniqueIdVal) returns (bool isUniqueRet) {

        isUniqueRet = true;

        for (uint i = 0; i < uniqueIdList.length; i++) {
            if (uniqueIdVal == uniqueIdList[i]) {
                isUniqueRet = false;
            }
        }

        if (isUniqueRet) {
            // Store uniqueId if it is unique
            uniqueIdList.push(uniqueIdVal);
        }
    }

    //ST: this needs added security
    function getProposalIdByIndex(uint index) returns(bytes32 propId){
        propId = proposalIdList[index];
    }

    /*GET VOTING RESULT---
    This function is called by the gatekeeper app after catching ballot event, 'resultIsReadyIDF'.
    The owner of ballot contract and gatekeeper contract are the same, so we can still use onlyBy(chairperson)
    modifer. This function fires its own events depending on resultVal.*/
    function ResultIsReady(bool resultVal, bytes32 proposalId, bytes32 blockchainId) onlyBy(chairperson) {

        bool result;
        uint blockNumber;
        uint n = 2;
        result = resultVal;

        if (result == true) {
            coidIdentityAddr = createCOID(proposalId);
            dimensionCtrlAddr = createDimensionControl();

            proposals[proposalId].coidData.blockChainId = blockchainId;
            proposals[proposalId].coidData.blockHash = 0x0;

            //later make into just 'if' statements
            if(proposals[proposalId].propType == n) {
                resultReadyKYC(proposalId, result, "Your KYC has been integrated.", 0x0, coidIdentityAddr, dimensionCtrlAddr, blockNumber, proposals[proposalId].coidData.blockHash, blockchainId, now);

            } else {
                resultReady(proposalId, result, "Your identity has been integrated.", 0x0, coidIdentityAddr, dimensionCtrlAddr, proposals[proposalId].propType, proposals[proposalId].coidData.blockHash, blockchainId, now);
            }

        } else { //dont make coid

            if (proposals[proposalId].propType == n) {
                resultReadyKYC(proposalId, result, "Sorry, your KYC was rejected.", 0x0, 0x0, 0x0, 0x0, 0x0, 0X0, now);
            } else {
                resultReady(proposalId, result, "Sorry, your identity was rejected.", 0x0, 0x0, 0x0, 0x0, 0x0, 0X0, now);
            }

        }

        coidIdentityAddr = 0x0;
        dimensionCtrlAddr = 0x0;
    }


    /*CREATE COID, DIMENSIONCONTROL, MYGATEKEEPER contracts
    *//////////////////////////////////////////////////////
    function createCOID(bytes32 proposalId) onlyBy(chairperson) returns (address) {
        MyCoidIdentity = new CoreIdentity();
        return MyCoidIdentity;
    }

    function createDimensionControl() onlyBy(chairperson) returns (address) {
        dimensionControl = new IdentityDimensionControl();
        return dimensionControl;
    }

    function setValidators(bytes32 proposalId, bytes32[10] validators, address ballotAddr) onlyBy(chairperson) {

        uint total;
        bool stop;
        uint random;

        for (uint p = 0; p < validators.length; p++) {
            validatorsToVote[p] = validators[p];
        }

        Ballot B = Ballot(ballotAddr);
        //this function will internall call giveRightToVote
        B.addSelectedValidator(proposalId, validatorsToVote);
    }

    // function giveRightToVote(bytes32 proposalId, address ballotAddr) onlyBy(chairperson) {
    //     Ballot B = Ballot(ballotAddr);
    //     for (uint i = 0; i < validatorsToVote.length; i++) {
    //         B.giveRightToVote(proposalId, validatorsToVote[i]); // Send validator to ballot contract one by one
    //     }
    // }

    //If the proposal is created, expired, or denied the proposal data should be deleted
    function deleteProposal(bytes32 proposalId) onlyBy(chairperson) {

        delete proposals[proposalId];
        proposalDeleted("Your COID request has either expired or been rejected and the associated data is deleted.");
    }

    //kills the contract
    function kill() accessCheck(msg.sender) {
        suicide(this);
    }
}
