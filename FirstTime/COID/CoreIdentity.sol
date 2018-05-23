import "OwnershipToken.sol";
import "ControlToken.sol";
import "Utils.sol";

pragma solidity ^0.4.4;
contract CoreIdentity {

    /*IMPORTANT:
    The following must be done to create a core identity.
    These functions are intended to be called ONLY for instantiation.
    They all cannot be in a constructor because that makes the stack too deep.
    (1) Call setUniqueID
    (2) Call setOwnership
    (3) Call setControl
    (4) Call setRecovery
    (5) Call StartCoid*
    *Call this ONLY ONCE after (1-4) have been called! This function changes the state to ACTIVE */

    struct UniqueId {
        bytes32 uniqueID;
        bytes32[10] uniqueIDAttributes;
        bytes32[10] uniqueIdAttributes_filehashvalue;
    }
    struct Ownership {
        bytes32 ownershipID;
        bytes32[10] ownerIDList;
        uint[10] ownershipStakes;
    }
    struct Control {
        bytes32 controlTokenID;
        bytes32[10] controlIDList;
        uint[10] controlTokensOwned;
    }
    struct IdentityRecoveryIdList {
        bytes32[10] identityRecoveryIdList;
        uint recoveryCondition;
    }

    //overall struct
    bool isHuman;
    UniqueId uniqueIdStruct;
    Ownership ownershipStruct;
    Control controlStruct;
    IdentityRecoveryIdList identityRecoveryIdListStruct;

    //helpers:
    bool hasEmpty;
    uint index;
    //Utils myUtils;
    bytes32[] hashMe;//helper

    //instantiate coid struct & tokens
    OwnershipToken OT;
    ControlToken CT;

    enum States { Initialized, Active, Recovery }

    //chairperson will be set in constructor to the blockchain account,
    //eventually we will have to account for several blockchain accounts
    address chairperson;

    States state;

    modifier onlyBy(address _account) {
	testIt = 55;
        if(_account != chairperson) throw;
        _;
    }

    modifier atState(States _state) {
	testIt = 56;
        if(_state != state) throw;
        _;
    }

    //This modifier goes to the next stage after the function is done.
    modifier transitionNext() {
	testIt = 57;
        nextState();
        _;
    }

    function nextState() internal {
	testIt = 58;
        state = States(uint(state) + 1);
    }

    function CoreIdentity() {
        state = States.Initialized;
        chairperson = tx.origin;
    }

    //debugging tool to see if the stack is too deep
    uint testIt = 0;
    function getIt() returns (uint val) {
        val = testIt;
    }

    uint order=0;
    function setRecoveryState() onlyBy(chairperson) atState(States.Active) transitionNext() returns (bool) {
        //check more things here
	//if(order == 0){
	   // state = States(uint(state) + 1);
	  //  order = 1;
	//}
        return true;
    }
    
    function setActiveState() onlyBy(chairperson) atState(States.Initialized) transitionNext()  returns (bool) {
        //check more things here
	//if(order == 2){
	//    state = States(uint(state) + 1);
	//    order = 0;
	//}
        return true;
    }

    function setInitState() onlyBy(chairperson) atState(States.Recovery) returns (bool) {
        //check more things here
	//if(order == 1){
	    state = States(uint(state) - 2);
	//    order = 2;
	//}
        return true;
    }

    function recoverGetAll() onlyBy(chairperson) atState(States.Recovery)
    returns(bytes32, bytes32[10], bytes32[10], bool, bytes32[10], uint[10], bytes32[10], uint[10], bytes32[10], uint) {
        return(uniqueIdStruct.uniqueID, uniqueIdStruct.uniqueIDAttributes, uniqueIdStruct.uniqueIdAttributes_filehashvalue, isHuman, ownershipStruct.ownerIDList, ownershipStruct.ownershipStakes, controlStruct.controlIDList, controlStruct.controlTokensOwned, identityRecoveryIdListStruct.identityRecoveryIdList,identityRecoveryIdListStruct.recoveryCondition);
    }

    //intended to be called only for instantiation
    function setUniqueID (bytes32 theUniqueID, bytes32[10] theUniqueIDAttributes, bytes32[10] theUniqueIDAttributesFileHashes, bool isHumanValue)
    onlyBy(msg.sender) atState(States.Initialized) {

        if (uniqueIdStruct.uniqueID == 0x0) {
            uniqueIdStruct.uniqueID = theUniqueID;
            uniqueIdStruct.uniqueIDAttributes = theUniqueIDAttributes;
            uniqueIdStruct.uniqueIdAttributes_filehashvalue = theUniqueIDAttributesFileHashes;
            isHuman = isHumanValue;
        }
        testIt = 1;
    }

    function getUniqueID() onlyBy(tx.origin) atState(States.Active)
    returns (bytes32 theUniqueID, bytes32[10] theUniqueIDAttributes, bytes32[10] theUniqueIDAttributesFileHashes, bool isHumanValue) {
        
        theUniqueID = uniqueIdStruct.uniqueID;
        theUniqueIDAttributes = uniqueIdStruct.uniqueIDAttributes;
        theUniqueIDAttributesFileHashes = uniqueIdStruct.uniqueIdAttributes_filehashvalue;
        isHumanValue = isHuman;
    }

    function setOwnership(bytes32[10] theOwnerIDList, uint[10] theOwnershipStakes) //set ownership struct
    onlyBy(msg.sender) atState(States.Initialized) {
        
        ownershipStruct.ownerIDList = theOwnerIDList;
        ownershipStruct.ownershipStakes = theOwnershipStakes;

        testIt = 2;
    }

    function setControl(uint[10] theControlTokens, bytes32[10] theControlIDList) //set control struct
    onlyBy(msg.sender) atState(States.Initialized) {

        controlStruct.controlIDList = theControlIDList;
        controlStruct.controlTokensOwned = theControlTokens;

        testIt = 3;
    }

    function setRecovery(bytes32[10] theIdentityRecoveryList, uint theRecoveryCondition) //set recovery struct
    onlyBy(msg.sender) atState(States.Initialized) {

        identityRecoveryIdListStruct.identityRecoveryIdList = theIdentityRecoveryList;
        identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;

        testIt = 4;
    }

    function getRecovery() onlyBy(tx.origin) atState(States.Active) returns(bytes32[10], uint) {
        return(identityRecoveryIdListStruct.identityRecoveryIdList,identityRecoveryIdListStruct.recoveryCondition);
    }

    function StartCoidIca() onlyBy(msg.sender) atState(States.Initialized) transitionNext() {
        testIt = 35;
    }


    /*/////////////////////////////////////////////////////
        START CONSTRUCTOR HELPER FUNCTION
            when this is called, we are 'initalized'
    *//////////////////////////////////////////////////////

   function StartCoid() onlyBy(msg.sender) atState(States.Initialized) transitionNext() returns (bytes32[10] test, bytes32[10] test2){
        bytes32[10] memory owners = ownershipStruct.ownerIDList;
        bytes32[10] memory controllers = controlStruct.controlIDList;
        (owners,controllers) = Utils.AtoSubsetOfB(owners,controllers);//this uses the utils library. aka no more deploying a new utils contract every time we make a coid
        //myUtils = new Utils();
        //(ownershipStruct.ownerIDList, controlStruct.controlIDList) = myUtils.AtoSubsetOfB(owners, controllers);
        test = controllers;
        test2 = ownershipStruct.ownerIDList;
        //calulateOwnershipID and calculateControlID are internal functions called ONCE
        ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
        controlStruct.controlTokenID = calculateControlID(controllers,uniqueIdStruct.uniqueID);

        // Instantiate OwnershipToken contract
        OT = new OwnershipToken(isHuman,ownershipStruct.ownershipID);
        // This is required to set ownership stake values for all owners
        OT.setOwnershipTokenVals(ownershipStruct.ownerIDList,ownershipStruct.ownershipStakes);testIt = 33;
        // Instantiate ControlToken contract
        CT = new ControlToken(ownershipStruct.ownerIDList,controlStruct.controlIDList,controlStruct.controlTokensOwned);

        testIt = 34;
   }

   function isOwner(bytes32 ownerHash) onlyBy(tx.origin) atState(States.Active) returns (bool result) {
        result = false;
        for (uint i = 0; i < ownershipStruct.ownerIDList.length; i++) {
            if (ownershipStruct.ownerIDList[i] == ownerHash) {
                result = true;
            }
        }
   }

   function isController(bytes32 controllerHash) onlyBy(tx.origin) atState(States.Active) returns (bool result) {
        result = false;
        for (uint i = 0; i < controlStruct.controlIDList.length; i++) {
            if (controlStruct.controlIDList[i] == controllerHash) {
                result = true;
            }
        }
   }

   function getOwners() onlyBy(tx.origin) atState(States.Active) returns (bytes32[10] result) {
        result = ownershipStruct.ownerIDList;
   }

   function getControllers() onlyBy(tx.origin) atState(States.Active) returns (bytes32[10] result) {
        result = controlStruct.controlIDList;
   }

    /*/////////////////////////////////////////////////////
        START CONTROLTOKEN FUNCTIONS
    *//////////////////////////////////////////////////////
   
   //for debugging
   function findIndex(bytes32 hashC) onlyBy(tx.origin) atState(States.Active) returns (uint indexC, bool wasFoundC) {
       (indexC,wasFoundC) = CT.findIndexOfController(hashC);
   }

   //get controller values
   function getList() onlyBy(tx.origin) atState(States.Active) returns (uint[10] vals) {
        vals = CT.getControllerVal();
   }
   
   function revokeDelegation(bytes32 controllerHash, bytes32 delegateeHash, uint amount, bool all)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {
       success = CT.revokeDelegation(controllerHash,delegateeHash,amount,all);
   }

   function spendMyTokens(bytes32 delegateeHash, uint amount) onlyBy(msg.sender) atState(States.Active) returns (bool result) {
       result = CT.spendMyTokens(delegateeHash,amount);
   }

   function myAmount(bytes32 delegateeHash) onlyBy(msg.sender) atState(States.Active) returns (uint amount) {
       amount = CT.myAmount(delegateeHash);
   }

   function delegate(bytes32 controllerHash, bytes32 delegateeHash, uint amount,uint timeFrame)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {
       success = CT.delegate(controllerHash,delegateeHash,amount,timeFrame);
   }

   function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {

       success = CT.changeTokenController(originalControllerHash,newControllerHash,amount);

       //update in struct
       if (success) {
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
       }
   }

   //ST 10-26 ... we need to look at this to see what happens with delegations when new token amt is lower
   function offsetControllerTokenQuantity(bytes32 owner, bytes32 controllerHash, int val)
   onlyBy(tx.origin) atState(States.Active) returns (bool success) {
       
       bool isOwner = OT.isOwner(owner);

       if (isOwner) {
           success = CT.offsetControllerTokenQuantity(controllerHash,val);
       }
       
       if (success) {
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
       }
   }

   function amountDelegated(bytes32 controllerHash) onlyBy(tx.origin) atState(States.Active) returns (uint val) {
       val = CT.amountDelegated(controllerHash);
   }

   function addController(bytes32 owner, bytes32 controllerHash, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success, bytes32[10] listo) {
       
       success = false;
       bool isOwner = OT.isOwner(owner);

       if (isOwner) {
           success = CT.addController(controllerHash, amount);
       }
       
       if (success) {
           //update controlStruct
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
           listo = CT.getControllersList();
       }
   }

   function removeController(bytes32 owner, bytes32 controllerHash)
   onlyBy(msg.sender) atState(States.Active) returns (bool success, uint minInd) {
       
       bool isOwner = OT.isOwner(owner);

       if (isOwner) {
           (success, minInd) = CT.removeController(controllerHash);
       }

       if (success) {
           //update controlStruct
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
       }
   }
   
   /*/////////////////////////////////////////////////////
        START OWNERSHIPTOKEN FUNCTIONS
    *//////////////////////////////////////////////////////

   function addOwner(bytes32 owner, bytes32 addr, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {

       bool isOwner = OT.isOwner(owner);

       if (isOwner) {
           success = OT.addOwner(addr, amount);
       }

       if (success) {
        //update ownershipStruct
        ownershipStruct.ownerIDList = OT.getOwnersList();
        ownershipStruct.ownershipStakes = OT.getOwnersVal();
       }
   }

   function removeOwner(bytes32 owner, bytes32 addr) onlyBy(msg.sender) atState(States.Active) returns (bool success) {

       bool isOwner = OT.isOwner(owner);

       if (isOwner) {
           success = OT.removeOwner(addr);
       }
       
       if (success) {
        //update ownershipStruct
        ownershipStruct.ownerIDList = OT.getOwnersList();
        ownershipStruct.ownershipStakes = OT.getOwnersVal();
       }
   }
   
   function myTokenAmount(bytes32 ownershipHash) onlyBy(tx.origin) atState(States.Active) returns (uint val) {
       val = OT.getOwnershipVal(ownershipHash);
   }

   function giveTokens(bytes32 originalOwner, bytes32 newOwner, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success, bool isOwner1, bool isOwner2) {

       isOwner1 = OT.isOwner(originalOwner);
       isOwner2 = OT.isOwner(newOwner);

       success = false;
       if (isOwner1 && isOwner2) {

           success = true;
           //TODO: get val1 and val2 from the coid struct (find their indices)
           uint val1 = myTokenAmount(originalOwner);
           uint val2 = myTokenAmount(newOwner);

           val1 = val1 - amount;
           val2 = val2 + amount;

           isOwner1 = OT.updateOwnershipVal(originalOwner, val1);
           isOwner2 = OT.updateOwnershipVal(newOwner, val2);

           if(val1 == 0) {
               OT.removeOwner(originalOwner);
               ownershipStruct.ownerIDList = OT.getOwnersList();
               ownershipStruct.ownershipStakes = OT.getOwnersVal();
               //ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
           }
       }
   }
   
   function addRecovery(bytes32 owner, bytes32 theIdentityRecoveryList, uint theRecoveryCondition)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {
       
       success = OT.isOwner(owner);

       if (success) {
           success = false;
           bool complete = false;
           uint j = 0;
           
           if (identityRecoveryIdListStruct.identityRecoveryIdList[9] == 0x0 || identityRecoveryIdListStruct.identityRecoveryIdList[9] == 0) {
               //set recovery struct here
               while (!complete) {
                   if (theIdentityRecoveryList != 0x0 && theIdentityRecoveryList != 0 && identityRecoveryIdListStruct.identityRecoveryIdList[j] == 0x0) {
                       identityRecoveryIdListStruct.identityRecoveryIdList[j] = theIdentityRecoveryList;
                       complete = true;
                       success = true;
                   }
                   j++;
                   if (j >= 10) {
                       complete = true;
                       success = false;
                   }
               }
               
               if (theRecoveryCondition > 0) {
                   identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;
                   //complete = true;
               }
               testIt = 5;
           }
       }
   }

   
   function removeRecovery(bytes32 owner, bytes32 theIdentityRecoveryList, uint theRecoveryCondition)
   onlyBy(msg.sender) atState(States.Active) returns (bool complete) {

       bool isOwner = OT.isOwner(owner);
       complete = false;

       if (isOwner) {
           bool finding = true;
           uint j = 9;
           
           for (uint i = 0; i < 10; i++) {
               
               if (identityRecoveryIdListStruct.identityRecoveryIdList[i] == theIdentityRecoveryList) {
                   identityRecoveryIdListStruct.identityRecoveryIdList[i] = 0x0;
                   
                   while (finding) {
                       
                       if (identityRecoveryIdListStruct.identityRecoveryIdList[j] != 0x0 && identityRecoveryIdListStruct.identityRecoveryIdList[j] != 0) {
                           finding = false;
                           complete = true;
                           identityRecoveryIdListStruct.identityRecoveryIdList[i] = identityRecoveryIdListStruct.identityRecoveryIdList[j];
                       }
                       if (j==0) {finding = false;}
                       j--;
                   }
               }
           }
           
           if (theRecoveryCondition != 0x0) {
               identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;
               complete = true;
           }
           testIt = 6;
       }

   }
   
   /*/////////////////////////////////////////////////////
        HELPER FUNCTIONS
   *//////////////////////////////////////////////////////

   function publicTest() returns (uint index, bool hasEmpty) {
        (index,hasEmpty) = firstEmptyIndex(controlStruct.controlIDList);
   }

   function firstEmptyIndex(bytes32[10] myArray) internal returns (uint index, bool hasEmpty) {
        
        bool stop = false;
        index = 0;

        for (uint i = 0; i < myArray.length; i++) {
            if (myArray[i] == 0 && stop == false) {
                stop = true;
                index = i;
            }
        }
        hasEmpty = stop;
   }

   function calculateOwnershipID(bytes32[10] owners, bytes32 uniqueID) internal returns (bytes32 ownershipID) {

       ownershipID = 0x0;

       if(ownershipStruct.ownershipID == 0x0) {
           
           hashMe.length = 0;
           
           for (uint k = 0; k < owners.length;k++) {
               if (owners[k] != 0) {
                   hashMe.push(owners[k]);
               }
           }
           
           bytes32 myVal;
           uint j = 0;
           
           //if(hashMe.length > 1) {
           //    for (uint i = 1; i < hashMe.length; i++) {
           //        myVal = hashMe[i];
           //        j = i -1;
           //        
           //        while(j >= 0 && hashMe[j] > myVal) {
           //            hashMe[j+1] = hashMe[j];
           //            j = j -1;
           //        }
           //        hashMe[j+1] = myVal;
           //    }
          // }
           ownershipID = sha3(uniqueID,hashMe);
       }

   }

   function calculateControlID(bytes32[10] controllers, bytes32 uniqueID) internal returns (bytes32 controlID) {

       controlID = 0x0;

       if (controlStruct.controlTokenID == 0x0){
           
           hashMe.length = 0;
           
           for (uint k = 0; k < controllers.length;k++) {
               if (controllers[k] != 0) {
                   hashMe.push(controllers[k]);
               }
           }
           
           bytes32 myVal;
           uint j = 0;
           //if (hashMe.length > 1) {
           //    for (uint i = 1; i < hashMe.length; i++) {
           //        myVal = hashMe[i];
           //        j = i -1;
           //        
           //        while (j >= 0 && hashMe[j] > myVal) {
           //            hashMe[j+1] = hashMe[j];
           //            j = j -1;
           //        }
           //        hashMe[j+1] = myVal;
           //    }
           //}
           controlID = sha3(uniqueID,hashMe);
       }

   }

   function kill() onlyBy(msg.sender) atState(States.Recovery) {
       suicide(this);
   }
   

}

