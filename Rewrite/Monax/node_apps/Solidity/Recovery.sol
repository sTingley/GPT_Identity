/*********************************************************************************************
This contract is used in the case that a CoreIdentity for a human becomes compromised

It is called by a recovery Node app after consensus is reached on a recovery proposal,
(firing of the ballot.sol event 'startRecovery')

This contract will be changed when we come back to the recovery protocol again and fully
integrate the Airbitz/Edge SDK for private key recovery; we plan to utilize the Airbitz
storage wallets instead of storing contract addresses inside of this contract

*********************************************************************************************/

import "CoreIdentity.sol";
import "IdentityDimensionControl.sol";
import "GateKeeper.sol";
import "MyGatekeeper.sol";
import "ballot.sol";

pragma solidity ^0.4.4;
contract Recovery {

    CoreIdentity myCOID; //Inside 'syncRecoverers' we will pass an address to this reference
    address chairperson;
    recov recovStruct; //Recovery struct which holds necessary recovery data for contract rollover
    uint recovered = 0;

    function Recovery() {
        chairperson = msg.sender;
    }

    modifier onlyBy(address _account) {
        if(_account != chairperson) {throw;}

        //require(msg.sender == _account);
        // Do not forget the "_;"! It will
        // be replaced by the actual function
        // body when the modifier is used.
        _;
     }

    struct recov {
        uint time;  //timestamp for specific proposalId
        uint recoveryCondition;
        bool isHuman;
        bytes32 myOldPubKey;
        bytes32 myCurrentPubKey;
        bytes32 proposalId;
        bytes32[10] identityRecoveryIdList;//recoverer
    }

    function setHasRecovered() internal {
        recovered = recovered + 1;
    }
    function getHasRecovered() returns(uint){
        return(recovered);
    }
    function syncRecoverers(address CoidAddr) internal  returns(bool) {
        bytes32[10] memory list;
        uint condition;

        myCOID = CoreIdentity(CoidAddr);
        (list,condition) = myCOID.getRecovery();
        setRecoveryIds(list,condition);
        return(true);
    }

    function setRecoveryIds(bytes32[10] theIdentityRecoveryList, uint theRecoveryCondition) {
        //set recovery struct here
        recovStruct.identityRecoveryIdList = theIdentityRecoveryList;
        recovStruct.recoveryCondition = theRecoveryCondition;
    }

    function getRecoveryIds() returns(bytes32[10], uint) {
        //set recovery struct here
        return(recovStruct.identityRecoveryIdList,recovStruct.recoveryCondition);
    }

    //access chairperson only
    function confirmRecoverer(bytes32 recoverer, address myCOIDaddr) onlyBy(msg.sender) returns(bool success) {
        success = false;
        syncRecoverers(myCOIDaddr);
        for(uint x=0;x<recovStruct.identityRecoveryIdList.length;x++) {
            if(recoverer == recovStruct.identityRecoveryIdList[x]) { success = true; }
        }
    }

    /*This function will be called by the recovery Node app endpoint /startRecoveryBallot-
    ACTION REQUIRED: do we need to pass the recoverer's key here? Or can we check in the app the requester is a recoverer?
    ACTION REQUIRED: the ballot address should be known ahead of time?
    */
    function startBallot(address ballotAddr, address myGKaddr, address myCOIDaddr, bool isHuman) onlyBy(msg.sender)  returns(bytes32 proposal) {
        Ballot B = Ballot(ballotAddr);
        syncRecoverers(myCOIDaddr);
        bytes32 proposalId = B.getProposalId();//generates propId
        B.addSelectedValidator(proposalId, recovStruct.identityRecoveryIdList);// temp is bytes32[10]
        B.setMyProposalID(proposalId, recovStruct.identityRecoveryIdList.length, recovStruct.recoveryCondition, isHuman, myGKaddr, 3); // trigger the event COIDRequest in ballot.sol
        proposal = proposalId;
    }


    //function getBytes(address _addr) internal returns (bytes o_code) {
    //    assembly {
    //        // retrieve the size of the code, this needs assembly
    //        let size := extcodesize(_addr)
    //        // allocate output byte array - this could also be done without assembly
    //        // by using o_code = new bytes(size)
    //        o_code := mload(0x40)
    //        // new "memory end" including padding
    //        mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
    //        // store length in memory
    //        mstore(o_code, size)
    //        // actually retrieve the code, this needs assembly
    //        extcodecopy(_addr, add(o_code, 0x20), 0, size)
    //    }
    //}




}