import "ControlToken.sol";
import "OwnershipToken.sol";




contract CoreIdentity
{
	
    struct UniqueId
    {
        bytes32 uniqueID;
        bytes32[100] uniqueIDAttributes;
    }

    struct Ownership //no ownership token quantity, just stakes. All stakes add up to 1.
    {
        bytes32 ownershipID;
        bytes32 ownershipTokenID;
        address[100] ownerIDList;
        ufixed[100] ownershipStake;
    }

    struct Control
    {
        bytes32 controlID;
        bytes32 controlTokenID;
        bytes32[100][100] controlTokens;//2D array. first dimension controller. second dimension delegated.
        address[100] controlIDList;
        uint controlTokenQuantity;
    }

    struct IdentityRecoveryIdList
    {
        address[100] identityRecoveryIdList;
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


    bool[100] areOwners;
    uint[100] theControlTokenAmounts;

	
	
    //constructor
    function CoreIdentity(bytes32 theUniqueID, bytes32[100] uniqueIDAttributes, bytes32 theOwnershipTokenID,
                    address[100] theOwnerIDList, ufixed0x256[100] theOwnershipStake,
                    bytes32 theControlTokenID, bytes32[100] theControlTokens, address[100] theControlIDList,
                    uint theControlTokenQuantity, address[100] theIdentityRecoveryList, uint theRecoveryCondition,
                    bool isHumanValue)
   {

        //set uniqueID struct here
        coidData.uniqueIdStruct.uniqueID = theUniqueID;
        coidData.uniqueIdStruct.uniqueIDAttributes = uniqueIDAttributes;

        //set ownership struct here
        coidData.ownershipStruct.ownerIDList = theOwnerIDList;
        coidData.ownershipStruct.ownershipStake = theOwnershipStake;
		coidData.ownershipStruct.ownershipTokenID = theOwnershipTokenID;

        //set control struct here
        coidData.controlStruct.controlTokenID = theControlTokenID;
        coidData.controlStruct.controlTokens = theControlTokens;
        coidData.controlStruct.controlIDList = theControlIDList;
        coidData.controlStruct.controlTokenQuantity = theControlTokenQuantity;

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
            address ownerId = coidData.ownershipStruct.ownerIDList[i];
			bool flag = false;
            
			for(uint j = 0; j < coidData.controlStruct.controlIDList.length; j++)
            {
                address controlId = coidData.controlStruct.controlIDList[j];

                if(ownerId == controlId)
                {
					flag = true;
                }
            }

            if(flag == false)//this means an owner was not in the control list, so add them
            {
				ownersNotControllers.push(ownerId);
            }

        }


        //find first empty index of controllers
        uint index = this.firstEmptyIndex(coidData.controlStruct.controlIDList);

        //add ownersNotControllers to controller list, make sure you are adding them in empty spots of the array
        //note you can’t use push in a predefined array, you need to use for example array[3] = val
        for(uint k = 0; k < ownersNotControllers.length; k++)
        {
            uint controlIDListLength = coidData.controlStruct.controlIDList.length;
            coidData.controlStruct.controlIDList[index] = ownersNotControllers[k];

            //update index
            index = this.firstEmptyIndex(coidData.controlStruct.controlIDList);
		}
		
		//set the OwnershipID and ControlID
		coidData.ownershipStruct.ownershipID = this.calculateOwnershipID(coidData.ownershipStruct.ownerIDList,coidData.uniqueIdStruct.uniqueID);
		coidData.controlStruct.controlID = this.calculateControlID(coidData.controlStruct.controlIDList,coidData.uniqueIdStruct.uniqueID);		

        //instantiate ownership token:
        OT = new OwnershipToken(coidData.isHuman, coidData.ownershipStruct.ownershipID);
        
        // This is required to set ownership stake values for all owners
        OT.setOwnershipTokenVals(coidData.ownershipStruct.ownerIDList,coidData.ownershipStruct.ownershipStake);
		
		//Calculate Control Token Amount based on ownershipStakes 
		
		 
		uint[100] areOwners;
		uint[100] theControlTokenAmounts;
		
		for (uint n=0; n < coidData.controlStruct.controlIDList.length;n++){
		
			uint myStakeAmt = OT.getNormalizedOwnershipStake(coidData.controlStruct.controlIDList[i]);		
			
			areOwners[n] = 0;
			// If controller is owner , then true otherwise false 
			if(OT.isOwner(coidData.controlStruct.controlIDList[i]))
			{
				areOwners[n] = 2;
			}

			//calculate control token amount as per owner ship stake amount 
			theControlTokenAmounts[n] = myStakeAmt * theControlTokenQuantity; 
		}
		
		//instantiate Control tokens:	
		CT = new ControlToken(coidData.controlStruct.controlIDList, theControlTokenAmounts, areOwners);
        
   }

   
   //helper function
   //returns -1 if array is full
   function firstEmptyIndex(address[100] myArray) returns (uint index)
   {
            bool stop = false;
                index = -1;
                for(uint i = 0; i < myArray.length; i++)
                {
                        if(myArray[i] = 0 && stop == false)
                        {
                                stop = true;
                                index = i;
                        }

                }
   }

   
   function delegateMyOwnershipStake(address myAddress, address[] theirAddresses, ufixed[] theirStakes)
   {
				//first make sure the person calling this function is an owner.
				if(!OT.isOwner(myAddress))
				{
					throw;
				}
				
				//now make sure that the total stake to delegate is at least how much stake the owner has
				//ex if myAddress = A has stake 1/10 and she wants to delegate theirAddress = {B,C}, theirStakes = {1/5,1/5}
				//then we must stop because 1/5 + 1/5 = 4/10 > 1/10
				uint sum = 0;
				for(uint i = 0; i < theirAddresses.length; i++)
				{
					sum = sum + theirStakes[i];
				}
				uint myStakeAmt = OT.getNormalizedOwnershipStake(myAddress);
				if(myStakeAmt < sum)
				{
					throw;
				}
				
				//now do delegation logic:
                uint delegateeCount = theirAddresses.length; //this is the amount of people to delegate to
                address current;
                address[100] newOwnersList;
                newOwnersList = OT.getOwnersList; 
                        
			    for (uint m = 0; m < delegateeCount; m++)
			    {
					current = theirAddresses[m];
					
					//if they are not an owner, make them one
					if(OT.isOwner(current))
					{
						if(OT.addOwner(current, theirStakes[m])){//***add this logic in OwnerToken
    						//this.addOwner(current, theirStakes[m]);
    			
    			            // Update ownershipID with new list of Owners 
                            coidData.ownershipStruct.ownershipID = this.calculateOwnershipID(newOwnersList,coidData.uniqueIdStruct.uniqueID);
                            coidData.ownershipStruct.ownerIDList = newOwnersList; 			
                            
    						//now add them to controllers if they are not
    						if(CT.isController(current) == false)
    						{
    						this.addController(current);
                            }
						}
					}
					else
					{
						
					}
			    }
   }
   
     //As per new logic of Assigner 
     function addController(address addr){
         
        address assigner = msg.sender;
        uint isOwner = 0;
        bool response = false;
        
        //check is assigner is an owner 
        if(OT.isOwner(assigner)== false){
            throw; 
        }
            
        if(OT.isOwner(addr)== true){
            isOwner = 1; // assignee is owner 
        }    
        
        if(OT.isController(addr)== true){
            isOwner = 2; // assignee is controller
        }
        
           
        response=CT.addController(addr, assigner,isOwner);
        
        if(response == true){
        //Update controlID with new list of Controllers 
        address[100] newControllersList;
        newControllersList = CT.getControllersList; 
        coidData.controlStruct.controlID = this.calculateControlID(newControllersList,coidData.uniqueIdStruct.uniqueID);
        coidData.controlStruct.controlIDList = newControllersList; 
        }
    }


    
   function removeMyControl(address controllerAddress)
   {
           bool response = false;
           response=CT.removeController(controllerAddress);
           
           if(response == true)
		   {
               //Update controlID with new list of Controllers 
               address[100] newControllersList;
               newControllersList = CT.getControllersList; 
               coidData.controlStruct.controlID = this.calculateControlID(newControllersList,coidData.uniqueIdStruct.uniqueID);
               coidData.controlStruct.controlIDList = newControllersList; 
           }
        
   }

 
//   function removeController(address  controllerAddress) returns (bool flag)
   //{
       
     // flag = true;
       //   if(controllerAddress == msg.sender){
        //   CT.delegation del = CT.controlTokenDelegations[controllerAddress];
        //       if(del.length == 0) {
                //Then coins must be delegated to all controllers based on their ownership stake
        //        }
        //        else {
        //         for(uint i = 0; i < del.length; i++) {
        //               if(CT.isController(del.delegatees[i]) == true) {
        //                       CT.delegateMyControl(msg.sender, del.delegatees[i], del.delegateeTokens[i]); // give CT to the specified controller
        //              }
        //            else{
        //                   flag = false;
        //                   // either do nothing or return the CT to owner
        //                 CT.delegateMyControl(msg.sender, msg.sender, del.delegateeTokens[i]); // return CT to themselves
        //               }
        //        }
        //       }
        //      if(CT.getControlAmount(controllerAddress) == 0){
        //         CT.removeController(controllerAddress);
        //     }
        //}
        //else{
        //    throw;
       //}
   //}

    // Prafull's code
    function removeController(address owner, address controllerAddress) returns (bool response)
   {

     address controller = controllerAddress;
     response = false;
     
     if(OT.isOwner(owner)== true &&  OT.isOwner(controller) == false){

        uint controlToken;
        controlToken = CT.getControlAmount(controller);
        response = CT.removeController(controller);
        if(response == true){

            this.giveMyControlTokensTo(owner,controlToken);
            
            //Update controlID with new list of Controllers 
            address[100] newControllersList;
            newControllersList = CT.getControllersList; 
            coidData.controlStruct.controlID = this.calculateControlID(newControllersList,coidData.uniqueIdStruct.uniqueID);
            coidData.controlStruct.controlIDList = newControllersList; 
            response =true; 
        }
     
    }
        

   }

   function delegateMyControlTokens(address controller, address delegatee,uint theTokenID, uint toController) returns (bool response)
   {

		response = false;
	
		//owner delegate to controller 
		if((CT.isController(controller) && CT.isOwner(controller) == true) ){
			response=CT.delegateToController(controller,delegatee,theTokenID);	
		}
		// controller delegate to user 
	    else if(CT.isController(delegatee) == false && CT.isController(controller) == true){
			response=CT.DelegateToUserAsController(controller,delegatee,theTokenID);	
        }		
		// user delagate to other user 
		else{
			response=CT.DelegateToUserAsUser(controller,delegatee,theTokenID);	
		}
		    
   }


   function revokeUserDelegation(address myaddr, address theiraddr, uint tokenID, uint isUser) returns (bool result)
   {

		result = CT.revokeUserDelegation(myaddr, theiraddr, tokenID, isUser);

   }

   function giveMyControlToken(address giver, address newOwner, uint theTokenID) returns (bool response)
   {
       
	   response = CT.changeOwnerOfToken(theTokenID, giver, newOwner);
       
   }


   function addOwner(address addr,uint thestakeval)
   {
    
        bool response = false;
        
        
        //Add new owner into List
        response = OT.addOwner(addr,thestakeval);
        
        if(response == true){
            // Update ownershipID with new list of Owners 
            address[100] newOwnersList;
            newOwnersList = OT.getOwnersList; 
            coidData.ownershipStruct.ownershipID = this.calculateOwnershipID(newOwnersList,coidData.uniqueIdStruct.uniqueID);
            coidData.ownershipStruct.ownerIDList = newOwnersList; 
            // Add owner as controller
            // Cheeck if this new owner is controller
            //
            if(CT.isController(addr) == false){
    
                this.addController(addr);
            }
        }
   }
   
   function addOwnershipVal(address addr, ufixed0x256 val)
   {
       if(OT.isOwner(addr) && val > 0)
	   {
			//Owner exist into Owners list , just add value of token. 
        
			ufixed mystakeValue; 
			mystakeValue =  OT.getNormalizedOwnershipStake(addr);
			mystakeValue = mystakeValue + val;  
			OT.updateOwnershipVal(addr,mystakeValue);
        
        }
       
   }
   
   

    function removeOwner(address addr)
    {
        bool response = false;
        
        response = OT.removeOwner(addr);
        
        if(response == true)
		{
			// Update ownershipID with new list of Owners 
			address[100] newOwnersList;
			newOwnersList = OT.getOwnersList; 
			coidData.ownershipStruct.ownershipID = calculateOwnershipID(newOwnersList,coidData.uniqueIdStruct.uniqueID);
			coidData.ownershipStruct.ownerIDList = newOwnersList;

			// Update control token
			CT.updateControllerIsOwner(addr,0);
        }
    }

   function removeMyOwnership(address myAddress, address[100] owners,ufixed0x256[100] theirStakes) returns (bool done)
   {
       done = false;
	   
	   //find owners stake
	   uint myStakeAmt = OT.getNormalizedOwnershipStake;
	   
	   ufixed0x256 sum = 0;
	   for(uint i = 0; i < theirStakes.length; i++)
	   {
		   sum = sum + theirStakes[i];
	   }
	   
	   if(sum - myStakeAmt = 0)
	   {
		   done = true;
		   delegateMyOwnershipStake(myAddress, owners, theirStakes);
		   removeOwner(myAddress);
	   }
	   
	   
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
   

}
