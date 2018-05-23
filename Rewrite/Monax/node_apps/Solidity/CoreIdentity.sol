/*********************************************************************************************
This contract represents a digital identity as defined by the TCS Digital Identity Protocol
as per 4 main characteristics- uniqueness, ownership, control, recovery

This contract holds methods to update these structs and internally uses an instance of
ControlToken.sol and OwnershipToken.sol when dealing with CT and OT elements

This contract also makes use of Utils.sol, a Solidity file which handles array operations

All CoreIdentity membership proposals for human and nonhuman identities go to the proper gatekeeper
to be voted on and ONLY IF affirmative consensus is reached on the proposal inside the Gatekeeper/MyGatekeeper
will an instance of this CoreIdentity contract be created. At that point the the proposal data is placed
inside the CoreIdentity instance and this contract 2) deleted from the Gatekeeper/MyGatekeeper contract

The same voting process will take place should a user choose to add an Official ID / UniqueIDAttribute-
As these attributes are all verified claims, the request will need to go to the proper Gatekeeper/MyGatekeeper
that initially aprproved the identity proposal and affirmative consensus will have to be reached on
that proposal before the UniqueIdStruct is updated in the proper CoreIdentity.sol contract
*********************************************************************************************/

import "OwnershipToken.sol";
import "ControlToken.sol";  
import "Utils.sol";

pragma solidity ^0.4.4;
contract CoreIdentity {

    /*The following functions must be called by the appropriate gatekeeper (Gatekeeper.sol or MyGatekeeper.sol)
    These functions are intended to be called ONLY ONCE during instantiation.
    They cannot all be set in a constructor because that makes the stack too deep.
    (1) Call setUniqueID
    (2) Call setOwnership
    (3) Call setControl
    (4) Call setRecovery
    (5) Call StartCoid* OR StartCoidIca* based on the 'isHuman' value inside the proposal
    *Change global variable 'state' to Active

    ACTION REQUIRED: 
    There is no longer a requirement for the structs to be set in order so during a rewrite this condition could
    be removed and the Node app would have to 'promisify' each Solidity method was executed correctly.

    Structs as defined in the TCS DI Protocol-
    As explained above, Gatekeeper.sol or a MyGatekeeper.sol will set these structs upon affirmative consensus
    NOTE: uniqueIDAttributes are frequently referred to as the CoreIdentity's "Official IDs"*/
    struct UniqueId {
        bytes32 uniqueID; //generated once based on initial uniqueIDAttributes submitted
        bytes32[10] uniqueIDAttributes; //user entered labels ex: "USA passport"
        bytes32[10] uniqueIdAttributes_filehashvalue; //sha3 hash of uploaded document
    }
    struct Ownership {
        bytes32 ownershipID; //generated once. sha3 (public keys of owners + uniqueID)
        bytes32[10] ownerIDList; //list of sha3(public keys of owners)
        uint[10] ownershipStakes; //list of owner's token quantities
    }
    struct Control {
        bytes32 controlID; //generated once. sha3 (public keys of owners + uniqueID)
        bytes32[10] controlIDList; //list of sha3(public key of controllers)
        uint[10] controlTokensOwned; //list of controller's token quantites
    }
    struct IdentityRecoveryIdList {
        bytes32[10] identityRecoveryIdList; //sha3 (public keys of recoverers)
        uint recoveryCondition; //n-of-m condition for recovery
    }

    /*ACTION REQUIRED: We should check this value in the setOwnership
    it is currently not being used but only set*/
    bool isHuman;

    UniqueId uniqueIdStruct;
    Ownership ownershipStruct;
    Control controlStruct;
    IdentityRecoveryIdList identityRecoveryIdListStruct;

    //helper variable used inside 'calculateControlID' and 'calculateOwnershipID'
    //ACTION REQUIRED: move from global storage to function memory and verify there are no stack errors
    bytes32[] hashMe;

    //OwnershipToken and ControlToken references
    OwnershipToken OT;
    ControlToken CT;

    /*Set to Initialized in the constructor, Active inside 'startCoid' OR 'stateCoidIca',
    then Recovery in 'setRecoveryState'*/
    enum States { Initialized, Active, Recovery }
    States state;

    /*chairperson will be set in constructor to the Monax account which deployed the contract,
    eventually we will have to account for several blockchain accounts*/
    address chairperson;

    //Make sure only the proper Monax account is calling this contract
    modifier onlyBy(address _account) {
        testIt = 55;
        if (_account != chairperson) {throw;}
        _;
    }

    //Make sure of the contract 'state'
    modifier atState(States _state) {
        testIt = 56;
        if (_state != state) {throw;}
        _;
    }

    /*This modifier advances the global state variable 'state' by
    calling the internal method 'nextState' after the function is complete*/
    modifier transitionNext() {
        testIt = 57;
        nextState();
        _;
    }

    /*********************************************************************************************
    CONSTRUCTOR-
        Here we set 'state' to Initialized & the chairperson address to the Monax acct*
        *msg.sender will change based on who is calling this contract
    *********************************************************************************************/
    function CoreIdentity() {
        state = States.Initialized;
        chairperson = tx.origin;
    }

    /*********************************************************************************************
    DEBUGGING FUNCTION-
        'testIt' var and 'getIt' function used to see if the stack is too deep
    *********************************************************************************************/
    uint testIt = 0;
    function getIt() returns (uint val) {
        val = testIt;
    }

    /*********************************************************************************************
    Functions which will change the state variable 'state'
    ACTION REQUIRED: Evaulate these when we come back to Airbitz and the DI Protocol recovery process
    *********************************************************************************************/
    uint order = 0;

    function setRecoveryState() onlyBy(chairperson) atState(States.Active) transitionNext() returns (bool) {
        //check more things here
        //if(order == 0){
           // state = States(uint(state) + 1);
          //  order = 1;
        //}
        return true;
    }

    function setActiveState() onlyBy(chairperson) atState(States.Initialized) transitionNext() returns (bool) {
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
    
    /*********************************************************************************************
    *********************************************************************************************/
    //ACTION REQUIRED: Evaluate how this function may change after we integrate Airbitz
    function recoverGetAll() onlyBy(chairperson) atState(States.Recovery)
    returns(bytes32, bytes32[10], bytes32[10], bool, bytes32[10], uint[10], bytes32[10], uint[10], bytes32[10], uint) {
        return(uniqueIdStruct.uniqueID, uniqueIdStruct.uniqueIDAttributes, uniqueIdStruct.uniqueIdAttributes_filehashvalue, isHuman, ownershipStruct.ownerIDList, ownershipStruct.ownershipStakes, controlStruct.controlIDList, controlStruct.controlTokensOwned, identityRecoveryIdListStruct.identityRecoveryIdList,identityRecoveryIdListStruct.recoveryCondition);
    }

    /*This function will update the UniqueIdStruct within this contract by adding a new 'OfficialID' (attribute)-
    This function is called by both the IDFGatekeeper Node app as well as the MyGatekeeper Node app after
    consensus has been reach on an 'addUniqueId' proposal (propType=0, forUniqueId=true) ---> this means
    that either the resultReadyUniqueId event (Gatekeeper.sol) or resultReadyUniqueId(MyGatekeeper.sol) event has fired.
    The uniqueID is provided to the API as well as the to-be-added user-defined attribute and sha256 hash of the file

    ACTION REQUIRED: This function should return at least one boolean value to tell the caller if the value was added-
        currently this function will not let the caller know if the the max attribute length has been hit..
        it is also possible that in a rewrite we will not have a max attribute length?
    */
    function addUniqueID(bytes32 theUniqueID, bytes32 theUniqueIDAttributes, bytes32 theUniqueIDAttributesFileHashes)
    onlyBy(msg.sender) atState(States.Active) {
        
        bool done = false;
        uint i = 0;
        while (!done) {
            //Make sure there is an index available in uniqueIDAttributes && 'theUniqueID' matches the value stored in the contract
            if (uniqueIdStruct.uniqueIDAttributes[i] == 0x0 && theUniqueID == uniqueIdStruct.uniqueID) {
                uniqueIdStruct.uniqueIDAttributes[i] = theUniqueIDAttributes;
                uniqueIdStruct.uniqueIdAttributes_filehashvalue[i] = theUniqueIDAttributesFileHashes;
                done = true;
            }
            i++;
            if (i >= uniqueIdStruct.uniqueIDAttributes.length) {
                done = true;
            }
            
        }
        testIt = 55;
    }

    /*Set the UniqueID struct inside the contract's storage-
    Called after instantiation by the IDFGatekeeper app of MyGatkeeeper app
    */
    function setUniqueID (bytes32 theUniqueID, bytes32[10] theUniqueIDAttributes, bytes32[10] theUniqueIDAttributesFileHashes, bool isHumanValue) onlyBy(msg.sender) atState(States.Initialized) {

        if (uniqueIdStruct.uniqueID == 0x0) {
            uniqueIdStruct.uniqueID = theUniqueID;
            uniqueIdStruct.uniqueIDAttributes = theUniqueIDAttributes;
            uniqueIdStruct.uniqueIdAttributes_filehashvalue = theUniqueIDAttributesFileHashes;
            isHuman = isHumanValue;
        }
        testIt = 1;
    }

    /*Retrieve the UniqueID from the contract's storage-
    This function is called inside the MyCOID Node app endpoint 'addUniqueAttributes'
    NOTE: Digital Twin will keep this data so generally we dont need to ask the contract for it
    */
    function getUniqueID() onlyBy(tx.origin) atState(States.Active)
    returns (bytes32 theUniqueID, bytes32[10] theUniqueIDAttributes, bytes32[10] theUniqueIDAttributesFileHashes, bool isHumanValue) 
    {

        theUniqueID = uniqueIdStruct.uniqueID;
        theUniqueIDAttributes = uniqueIdStruct.uniqueIDAttributes;
        theUniqueIDAttributesFileHashes = uniqueIdStruct.uniqueIdAttributes_filehashvalue;
        isHumanValue = isHuman;
    }
    /*********************************************************************************************
    *********************************************************************************************/

    /*Set the ownership struct inside the contract's storage-
    Called after instantiation by the IDFGatekeeper app of MyGatkeeeper app
    */
    function setOwnership(bytes32[10] theOwnerIDList, uint[10] theOwnershipStakes) onlyBy(msg.sender) atState(States.Initialized) {

        ownershipStruct.ownerIDList = theOwnerIDList;
        ownershipStruct.ownershipStakes = theOwnershipStakes;

        testIt = 2;
    }

    /*Set the control struct inside the contract's storage-
    Called after instantiation by the IDFGatekeeper app of MyGatkeeeper app
    */
    function setControl(uint[10] theControlTokens, bytes32[10] theControlIDList) onlyBy(msg.sender) atState(States.Initialized) {

        controlStruct.controlIDList = theControlIDList;
        controlStruct.controlTokensOwned = theControlTokens;

        testIt = 3;
    }

    /*Set the recovery struct inside the contract's storage-
    Called after instantiation by the IDFGatekeeper app of MyGatkeeeper app
    */
    function setRecovery(bytes32[10] theIdentityRecoveryList, uint theRecoveryCondition) onlyBy(msg.sender) atState(States.Initialized) {

        identityRecoveryIdListStruct.identityRecoveryIdList = theIdentityRecoveryList;
        identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;

        testIt = 4;
    }

    /*Recovery Node app Will need to get recovery information if recovering the CoreIdentity contract data-
    There is a Recovery.sol method 'syncRecoverers' which is called by Recovery.sol
    ACTION REQUIRED: Evaulate the recovery methods when we come back to Airbitz
    */
    function getRecovery() onlyBy(tx.origin) atState(States.Active) returns(bytes32[10], uint) {
        return(identityRecoveryIdListStruct.identityRecoveryIdList,identityRecoveryIdListStruct.recoveryCondition);
    }

    /*********************************************************************************************
    If an ICA is created, this function will be called. 'StartCoid' is not called in this case
    When this is called, we are 'initialized'
    ACTION REQUIRED (ST): Put ICAs inside the CoreIdentity contract's uniqueID struct that it
    references instead of creating a CoreIdentity contract from an ICA
    *********************************************************************************************/
    function StartCoidIca() onlyBy(msg.sender) atState(States.Initialized) transitionNext() {
        testIt = 35;
    }
    
    /*********************************************************************************************
    When this is called, we are 'initalized',
        OwnershipToken & ControlToken contracts created
        This function will place the contract in 'active' state
        Thid function takes no input and returns the ownerIDList and controlIDList as output
    *********************************************************************************************/
    function StartCoid() onlyBy(msg.sender) atState(States.Initialized) transitionNext() returns (bytes32[10] test, bytes32[10] test2) {
        
        bytes32[10] memory owners = ownershipStruct.ownerIDList;
        bytes32[10] memory controllers = controlStruct.controlIDList;
        /*Utils Solidity library is deployed with CoreIdentity.sol-
        No more deploying a new Utils contract every time we make a CoreIdentity!*/
        (owners,controllers) = Utils.AtoSubsetOfB(owners,controllers);
        
        test = controllers;
        test2 = owners;

        //calulateOwnershipID calculateControlID are internal functions callable one time
        ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
        controlStruct.controlID = calculateControlID(controllers,uniqueIdStruct.uniqueID);

        //Instantiate OwnershipToken contract
        OT = new OwnershipToken(isHuman,ownershipStruct.ownershipID);
        //This is required to set ownership stake values for all owners
        OT.setOwnershipTokenVals(ownershipStruct.ownerIDList,ownershipStruct.ownershipStakes);
        //ACTION REQUIRED: Suggest we try to move the logic inside setOwnershipTokenVals to the OwnershipToken constructor
        
        testIt = 33;
        // Instantiate ControlToken contract
        CT = new ControlToken(ownershipStruct.ownerIDList,controlStruct.controlIDList,controlStruct.controlTokensOwned);

        testIt = 34;
    }

   /*Check a hashed secp256k1 public key is in the ownerIDList-
   Called by this contract, IdentityDimensionControl.sol, MyCOID Node app
   */
   function isOwner(bytes32 ownerHash) onlyBy(tx.origin) atState(States.Active) returns (bool result) {
        result = false;
        for (uint i = 0; i < ownershipStruct.ownerIDList.length; i++) {
            if (ownershipStruct.ownerIDList[i] == ownerHash) {
                result = true;
            }
        }
   }

   function checkOwnerSync(bytes32 ownerHash) returns(bool core, bool own, bool control) {
       uint garb = 0;
       core = isOwner(ownerHash);
       own = OT.isOwner(ownerHash);
       (control, garb) = CT.ownerExists(ownerHash);
   }

   function getAllOwnerLists() returns(bytes32[10] core, bytes32[10] own, bytes32[10] control) {
       core = getOwners();
       own = OT.getOwnersList();
       control = CT.getControllersList();//add a function later
   }

   /*Check a hashed secp256k1 public key is in the controlIDList-
   Called by this contract, IdentityDimensionControl.sol, MyCOID Node app
   */
   function isController(bytes32 controllerHash) onlyBy(tx.origin) atState(States.Active) returns (bool result) {
        result = false;
        for (uint i = 0; i < controlStruct.controlIDList.length; i++) {
            if (controlStruct.controlIDList[i] == controllerHash) {
                result = true;
            }
        }
    }
   
   /*ACTION REQUIRED: 'getOwners' and 'getControllers' should check the caller and verify it is the 
   proper IdentityDimensionControl contract ... we need to add the IdentityDimensionControl (hashed) address to this contract*/

   /*returns the ownerIDList-
   IdentityDimensionControl.sol calls this inside 'IdentityDimensionControlInstantiation' so that the
   'Dimension Manager contract' knows about the owners of the COID from which the dimension extends;
   it also calls this inside 'resyncWithCoid' so that only current owners can create
   IdentityDimensionControlToken delegations 
   */
   function getOwners() onlyBy(tx.origin) atState(States.Active) returns (bytes32[10] result) {
        result = ownershipStruct.ownerIDList;
    }

   /*returns the ownerIDList-
   IdentityDimensionControl.sol calls this inside 'IdentityDimensionControlInstantiation' so that the
   'Dimension Manager contract' knows about the controllers of the COID from which the dimension extends;
   it also calls this inside 'resyncWithCoid' so that only current controllers can create
   IdentityDimensionControlToken delegations 
   */
   function getControllers() onlyBy(tx.origin) atState(States.Active) returns (bytes32[10] result) {
       result = controlStruct.controlIDList;
    }

    /*********************************************************************************************
    CONTROLTOKEN FUNCTIONS
        Control defined as per TCS DI Protocol
        Controllers can delegate their ControlTokens to delegatees
        ACTION REQUIRED: These could be altered... owners don't care about ControlTokens
    *********************************************************************************************/

   //Retrieve controller token values from the ControlToken contract
   function getList() onlyBy(tx.origin) atState(States.Active) returns (uint[10] vals) {
        vals = CT.getControllerVal();
    }

   /*Revoke a ControlToken (delegation) from a delegatee-
   -If the flag 'all' is set to true, then it revokes all ControlTokens from that delegatee; 'amount' can be set to 0 or null
   -If the flag 'all' is set to false, then it revokes the 'amount'
   -If 'amount' is > the number of ControlTokens a Core Identity controller actually delegated, all tokens will be revoked
   ACTION REQUIRED: This function is not useful when called by owners, we should check if 'controllerHash' is actually an owner
   */
   function revokeDelegation(bytes32 controllerHash, bytes32 delegateeHash, uint amount, bool all)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {
       success = CT.revokeDelegation(controllerHash,delegateeHash,amount,all);
    }

   /*Spend a ControlToken as a delegatee-
   ACTION REQUIRED: It does not SEEM to make sense to spent more than one token at a time, or to have 'amount' > 1
   but currently this method will not stop the caller from spending all their tokens at once
   */
   function spendMyTokens(bytes32 delegateeHash, uint amount) onlyBy(msg.sender) atState(States.Active) returns (bool result) {
       result = CT.spendMyTokens(delegateeHash,amount);
    }

   /*Delegatee could call this function to check their delegated ControlToken amount-
   NOTE: Digital Twin will keep this data so generally we dont need to ask the contract for it
   This function is not currently called by any APIs
   */
   function myAmount(bytes32 delegateeHash) onlyBy(msg.sender) atState(States.Active) returns (uint amount) {
       amount = CT.myAmount(delegateeHash);
    }

   /*Delegate ControlToken(s), the quantitiy specified by 'amount'-
   ControlToken will verify that the caller is in fact an owner or controller, then add the delegations
   timeFrame=0 if the delegation does not expire; expiration is checked when delegatee tries to spend token(s)
   */
   function delegate(bytes32 controllerHash, bytes32 delegateeHash, uint amount, uint timeFrame)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {
       success = CT.delegate(controllerHash,delegateeHash,amount,timeFrame);
    }

   /*Give a controlToken from one individual to another-
   ACTION REQUIRED: function behavior will change if called by an owner. See comment above
   */
   
   function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {

       success = CT.changeTokenController(originalControllerHash,newControllerHash,amount);
       
       if (success) { //update controlStruct
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
       }
    }

   /*This function will allow an OWNER to update the ControlToken quantity of a controller-
   ACTION REQUIRED: Should check the controller's current Control Token value before calling CT?
   */
   function offsetControllerTokenQuantity(bytes32 owner, bytes32 controllerHash, int val)
   onlyBy(tx.origin) atState(States.Active) returns (bool success) {

       bool isOwner = OT.isOwner(owner);

       if (isOwner) {
           success = CT.offsetControllerTokenQuantity(controllerHash,val);
       }

       if (success) { //update controlStruct
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
       }
    }

   /*Tell a controller how many ControlTokens he or she possesses for a given CoreIdentity-
   NOTE: Digital Twin will keep this data so generally we dont need to ask the contract for it
   */
   function amountDelegated(bytes32 controllerHash) onlyBy(tx.origin) atState(States.Active) returns (uint val) {
       val = CT.amountDelegated(controllerHash);
   }

   /*Add a controller to the contract's storage-
   This function is only callable by owners and by the MyCOID Node app
   */
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
   
   /*Remove a controller from the contract's storage-
   This function is only callable by owners and by the MyCOID Node app
   */
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
   
   /*//////////////////////////////////////////////////////////
   START OWNERSHIPTOKEN FUNCTIONS
        Ownership defined as per TCS DI Protocol
        Owners can delegate their OwnershipTokens to delegatees
   *///////////////////////////////////////////////////////////
   
   /*Add an owner to this contract's storage (nonhuman CoreIdentity contracts only)-
   This function will not do anything when called on a 'human' CoreIdentity
   */
   function addOwner(bytes32 owner, bytes32 addr, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) 
   {

       bool isOwner = OT.isOwner(owner);

       if (isOwner && !isHuman) {
           success = OT.addOwner(addr, amount);
       }

       if (success) {
        //update ownershipStruct
        ownershipStruct.ownerIDList = OT.getOwnersList();
        ownershipStruct.ownershipStakes = OT.getOwnersVal();
       }
   }
   
   /*Remove an owner from this contract's storage-
   This function will not do anything when called on a 'human' CoreIdentity
   How can distinguish between original and added? We do not want the added owners removing OGs, do we?
   */
   function removeOwner(bytes32 owner, bytes32 addr) onlyBy(msg.sender) atState(States.Active) returns (bool success) {

       bool isOwner = OT.isOwner(owner);

       if (isOwner && !isHuman) {
           success = OT.removeOwner(addr);
       }

       if (success) {
        //update ownershipStruct
        ownershipStruct.ownerIDList = OT.getOwnersList();
        ownershipStruct.ownershipStakes = OT.getOwnersVal();
       }
   }

   /*Return OwnershipToken amount for an inputted owner-
   NOTE: Digital Twin will keep this data so generally we dont need to ask the contract for it
   */
   function myTokenAmount(bytes32 ownershipHash) onlyBy(tx.origin) atState(States.Active) returns (uint val) {
       val = OT.getOwnershipVal(ownershipHash);
   }

   /*Updating token quantities between two Core Identity owners-
   This function will return false if 'originalOwner' tries to give more tokens than he/she posseses
   */
   function giveTokens(bytes32 originalOwner, bytes32 newOwner, uint amount)
   onlyBy(msg.sender) atState(States.Active) returns (bool success, bool isOwner1, bool isOwner2) {

       success = false;

       uint index;

       isOwner1 = OT.isOwner(originalOwner);
       isOwner2 = OT.isOwner(newOwner);

       uint val1 = myTokenAmount(originalOwner);

       //'originalOwner' and 'newOwner' are both owners and originalOwner has enough tokens
       if (isOwner1 && isOwner2 && (amount <= val1)) {

           success = true;

           //ACTION REQUIRED: get val1 and val2 from the coid struct (find their indices)
           uint val2 = myTokenAmount(newOwner);
           val1 = val1 - amount;
           val2 = val2 + amount;

           //update the new OwnershipToken quantities for each owner
           isOwner1 = OT.updateOwnershipVal(originalOwner, val1);
           isOwner2 = OT.updateOwnershipVal(newOwner, val2);

           if (val1 == 0) {
               OT.removeOwner(originalOwner);
               ownershipStruct.ownerIDList = OT.getOwnersList();
               ownershipStruct.ownershipStakes = OT.getOwnersVal();
           }
       }
   }

   /*Add a recoverer to this contract's storage-
   This function is called by owners of a CoreIdentity from the MyCOID Node app
   An owner my remove a recoverer and OPTIONALLY change recoveryCondition (recoveryCondition=0 if not changed)
   ACTION REQUIRED: Reevaluate this when we come back to Airbitz; should we add an event?
   ACTION REQUIRED: validate that recovery condition > new length
   */
   function addRecovery(bytes32 owner, bytes32 theIdentityRecoveryList, uint theRecoveryCondition)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) 
   {

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

   /*Remove a recoverer from the contract's storage-
   This function is only callable by CoreIdentity owners
   This function is called by the MyCOID Node app
   An owner my remove a recoverer and OPTIONALLY change recoveryCondition by providing a second input
   ACTION REQUIRED: validate that recovery condition > new length
   */
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

           //we must also check that the recoveryCondition is lessthan or equal to number of recoverers
           if (theRecoveryCondition != 0x0) {
               identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;
               complete = true;
           }
           testIt = 6;
       }

   }

   /*Change the recoveryCondtion in the contract's storage-
   NOTE: The recoveryConditionc can also be changed inside 'removeRecovery'
   This function is not currently called by any APIs but should be called by the MyCOID Node app
   */
   function changeRecoveryCondition(bytes32 owner, uint theRecoveryCondition)
   onlyBy(msg.sender) atState(States.Active) returns (bool success) {

       uint count = 0;

       for (uint i = 0; i < identityRecoveryIdListStruct.identityRecoveryIdList.length; i++) {
           if (identityRecoveryIdListStruct.identityRecoveryIdList[i] == 0x0) {
               count++;
           }
       }

       if (theRecoveryCondition != 0x0 && count >= theRecoveryCondition) {
           identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;
           success = true;
       }
   }

   /*/////////////////////////////////////////////////////
    HELPER FUNCTIONS
   *//////////////////////////////////////////////////////

    /*Advance the state of the contract by setting the next value in the States enum-
    This function is called inside the 'transitionNext' modifier which is applied to the following functions:
    'setRecoveryState', 'setActiveState', StartCoid', 'StartCoidIca'
    */
    function nextState() internal {
        testIt = 58;
        state = States(uint(state) + 1);
    }

   /*Calculate the ownershipID for the CoreIdentity based on inputted owners and the uniqueID-
   This function is called once inside startCoid and will return "0x0" if called more than once
   */
   function calculateOwnershipID(bytes32[10] owners, bytes32 uniqueID) internal returns (bytes32 ownershipID) {

       ownershipID = 0x0;

       //if the ownershipID inside the struct has not already been set
       if(ownershipStruct.ownershipID == 0x0) {
           hashMe.length = 0;

           for (uint k = 0; k < owners.length;k++) {
               if (owners[k] != 0) {
                   hashMe.push(owners[k]);
               }
           }
           ownershipID = sha3(uniqueID,hashMe);
       }
   }

   /*Calculate the ownershipID for the CoreIdentity based on inputted controllers and the uniqueID-
   This function is called once inside startCoid and will return "0x0" if called more than once
   */
   function calculateControlID(bytes32[10] controllers, bytes32 uniqueID) internal returns (bytes32 controlID) {

       controlID = 0x0;

       //if the controlID inside the struct is not already been set
       if (controlStruct.controlID == 0x0) {
           hashMe.length = 0;

           for (uint k = 0; k < controllers.length;k++) {
               if (controllers[k] != 0) {
                   hashMe.push(controllers[k]);
               }
           }
           controlID = sha3(uniqueID,hashMe);
       }
   }

   function kill() onlyBy(msg.sender) atState(States.Recovery) {
       selfdestruct(this);
   }


}