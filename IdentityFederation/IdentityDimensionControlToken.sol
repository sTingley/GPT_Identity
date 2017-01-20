//The same strategy used in IdentityDimension is used here for arrays:
//When you delete something, don't restructure the size; set the value(s) null.
//When you add something, find the first null index.

//README: This contract is intended to be used as a token contract in IdentityDimensionControl, which manages IdentityDimension contracts
//for a CoreIdentity. (IdentityDimensionControl also manages access to IdentityDimension contracts)


contract IdentityControlToken
{
    struct delegation
    {
        bytes32 controller;
        bytes32 delegatee;
        uint amount;
        string dimension;
        uint expiration;
    }
    
    delegation[] delegations;
    
    //Given the controller at index i (controllers[i]), their amount of tokens to delegate is controllerAmounts[i]
    bytes32[20] controllers;
    uint[20] controllerAmounts;
    
    //CONSTRUCTOR:
    function IdentityControlToken(bytes32[20] controllers_initial, uint[20] controllerAmounts_initial)
    {
        controllers = controllers_initial;
        controllerAmounts = controllerAmounts_initial;
    }
    
    //Helper function. Tells if the controller exists. The index returned is their position in the array, and is relevant if exists = true.
    //INPUT: controllerHash.
    function controllerExists(bytes32 controllerHash) returns (bool exists, uint index)
    {
        exists = false;
        index = 0;
        
        for(uint i = 0; i < controllers.length; i++)
        {
            //checking exists == false below saves lookups because:
            //the way the compiler works is if the first condition in an "and" statement is false,
            //it won't check the second
            if(exists == false && controllers[i] == controllerHash)
            {
                exists = true;
                index = i;
            }
        }
    }
    
    //This function adds a delegation to our delegation arrays.
    function addDelegation(bytes32 controller, bytes32 delegatee, uint amount, string dimension, uint timeFrame) returns (bool success)
    {
        //only allow the delegation if the controller has tokens and exists:
        uint index = 0;
        (success,index) = this.controllerExists(controller);
        
        success = success && (controllerAmounts[index] >= amount);
        
        if(success)
        {
            delegation toAdd;
            
            uint expiration = now + timeFrame;
            
            //set params
            toAdd.controller = controller;
            toAdd.delegatee = delegatee;
            toAdd.amount = amount;
            toAdd.dimension = dimension;
            toAdd.expiration = expiration;
            
            //this check necessary to avoid out of bounds error in looping:
            if(delegations.length == 0)
            {
                //push to array:
                delegations.push(toAdd);
            }
            else
            {
                //find the first empty index in the array (if it exists)
                bool emptyIndex = false;
                uint Index = 0;
                
                for(uint i = 0; i < delegations.length; i++)
                {
                    //checking emptyIndex first saves unnecessary lookups if something is already found
                    if(emptyIndex && (delegations[i].amount == 0 || delegations[i].expiration >= now))
                    {
                        emptyIndex = true;
                        Index = i;
                    }
                }
                
                if(emptyIndex)
                {
                    delegations[i] = toAdd;
                }
                else
                {
                    delegations.push(toAdd);
                }
            }
        }
    }
    
    
    //This function revokes delegations from a controller to a delegatee.
    //If the flag all is set to true, then it revokes through all dimensions, all tokens from that controller to the delegatee
    //In that case, the caller of the function can set amount and dimension null.
    //If the flag all is set to false, then it revokes the amount in the specified dimension.
    //IMPORTANT: since presumably the tokens are given on some agreement/payment, perhaps this function should be implemented by a DAO court
    function revokeDelegation(bytes32 controller, bytes32 delegatee, uint amount, string dimension, bool all) returns (bool success)
    {
        success = false;
        
        if(all)//if the flag is true, just revoke everything from the controller
        {
            if(dimensions.length > 0)
            {
                for(uint i = 0; i < dimensions.length; i++)
                {
                    if(dimensions[i].controller == controller && dimensions[i].delegatee = delegatee)
                    {
                        clearDelegation(i); //this function returns the tokens to the controller
                    }
                }
            }
            
        }
        else
        {
            //logic below is similar to the function spendTokens
            
            //first make sure they have the amount FROM that controller:
            uint actualAmount = 0;
            
            if(delegations.length > 0)
            {
                for(uint z = 0; z < delegations.length; z++)
                {
                    if(delegations[z].delegatee == delegatee && delegations[z].controller == controller && delegations[z].dimension == dimension)
                    {
                        actualAmount = actualAmount + delegations[z].amount;
                    }
                }
            }
            
            //if they have less than the controller wants to remove, just remove how much they have
            if(actualAmount < amount)
            {
                amount = actualAmount;
            }
            
            if(amount > 0)
            {
                
                bool keepGoing = true;
                
                while(keepGoing)
                {
                    //first find index in delegations with closest expiration.
                    uint index = 0;
                    
                    //size of delegations must be greater than zero because actualAmount != 0
                    for(uint k = 0; k < delegations.length; k++)
                    {
                        if(delegations[k].controller == controller)
                        {
                            if(delegations[k].expiration <= delegations[index].expiration && delegations[index].dimension == identityDimension)
                            {
                                index = k;
                            }
                        }
                    }
                    
                    //now spend the amount
                    if(amount >= delegations[index].amount)
                    {
                        amount = amount - delegations[index].amount;
                        clearDelegation(index);//this function clears and returns coins back to controller
                    }
                    else 
                    {
                        //just subtract remaining amount from the current delegation amount
                        delegations[index].amount = delegations[index].amount - amount;
      
                        //return the spent coins to the controller
                        bytes32 controller = delegations[index].controller;
                        
                        bool exists;
                        uint theIndex
                        (exists,theIndex) = controllerExists(controller);
                        
                        //if they still exist, give them their tokens
                        //otherwise, the tokens are gone.
                        if(exists)
                        {
                            controllerAmounts[theIndex] = controllerAmounts[theIndex] + amount;
                        }
                        
                        //now set amount = 0 since we are done 
                        amount = 0;
                        
                    }
                    
                    if(amount = 0)
                    {
                        keepGoing = false;
                    }
                       
                }
                
            }
        }
        
        success = true;
    }
     
    
    //adds a controller with a specified amount
    //only callable if the controller is not already in the array
    //since controller/controllerAmounts are fixed size, there has to be space to add them
    function addController(bytes32 controller, uint amount) returns (bool success)
    {
        success = false;
        
        //find out if the controller is already a controllerq:
        bool exists;
        uint temp;
        (exists,temp) = controllerExists(controller);
        
        if(!exists)//only try to add them if they don't already exist
        {
        
            for(uint m = 0; m < controllers.length; m++)
            {
                //checking success == false avoids multiple adds
                if(success == false && controllers[m] == "")
                {
                    success = true;
                    
                    controllers[m] = controller;
                    controllerAmounts[m] = amount;
                }
    
            }

        }
    }
    
    
    //removes a controller
    //their tokens are given to the controller with the least amount of tokens, just like in COID
    //however, if they are the only controller, their tokens vanish
    function removeController(bytes32 controller) returns (bool success)
    {
        success = false;
        
        //find out if the controller exists:
        uint index;
        (success,index) = controllerExists(controller);
        
        if(success)//only remove them if they exist
        {
            
            
            //find out the controller with least tokens, if they exist.
            bool leastControllerExists = false;
            uint leastControllerIndex = 0;
            
            //here we are finding a controller with least tokens.
            //if a controller with least tokens does not exist,
            //then there is no other controller. in which case, the tokens vanish***TODO:CHANGETHIS?
            //if you are the last controller, you should only be able to remove yourself if there is
            //no other controller....
            for(uint k = 0; k < controllers.length; k++)
            {
                if(k != index)
                {
                    if(controllerAmounts[k] <= controllerAmounts[index])
                    {
                        leastControllerIndex = k;   
                        leastControllerExists = true;
                    }
                }
            }
            
            //now, give the least controller their tokens:
            if(leastControllerExists)
            {
                controllerAmounts[leastControllerIndex] = controllerAmounts[leastControllerIndex] + controllerAmounts[index];
            }
            
            controllers[index] = 0x0;
            controllerAmounts[index] = 0;
        
            

        }
    }
    
    
    //spends the tokens specified by amount, Bearing in mind
    //that we want to spend the ones closest to expiration firstr.
    function spendTokens(bytes32 delegatee, uint amount, string identityDimension) returns (bool success)
    {
        //this is the only place to clear expirations.
        //it is accurate for the expiration within abs[(block function was called) - (block after rest of code is executed in this function)]
        clearExpirations();
        
        success = false;
        
        //first make sure they have the relevant amount:
        uint actualAmount = delegateeAmount(delegatee,identityDimension);
        
        if(actualAmount >= amount && amount > 0)
        {
            success = true;
            
            bool keepGoing = true;
            
            while(keepGoing)
            {
                //first find index in delegations with closest expiration.
                uint index = 0;
                
                //size of delegations must be greater than zero because actualAmount != 0
                for(uint k = 0; k < delegations.length; k++)
                {
                    if(delegations[k].expiration <= delegations[index].expiration && delegations[index].dimension == identityDimension)
                    {
                        index = k;
                    }
                }
                
                //now spend the amount
                if(amount >= delegations[index].amount)
                {
                    amount = amount - delegations[index].amount;
                    clearDelegation(index);//this function clears and returns coins back to controller
                }
                else 
                {
                    //just subtract remaining amount from the current delegation amount
                    delegations[index].amount = delegations[index].amount - amount;
  
                    //return the spent coins to the controller
                    bytes32 controller = delegations[index].controller;
                    
                    bool exists;
                    uint theIndex
                    (exists,theIndex) = controllerExists(controller);
                    
                    //if they still exist, give them their tokens
                    //otherwise, the tokens are gone.
                    if(exists)
                    {
                        controllerAmounts[theIndex] = controllerAmounts[theIndex] + amount;
                    }
                    
                    //now set amount = 0 since we are done 
                    amount = 0;
                    
                }
                
                if(amount = 0)
                {
                    keepGoing = false;
                }
                   
            }
            
        }
    }
    
    
    //helper function: tells you how many tokens a delegatee has for a given identityDimension
    function delegateeAmount(bytes32 delegatee, string dimension) returns (uint amount)
    {
        
        amount = 0;
        
        //check size to avoid an out-of-bounds error
        if(delegations.length > 0)
        {
            for(uint i = 0; i < delegations.length; i++)
            {
                if(delegations[i].delegatee == delegatee && delegations[i].dimension == dimension)
                {
                    amount = amount + delegations[i].amount;
                }
            }
        }
    }
    
    //helper function: clears the delegation at the index in the array
    //also gives the tokens back to the controller if they are still a controller
    //if they are no longer a controller, the tokens are lost.
    function clearDelegation(uint index)
    {
        //grab the controller and their amount before you clear them:
        bytes32 controller = delegations[index].controller;
        uint amount = delegations[index].amount;
        
        delegations[index].controller = 0x0;
        delegations[index].delegatee = 0x0;
        delegations[index].amount = 0;
        delegations[index].dimension = "";
        delegations[index].expiration = 0;
        
        //return their tokens:
        bool exists;
        uint index;
        (exists,index) = controllerExists(controller);
        
        //give controller back their tokens
        if(exists)
        {
            controllerAmounts[index] = controllerAmounts[index] + amount;
        }
    }
    
    //helper function: clears expirations.
    function clearExpirations()
    {
        //first check to avoid an out-of-bounds error
        if(delegations.length > 0)
        {
            for(uint i = 0; i < delegations.length; i++)
            {
                if(now > delegations[i].expiration)
                {
                    //recall clearDelegation gives the tokens back to the controller, 
                    //so no need to do that here.
                    clearDelegation(i);
                }
            }
        }
    }

    
}
