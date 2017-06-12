import "OwnershipToken.sol";
import "ControlToken.sol";
import "Utils.sol";
contract CoreIdentity
{

    //IMPORTANT:
    //The following must be done to create a core identity.
    //These functions are intended to be called ONLY for instantiation. They all cannot be in a constructor because
    //that makes the stack too deep.
    //(1) Call setUniqueID
    //(2) Call setOwnership
    //(3) Call setControl
    //(4) Call setRecovery
    //(5) Call StartCoid. IMPORTANT: Only call this after (1-4) have been called!


    struct UniqueId
    {
        bytes32 uniqueID;
        bytes32[10] uniqueIDAttributes;
    }

    struct Ownership //we treat stakes as UINT
    {
        bytes32 ownershipID;
        bytes32[10] ownerIDList;
        uint[10] ownershipStakes;
    }

    struct Control
    {
        bytes32 controlTokenID;
        bytes32[10] controlIDList;
        uint[10] controlTokensOwned;
    }

    struct IdentityRecoveryIdList
    {
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
    Utils myUtils;
    bytes32[] hashMe;//helper

    //instantiate coid struct & tokens
    OwnershipToken OT;
    ControlToken CT;

    //for debugging
    uint testIt = 0;
    //debugging tool to see if the stack is too deep
    function getIt() returns (uint val)
    {
        val = testIt;
    }



    //intended to be called only for instantiation
    function setUniqueID(bytes32 theUniqueID, bytes32[10] theUniqueIDAttributes, bool isHumanValue)
    {
       //set uniqueID struct here
       uniqueIdStruct.uniqueID = theUniqueID;
       uniqueIdStruct.uniqueIDAttributes = theUniqueIDAttributes;
       isHuman = isHumanValue;

       testIt = 1;
    }

    function getUniqueID() returns (bytes32 theUniqueID, bytes32[10] theUniqueIDAttributes, bool isHumanValue)
    {
       //set uniqueID struct here
       theUniqueID = uniqueIdStruct.uniqueID;
       theUniqueIDAttributes = uniqueIdStruct.uniqueIDAttributes;
       isHumanValue = isHuman;
    }

    function setOwnership(bytes32[10] theOwnerIDList, uint[10] theOwnershipStakes)
    {
        //set ownership struct here
        ownershipStruct.ownerIDList = theOwnerIDList;
        ownershipStruct.ownershipStakes = theOwnershipStakes;

        testIt = 2;
    }
    function setControl(uint[10] theControlTokens, bytes32[10] theControlIDList)
    {
        //set control struct here
        controlStruct.controlIDList = theControlIDList;
        controlStruct.controlTokensOwned = theControlTokens;

        testIt = 3;
    }
    function setRecovery(bytes32[10] theIdentityRecoveryList, uint theRecoveryCondition)
    {
        //set recovery struct here
        identityRecoveryIdListStruct.identityRecoveryIdList = theIdentityRecoveryList;
        identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;

        testIt = 4;
    }

    function addRecovery(bytes32 theIdentityRecoveryList, uint theRecoveryCondition) returns (bool complete)
    {
        complete = false;
        if(identityRecoveryIdListStruct.identityRecoveryIdList[9] == 0x0 || identityRecoveryIdListStruct.identityRecoveryIdList[9] == 0){
            //set recovery struct here
            for(var i=0;i<10;i++){
            if(theIdentityRecoveryList != 0x0 && theIdentityRecoveryList != 0 && identityRecoveryIdListStruct.identityRecoveryIdList[i] == 0x0){
                identityRecoveryIdListStruct.identityRecoveryIdList[i] = theIdentityRecoveryList;
                complete = true;
            }
            }
        }
        if(theRecoveryCondition != 0x0){
            identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;
            complete = true;
        }
        testIt = 5;
    }

    function removeRecovery(bytes32 theIdentityRecoveryList, uint theRecoveryCondition) returns (bool complete)
    {
        //set recovery struct here
        complete = false;
        bool finding = true;
        uint j=10;
        for(uint i=0;i<10;i++){
            if(identityRecoveryIdListStruct.identityRecoveryIdList[i] == theIdentityRecoveryList){
                delete identityRecoveryIdListStruct.identityRecoveryIdList[i];
                while(finding){
                    if(j<=0){finding=false;}
                    if(identityRecoveryIdListStruct.identityRecoveryIdList[j]!= 0x0 && identityRecoveryIdListStruct.identityRecoveryIdList[j] != 0){
                        finding=false;
                        complete = true;
                        identityRecoveryIdListStruct.identityRecoveryIdList[i] = identityRecoveryIdListStruct.identityRecoveryIdList[j];
                    }
                    j--;
                }
            }
        }
        if(theRecoveryCondition != 0x0){
            identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;
            complete = true;
        }
        testIt = 6;
    }



   //END CONSTRUCTOR
   //START CONSTRUCTOR HELPER FUNCTION
   function StartCoid()
   {
        bytes32[10] memory owners = ownershipStruct.ownerIDList;
        bytes32[10] memory controllers = controlStruct.controlIDList;
        myUtils = new Utils();
        (ownershipStruct.ownerIDList, controlStruct.controlIDList) = myUtils.AtoSubsetOfB(owners, controllers);

        //TODO: REMOVE AND UNCOMMENT BELOW
        ownershipStruct.ownershipID = 0x0;
        controlStruct.controlTokenID = 0x0;

       // ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
      //  controlStruct.controlTokenID = calculateControlID(controlStruct.controlIDList,uniqueIdStruct.uniqueID);
        testIt = 15;
        //instantiate ownership token:
        OT = new OwnershipToken(isHuman,ownershipStruct.ownershipID);

        // This is required to set ownership stake values for all owners
        OT.setOwnershipTokenVals(ownershipStruct.ownerIDList,ownershipStruct.ownershipStakes);

         //instantiate Control tokens:
        CT = new ControlToken(owners,controllers,controlStruct.controlTokensOwned);

        testIt = 34;
   }

   //END CONSTRUCTOR HELPER FUNCTION


   function isOwner(bytes32 ownerHash) returns (bool result)
   {
        result = false;
        for(uint i = 0; i < ownershipStruct.ownerIDList.length; i++)
        {
                if(ownershipStruct.ownerIDList[i] == ownerHash)
                {
                        result = true;
                }
        }
   }
   function isController(bytes32 controllerHash) returns (bool result)
   {
        result = false;
        for(uint i = 0; i < controlStruct.controlIDList.length; i++)
        {
                if(controlStruct.controlIDList[i] == controllerHash)
                {
                        result = true;
                }
        }
   }
   function getOwners() returns (bytes32[10] result)
   {
        result = ownershipStruct.ownerIDList;
   }
   function getControllers() returns (bytes32[10] result)
   {
        result = controlStruct.controlIDList;
   }

   //for debugging
   function findIndex(bytes32 hashC) returns (uint indexC,bool  wasFoundC)
   {
        (indexC,wasFoundC) = CT.findIndexOfController(hashC);
   }


   //get controller values
   function getList() returns (uint[10] vals)
   {
        vals = CT.getControllerVal();
   }


   //START CONTROL FUNCTIONS
   function revokeDelegation(bytes32 controllerHash, bytes32 delegateeHash, uint amount, bool all) returns (bool success)
   {
       success = CT.revokeDelegation(controllerHash,delegateeHash,amount,all);
   }
   function spendMyTokens(bytes32 delegateeHash, uint amount) returns (bool result)
   {
       result = CT.spendMyTokens(delegateeHash,amount);
   }
   function myAmount(bytes32 delegateeHash) returns (uint amount)
   {
       amount = CT.myAmount(delegateeHash);
   }
   function delegate(bytes32 controllerHash, bytes32 delegateeHash, uint amount,uint timeFrame) returns (bool success)
   {
       success = CT.delegate(controllerHash,delegateeHash,amount,timeFrame);
   }
   function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount) returns (bool success)
   {
       success = CT.changeTokenController(originalControllerHash,newControllerHash,amount);
       //TODO: update in struct control amounts
       if(success)
       {
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
       }

   }
   function offsetControllerTokenQuantity(bytes32 controllerHash, int val) returns (bool success){

        success = CT.offsetControllerTokenQuantity(controllerHash,val);
        if(success)
        {
           controlStruct.controlTokensOwned = CT.getControllerVal();
           controlStruct.controlIDList = CT.getControllersList();
        }
   }
   function amountDelegated(bytes32 controllerHash) returns (uint val)
   {
       val = CT.amountDelegated(controllerHash);
   }
   function addController(bytes32 controllerHash,uint amount) returns (bool success,bytes32[10] listo)
   {

        success = false;
       //TODO: make sure the person ADDING controllerHash is in ownersList!!
        //The oraclizer will have to verify this
//       for(uint i=0; i< ownershipStruct.ownerIDList.length; i++){
//           if(ownershipStruct.ownerIDList[i] == controllerHash)
//           {
//               success = CT.addController(controllerHash);
//          }
//       }
       success = CT.addController(controllerHash,amount);
       if(success)
       {
        //TODO: update controller list in COID and amounts
        controlStruct.controlTokensOwned = CT.getControllerVal();
        controlStruct.controlIDList = CT.getControllersList();
        listo = CT.getControllersList();
        //TODO: recompute controlID
        //controlStruct.controlTokenID = calculateControlID(controlStruct.controlIDList,uniqueIdStruct.uniqueID);
       }
   }
   function removeController(bytes32 controllerHash) returns (bool success, uint minInd)
   {
    //TODO: make sure the person removing controllerHash is in the ownerslist via the oraclizer
    //TODO: make sure controllerHash is in ownersList
    //    for(uint i=0; i< ownershipStruct.ownerIDList[i].length; i++){
    //        if(ownershipStruct.ownerIDList[i] == controllerHash){
    //            success = CT.removeController(controllerHash);
    //        }
    //    }
        (success,minInd) = CT.removeController(controllerHash);
        if(success)
        {
    //TODO: update controller list in COID and controller amount
    controlStruct.controlTokensOwned = CT.getControllerVal();
    controlStruct.controlIDList = CT.getControllersList();

    //TODO: recompute controlID
  //          controlStruct.controlTokenID = calculateControlID(controlStruct.controlIDList,uniqueIdStruct.uniqueID);
        }
   }
   //END CONTROL FUNCTIONS

   //START OWNERSHIP FUNCTIONS
   function addOwner(bytes32 addr, uint amount) returns (bool success)
   {
       success = OT.addOwner(addr, amount);
       if(success)
       {
        //TODO: Update Owners List and owners amount
        ownershipStruct.ownerIDList = OT.getOwnersList();
        ownershipStruct.ownershipStakes = OT.getOwnersVal();

        //TODO: Recalculate OwnershipTokenID
        //ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
       }
   }
   function removeOwner(bytes32 addr) returns (bool success)
   {
       success = OT.removeOwner(addr);
       if(success)
       {
        //TODO: Update Owners List
        ownershipStruct.ownerIDList = OT.getOwnersList();
        ownershipStruct.ownershipStakes = OT.getOwnersVal();

       //TODO: Recalculate OwnershipTokenID
            //ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
       }
   }
   function myTokenAmount(bytes32 ownershipHash) returns (uint val)
   {
       val = OT.getOwnershipVal(ownershipHash);
   }
   function giveTokens(bytes32 originalOwner, bytes32 newOwner, uint amount) returns (bool success,bool isOwner1,bool isOwner2)
   {
       //bool isOwner1;
       //bool isOwner2;

       isOwner1 = OT.isOwner(originalOwner);
       isOwner2 = OT.isOwner(newOwner);

       success = false;
       if(isOwner1 && isOwner2)
       {

           success = true;
        //TODO: get val1 and val2 from the coid struct (find their indices)
           uint val1 = myTokenAmount(originalOwner);
           uint val2 = myTokenAmount(newOwner);

           val1 = val1 - amount;
           val2 = val2 + amount;

           isOwner1 = OT.updateOwnershipVal(originalOwner, val1);
           isOwner2 = OT.updateOwnershipVal(newOwner, val2);

           if(val1 == 0)
           {
               OT.removeOwner(originalOwner);
            ownershipStruct.ownerIDList = OT.getOwnersList();
            ownershipStruct.ownershipStakes = OT.getOwnersVal();
            //TODO: recompute ownershipID
                ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
           }
       }
   }
   //END OWNERSHIP FUNCTIONS

   //START HELPER FUNCTIONS
   function publicTest() returns (uint index, bool hasEmpty)
   {
        (index,hasEmpty) = firstEmptyIndex(controlStruct.controlIDList);
   }
   function firstEmptyIndex(bytes32[10] myArray) returns (uint index, bool hasEmpty)
   {
        bool stop = false;
        index = 0;
        for(uint i = 0; i < myArray.length; i++)
        {
            if(myArray[i] == 0 && stop == false)
            {
                stop = true;
                index = i;
            }

        }

        hasEmpty = stop;
   }



      function calculateOwnershipID(bytes32[10] owners, bytes32 uniqueID) returns (bytes32 ownershipID)
   {

            ownershipID = 0;

            hashMe.length = 0;
            for(uint k = 0; k < owners.length;k++)
            {
                if(owners[k] != 0)
                {
                   hashMe.push(owners[k]);
                }
            }

            bytes32 myVal;
            uint j = 0;

            if(hashMe.length > 1)
            {
                for(uint i = 1; i < hashMe.length; i++)
                {
                        myVal = hashMe[i];

                        j = i -1;
                        while(j >= 0 && hashMe[j] > myVal)
                        {
                                hashMe[j+1] = hashMe[j];
                                j = j -1;
                        }

                        hashMe[j+1] = myVal;
                }
            }

            ownershipID = sha3(uniqueID,hashMe);
   }

   function calculateControlID(bytes32[10] controllers, bytes32 uniqueID) returns (bytes32 controlID)
   {

            controlID = 0;

            hashMe.length = 0;
            for(uint k = 0; k < controllers.length;k++)
            {
                if(controllers[k] != 0)
                {
                   hashMe.push(controllers[k]);
                }
            }

            bytes32 myVal;
            uint j = 0;

            if(hashMe.length > 1)
            {
                for(uint i = 1; i < hashMe.length; i++)
                {
                        myVal = hashMe[i];

                        j = i -1;
                        while(j >= 0 && hashMe[j] > myVal)
                        {
                                hashMe[j+1] = hashMe[j];
                                j = j -1;
                        }

                        hashMe[j+1] = myVal;
                }
            }

            controlID = sha3(uniqueID,hashMe);


   }
   //END HELPER FUNCTIONS




}

