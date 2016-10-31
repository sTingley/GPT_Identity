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
    //AF: These functions can only be called from the IDF gatekeeper contract ... will have to hardcode the address 
    //of the IDF gatekeeper contract in a modifier
    //AF: We should also set a LOCAL variable that is checked after these functions are called for the first time to avvoid accidental or malicious calling



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


   //END CONSTRUCTOR
   //START CONSTRUCTOR HELPER FUNCTION
   //AF: I presume that the commented out lines will be added in.
   function StartCoid()
   {
        bytes32[10] memory owners = ownershipStruct.ownerIDList;
        bytes32[10] memory controllers = controlStruct.controlIDList;
        myUtils = new Utils();
        (ownershipStruct.ownerIDList, controlStruct.controlIDList) = myUtils.AtoSubsetOfB(owners, controllers);


//        ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
//        controlStruct.controlTokenID = calculateControlID(controlStruct.controlIDList,uniqueIdStruct.uniqueID);
//      testIt = 15;
        //instantiate ownership token:
//        OT = new OwnershipToken(isHuman,ownershipStruct.ownershipID);

        // This is required to set ownership stake values for all owners
//        OT.setOwnershipTokenVals(ownershipStruct.ownerIDList,ownershipStruct.ownershipStakes);

         //instantiate Control tokens:
//        CT = new ControlToken(controlStruct.controlIDList,controlStruct.controlTokensOwned);

        testIt = 34;
   }

   //END CONSTRUCTOR HELPER FUNCTION












   //START CONTROL FUNCTIONS
   function revokeDelegation(bytes32 controllerHash, bytes32 delegateeHash, uint amount) returns (bool success)
   {
       success = CT.revokeDelegation(controllerHash,delegateeHash,amount);
   }
   function spendMyTokens(bytes32 delegateeHash, uint amount)
   {
       CT.spendMyTokens(delegateeHash,amount);
   }
   function myAmount(bytes32 delegateeHash) returns (uint amount)
   {
       amount = CT.myAmount(delegateeHash);
   }
   function delegate(bytes32 controllerHash, bytes32 delegateeHash, uint amount) returns (bool success)
   {
       success = CT.delegate(controllerHash,delegateeHash,amount);
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
   function amountDelegated(bytes32 controllerHash) returns (uint val)
   {
       val = amountDelegated(controllerHash);
   }
   function addController(bytes32 controllerHash) returns (bool success)
   {
       //TODO: make sure controllerHash is in ownersList
       for(uint i=0; i< ownershipStruct.ownerIDList[i].length; i++){
           if(ownershipStruct.ownerIDList[i] == controllerHash)
           {
               success = CT.addController(controllerHash);
           }
       }
       //success = CT.addController(controllerHash);
       if(success)
       {
        //TODO: update controller list in COID and amounts
        controlStruct.controlTokensOwned = CT.getControllerVal();
        controlStruct.controlIDList = CT.getControllersList();

        //TODO: recompute controlID
        controlStruct.controlTokenID = calculateControlID(controlStruct.controlIDList,uniqueIdStruct.uniqueID);
       }
   }
   function removeController(bytes32 controllerHash) returns (bool success)
   {
    //TODO: make sure controllerHash is in ownersList
        for(uint i=0; i< ownershipStruct.ownerIDList[i].length; i++){
            if(ownershipStruct.ownerIDList[i] == controllerHash){
                success = CT.removeController(controllerHash);
            }
        }
        //success = CT.removeController(controllerHash);
        if(success)
        {
    //TODO: update controller list in COID and controller amount
    controlStruct.controlTokensOwned = CT.getControllerVal();
    controlStruct.controlIDList = CT.getControllersList();

    //TODO: recompute controlID
            controlStruct.controlTokenID = calculateControlID(controlStruct.controlIDList,uniqueIdStruct.uniqueID);
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
        ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
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
            ownershipStruct.ownershipID = calculateOwnershipID(ownershipStruct.ownerIDList,uniqueIdStruct.uniqueID);
       }
   }
   function myTokenAmount(bytes32 ownershipHash) returns (uint val)
   {
       val = OT.getOwnershipVal(ownershipHash);
   }
   function giveTokens(bytes32 originalOwner, bytes32 newOwner, uint amount) returns (bool success)
   {
       bool isOwner1;
       bool isOwner2;

       isOwner1 = OT.isOwner(originalOwner);
       isOwner2 = OT.isOwner(newOwner);

       success = false;
       if(isOwner1 && isOwner2)
       {
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
            //make a clone of owners so we don't change it
              //  bytes32[100] ownersClone = owners;


                //although the array has 100 spots, some of them are empty. So we only include the spots before nonempty spots.
              //  uint emptyIndex = this.firstEmptyIndex(ownersClone);
              //  uint lastNonemptyIndex;

              //  if(emptyIndex == 0)
              //  {
            //            throw; //we have no owners if emptyIndex is zero
              //  }
              //  else
            //    {
             //           lastNonemptyIndex = emptyIndex - 1;
               // }

              //  bytes32[lastNonemptyIndex] hashMe;
                //create a newlist. this is the one we will hash           
                //sort the list in descending order
              //  bytes32 max = 0x0;
               // for(uint j = 0; j < emptyIndex; j++)
               // {
                        //find current max
                      //  for(uint i = 0; i < emptyIndex; i++)
                      //  {
                           //     if(ownersClone[i] >= max)
                         //       {
                       //                 max = ownersClone[i];
                     //           }
                   //     }

                        //set current value in list
                 //       hashMe[j] = max;

                        //reset max
               //         max = 0x0;
              //  }


                //now, set the ownershipID as the hash:
              //  ownershipID = sha3(uniqueID,hashMe);

   }

   function calculateControlID(bytes32[10] controllers, bytes32 uniqueID) returns (bytes32 controlID)
   {

                controlID = 0;
                //make a clone of owners so we don't change it
              //  address[100] controllersClone = controllers;
            /// This should be controllers instead of owners

                //although the array has 100 spots, some of them are empty. So we only include the spots before nonempty spots.
              //  uint emptyIndex = 1;
              //  emptyIndex = this.firstEmptyIndex(controllersClone);
               // uint lastNonemptyIndex;

              //  if(emptyIndex == 0)
              //  {
              //          throw; //we have no owners if emptyIndex is zero
              //  }
              //  else
              //  {
              //          lastNonemptyIndex = emptyIndex - 1;
               // }

               // address[lastNonemptyIndex] hashMe; //create a newlist. this is the one we will hash;

                //sort the list in descending order
               // address max = 0x0;
               // for(uint j = 0; j < emptyIndex; j++)
               // {
                        //find current max
                       // for(uint i = 0; i < emptyIndex; i++)
                       // {
                           //     if(controllersClone[i] >= max)
                         //       {
                       //                 max = controllersClone[i];
                     //           }
                   //     }

                        //set current value in list
                 //       hashMe[j] = max;

                        //reset max
                //        max = 0x0;
               // }


                //now, set the ownershipID as the hash:
               // controlID = sha3(uniqueID,hashMe);
   }
   //END HELPER FUNCTIONS




}