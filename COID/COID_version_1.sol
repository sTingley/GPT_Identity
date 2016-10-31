import "OwnershipToken.sol";
import "ControlToken.sol";

contract CoreIdentity
{

    struct UniqueId
    {
        bytes32 uniqueID;
        bytes32[100] uniqueIDAttributes;
    }

    struct Ownership //we treat stakes as UINT
    {
        bytes32 ownershipID;
        bytes32[100] ownerIDList;
        uint[100] ownershipStakes;
    }

    struct Control
    {
        bytes32 controlTokenID;
        bytes32[100] controlIDList;
        uint[100] controlTokensOwned;
    }

    struct IdentityRecoveryIdList
    {
        bytes32[100] identityRecoveryIdList;
        uint recoveryCondition;
    }


    //overall struct
    struct CoidData
    {
        bool isHuman;
        UniqueId uniqueIdStruct;
        Ownership ownershipStruct;
        Control controlStruct;
        IdentityRecoveryIdList identityRecoveryIdListStruct;
    }


    //instantiate coid struct & tokens
    CoidData coidData;
    OwnershipToken OT;
    ControlToken CT;




    //START CONSTRUCTOR
    function CoreIdentity(bytes32 theUniqueID, bytes32[100] theUniqueIDAttributes,
                          bytes32 theOwnershipTokenID,bytes32[100] theOwnerIDList, uint[100] theOwnershipStakes,
                          bytes32 theControlTokenID, uint[100] theControlTokens, bytes32[100] theControlIDList,
                          bytes32[100] theIdentityRecoveryList, uint theRecoveryCondition,
                          bool isHumanValue)
    {

        //set uniqueID struct here
        coidData.uniqueIdStruct.uniqueID = theUniqueID;
        coidData.uniqueIdStruct.uniqueIDAttributes = theUniqueIDAttributes;

        //set ownership struct here
        coidData.ownershipStruct.ownershipID = theOwnershipTokenID;
        coidData.ownershipStruct.ownerIDList = theOwnerIDList;
        coidData.ownershipStruct.ownershipStakes = theOwnershipStakes;

        //set control struct here
        coidData.controlStruct.controlTokenID = theControlTokenID;
        coidData.controlStruct.controlIDList = theControlIDList;
        coidData.controlStruct.controlTokensOwned = theControlTokens;

        //set recovery struct here
        coidData.identityRecoveryIdListStruct.identityRecoveryIdList = theIdentityRecoveryList;
        coidData.identityRecoveryIdListStruct.recoveryCondition = theRecoveryCondition;

        //set person/nonperson here
        coidData.isHuman = isHumanValue;



        //loop through owners, and make sure that they are controllers.
        //if they are not, put them in ownersNotControllers:
        address[] ownersNotControllers;

        for(uint i = 0; i < coidData.ownershipStruct.ownerIDList.length; i++)
        {
            bytes32 ownerId = coidData.ownershipStruct.ownerIDList[i];
                        bool flag = false;

                        for(uint j = 0; j < coidData.controlStruct.controlIDList.length; j++)
            {
                bytes32 controlId = coidData.controlStruct.controlIDList[j];

                if(ownerId == controlId)
                {
                                        flag = true;
                }
            }

            if(flag == false)//this means an owner was not in the control list, so add them
            {
                                ownersNotControllers.push(ownerID);
            }

        }


        //find first empty index of controllers
        bool stop;
        uint index;

        (index, stop) = firstEmptyIndex(coidData.controlStruct.controlIDList);

        //add ownersNotControllers to controller list, make sure you are adding them in empty spots of the array
        //note you can’t use push in a predefined array, you need to use for example array[3] = val
        for(uint k = 0; k < ownersNotControllers.length; k++)
        {
            uint controlIDListLength = coidData.controlStruct.controlIDList.length;
            coidData.controlStruct.controlIDList[index] = ownersNotControllers[k];

            //update index
            (index,stop) = firstEmptyIndex(coidData.controlStruct.controlIDList);
                }

                //set the OwnershipID and ControlID
                coidData.ownershipStruct.ownershipID = calculateOwnershipID(coidData.ownershipStruct.ownerIDList,coidData.uniqueIdStruct.uniqueID);
                coidData.controlStruct.controlID = calculateControlID(coidData.controlStruct.controlIDList,coidData.uniqueIdStruct.uniqueID);

        //instantiate ownership token:
        OT = new OwnershipToken(isHuman, coidData.ownershipStruct.ownershipID);

        // This is required to set ownership stake values for all owners
        OT.setOwnershipTokenVals(coidData.ownershipStruct.ownerIDList,coidData.ownershipStruct.ownershipStake);

                //Calculate Control Token Amount based on ownershipStakes
                uint[100] areOwners;
                uint[100] theControlTokenAmounts;


                //instantiate Control tokens:
                CT = new ControlToken(coidData.controlStruct.controlIDList, theControlTokenAmounts, areOwners);

   }
   //END CONSTRUCTOR

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
       sucess = CT.delegate(controllerHash,delegateeHash,amount);
   }
   function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount) returns (bool success)
   {
       success = CT.changeTokenController(originalControllerHash,newControllerHash,amount);
       //TODO: update in struct control amounts
       if(success)
       {
           coidData.controlStruct.controlTokensOwned = CT.getControllerVal();
           coidData.controlStruct.controlIDList = CT.getControllersList();
       }

   }
   function amountDelegated(bytes32 controllerHash) returns (uint val)
   {
       val = amountDelegated(controllerHash);
   }
   function addController(bytes32 controllerHash) returns (bool success)
   {
       //TODO: make sure controllerHash is in ownersList
       for(uint i=0; i< coidData.ownershipStruct.ownerIDList[i].length; i++){
           if(coidData.ownershipStruct.ownerIDList[i] == controllerHash){
               success = CT.addController(controllerHash);
           }
       }
       //success = CT.addController(controllerHash);
       if(success)
       {
        //TODO: update controller list in COID and amounts
        coidData.controlStruct.controlTokensOwned = CT.getControllerVal();
        coidData.controlStruct.controlIDList = CT.getControllersList();

        //TODO: recompute controlID
        coidData.controlStruct.controlID = calculateControlID(coidData.controlStruct.controlIDList,coidData.uniqueIdStruct.uniqueID);
       }
   }
   function removeController(bytes32 controllerHash) returns (bool success)
   {
    //TODO: make sure controllerHash is in ownersList
        for(uint i=0; i< coidData.ownershipStruct.ownerIDList[i].length; i++){
            if(coidData.ownershipStruct.ownerIDList[i] == controllerHash){
                success = CT.removeController(controllerHash);
            }
        }
        //success = CT.removeController(controllerHash);
        if(success)
        {
    //TODO: update controller list in COID and controller amount
    coidData.controlStruct.controlTokensOwned = CT.getControllerVal();
    coidData.controlStruct.controlIDList = CT.getControllersList();

    //TODO: recompute controlID
            coidData.controlStruct.controlID = calculateControlID(coidData.controlStruct.controlIDList,coidData.uniqueIdStruct.uniqueID);
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
        coidData.ownershipStruct.ownerIDList = OT.getOwnersList();
        coidData.ownershipStruct.ownershipStakes = OT.getOwnersVal();

        //TODO: Recalculate OwnershipTokenID
        coidData.ownershipStruct.ownershipID = calculateOwnershipID(coidData.ownershipStruct.ownerIDList,coidData.uniqueIdStruct.uniqueID);
       }
   }
   function removeOwner(bytes32 addr) returns (bool success)
   {
       success = OT.removeOwner(addr);
       if(success)
       {
        //TODO: Update Owners List
        coidData.ownershipStruct.ownerIDList = OT.getOwnersList();
        coidData.ownershipStruct.ownershipStakes = OT.getOwnersVal();

       //TODO: Recalculate OwnershipTokenID
            coidData.ownershipStruct.ownershipID = calculateOwnershipID(coidData.ownershipStruct.ownerIDList,coidData.uniqueIdStruct.uniqueID);
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
            coidData.ownershipStruct.ownerIDList = OT.getOwnersList();
            coidData.ownershipStruct.ownershipStakes = OT.getOwnersVal();
            //TODO: recompute ownershipID
                coidData.ownershipStruct.ownershipID = calculateOwnershipID(coidData.ownershipStruct.ownerIDList,coidData.uniqueIdStruct.uniqueID);
           }
       }
   }
   //END OWNERSHIP FUNCTIONS

   //START HELPER FUNCTIONS
   function firstEmptyIndex(address[100] myArray) returns (uint index, bool hasEmpty)
   {
        bool stop = false;
        index = 0;
        for(uint i = 0; i < myArray.length; i++)
        {
            if(myArray[i] = 0 && stop == false)
            {
                stop = true;
                index = i;
            }

        }

        hasEmpty = stop;
   }
      function calculateOwnershipID(address[100] owners, address uniqueID) returns (bytes32 ownershipID)
   {
            //make a clone of owners so we don't change it
                address[100] ownersClone = owners;


                //although the array has 100 spots, some of them are empty. So we only include the spots before nonempty spots.
                uint emptyIndex = 1;
                emptyIndex = this.firstEmptyIndex(ownersClone);
                uint lastNonemptyIndex = 0;

                if(emptyIndex == 0)
                {
                        throw; //we have no owners if emptyIndex is zero
                }
                else
                {
                        lastNonemptyIndex = emptyIndex - 1;
                }

                address[lastNonemptyIndex] hashMe; //create a newlist. this is the one we will hash;

                //sort the list in descending order
                address max = 0x0;
                for(uint j = 0; j < emptyIndex; j++)
                {
                        //find current max
                        for(uint i = 0; i < emptyIndex; i++)
                        {
                                if(ownersClone[i] >= max)
                                {
                                        max = ownersClone[i];
                                }
                        }

                        //set current value in list
                        hashMe[j] = max;

                        //reset max
                        max = 0x0;
                }


                //now, set the ownershipID as the hash:
                ownershipID = sha3(uniqueID,hashMe);

   }

   function calculateControlID(address[100] controllers, address uniqueID) returns (bytes32 controlID)
   {
                //make a clone of owners so we don't change it
                address[100] controllersClone = owners;
            /// This should be controllers instead of owners

                //although the array has 100 spots, some of them are empty. So we only include the spots before nonempty spots.
                uint emptyIndex = 1;
                emptyIndex = this.firstEmptyIndex(controllersClone);
                uint lastNonemptyIndex;

                if(emptyIndex == 0)
                {
                        throw; //we have no owners if emptyIndex is zero
                }
                else
                {
                        lastNonemptyIndex = emptyIndex - 1;
                }

                address[lastNonemptyIndex] hashMe; //create a newlist. this is the one we will hash;

                //sort the list in descending order
                address max = 0x0;
                for(uint j = 0; j < emptyIndex; j++)
                {
                        //find current max
                        for(uint i = 0; i < emptyIndex; i++)
                        {
                                if(controllersClone[i] >= max)
                                {
                                        max = controllersClone[i];
                                }
                        }

                        //set current value in list
                        hashMe[j] = max;

                        //reset max
                        max = 0x0;
                }


                //now, set the ownershipID as the hash:
                controlID = sha3(uniqueID,hashMe);
   }
   //END HELPER FUNCTIONS




}
