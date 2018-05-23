import "CoreIdentity.sol";
import "IdentityDimensionControl.sol";
import "GateKeeper.sol";
import "MyGatekeeper.sol";
import "ballot.sol";

contract Recovery{

    CoreIdentity myCOID;
    address chairperson;
    recov recovStruct;
    uint recovered = 0;

    function Recovery()
    {
        chairperson = msg.sender;
    }
	
    modifier onlyBy(address _account) {
        if(_account != chairperson) throw;

        //require(msg.sender == _account);
        // Do not forget the "_;"! It will
        // be replaced by the actual function
        // body when the modifier is used.
        _
     }

    struct recov
    {
        uint time;  //timestamp for specific proposalId
        uint recoveryCondition;
        bool isHuman;
       // address myGKaddr;
       // address myIDFGKaddr;
       // address myCOIDaddr;
       // address myTrieaddr;
       // address myDimCtrlAddr;
        bytes32 myOldPubKey;
        bytes32 myCurrentPubKey;
        bytes32 proposalId;
        bytes32[10] identityRecoveryIdList;//recoverer
    }

    function setHasRecovered() internal{
	recovered = recovered + 1;	
    }
    function getHasRecovered() returns(uint){
	return(recovered);
    }
    function syncRecoverers(address CoidAddr) internal  returns(bool){
	bytes32[10] memory list;
	uint condition;

        myCOID = CoreIdentity(CoidAddr);
	(list,condition) = myCOID.getRecovery();
        setRecoveryIds(list,condition);
	return(true);
    }

    function setRecoveryIds(bytes32[10] theIdentityRecoveryList, uint theRecoveryCondition)
    {
        //set recovery struct here
        recovStruct.identityRecoveryIdList = theIdentityRecoveryList;
        recovStruct.recoveryCondition = theRecoveryCondition;
    }

    function getRecoveryIds() returns(bytes32[10], uint)
    {
        //set recovery struct here
        return(recovStruct.identityRecoveryIdList,recovStruct.recoveryCondition);
    }

    //function getRecoveryStruct() returns() {}
    //function setRecoveryStruct(bytes32 proposalId,bool isHuman,address myGKaddr,address myCOIDaddr,address myTrieaddr,address myDimCtrlAddr,bytes32 myCurrentPubKey) returns(bool){

     //   recovStruct.time = now;  
        //recovStruct.recoveryCondition = recoveryCondition;
      //  recovStruct.isHuman = isHuman;
      //  recovStruct.myGKaddr = myGKaddr;
      //  recovStruct.myCOIDaddr = myCOIDaddr;
      //  recovStruct.myTrieaddr = myTrieaddr;
      //  recovStruct.myDimCtrlAddr = myDimCtrlAddr;
        //recovStruct.myOldPubKey = myOldPubKey;
      //  recovStruct.myCurrentPubKey = myCurrentPubKey;
      //  recovStruct.proposalId = proposalId;
        //recovStruct.identityRecoveryIdList = identityRecoveryIdList;
       // return(true);
    //}

    //access chairperson only
    function confirmRecoverer(bytes32 recoverer, address myCOIDaddr) onlyBy(msg.sender) returns(bool success){
        success = false;
        syncRecoverers(myCOIDaddr);
        for(uint x=0;x<recovStruct.identityRecoveryIdList.length;x++){
            if(recoverer == recovStruct.identityRecoveryIdList[x]){ success = true; }
        }
    }

    //access chairperson only
    function startBallot(address ballotAddr, address myGKaddr, address myCOIDaddr, bool isHuman) onlyBy(msg.sender)  returns(bytes32 proposal){
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

