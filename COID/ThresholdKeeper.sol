import "CoreIdentity.sol";

contract ThresholdKeeper
{
    
    //TODO SUMMARY:
    //Add getControllers(),getOwners(),getIsHuman() from COID
    
   //NOTE: Every proposal to remove an owner/controller is uniquely determined by:
   //1. The Core Identity Address
   //2. The identity to be removed
   //3. How the identity is to be removed (as a controller or an owner)
   //Therefore, every proposal ID is defined as the hash of these three parameters
   //It has the added benefit of limiting the number of structs, rather than using a counter (because after expiry, the same proposal can be called again)
    
    
    struct removalProposal
    {
        //by default, the struct will initialize calledBefore to zero
        //so at expiry, we will have to make it zero again
        //when it is one, we know that someone has initialized the command to remove an owner/controller
        uint calledBefore;
        
        uint expiryTime;
        
        bytes32 toRemove;
        
        uint type; //0 means remove as controller; 1 means remove as owner
        
        bool isHuman;
        
        bytes32[10] verifiedSignatures; //public key hashes of people who have had their signatures verified
        
        address COIDAddr;
        
        uint sigIndexer;
    }
    
    //To notify all owners that a removal proposal has been called
    //toRemove is the hash of the owner/controller to be removed
    event notifyProposal(bytes32[10] currentOwners, bytes32 toRemove, bool isControlRemoval);
    
    mapping(bytes32 => removalProposal) removalProposals;
    
    //The time duration for proposals before expiry.
    uint duration = 1 days;
    
    
    // -> -> -> START HELPER FUNCTIONS -> -> ->
    // 
    //
    
    
    //Signature Verification Helper Function:
    function verify(string pubKey, string msgHash, string signature) returns (bool result)
    {
        result = true;
        
        //TODO: Compute R,S,V parameters from signature and call ecrecover
        
    }
    
    //Tells you if you can go ahead and remove the owner from COID
    //If you have a signature from the person to be removed, remove by default (no need to check other signatures)
    function isRemovalReady(bytes32 proposalID) returns (bool result)
    {
        bytes32 addr = removalProposals[proposalID].COIDAddr;
        bytes32[10] verifiedSigs = removalProposals[proposalID].verifiedSignatures;
        bytes32 removalIdentity = removalProposals[proposalID].toRemove;
        
        //TODO: GET CURRENT OWNERS/CONTROLLERS FROM COID
        //NOTE: One may wonder why we get them each time? It would be more efficient to save them at the
        //beginning of a proposal. While this true, it is possible that midway an owner is removed from the same
        //core identity...which would never reach then reach the condition to remove the identity in question.
        bytes32[10] currentCoidOwners;
        
        //Loop through currentCoidOwners and see if they are all verified
        result = true;
        bool keepGoing = true;//a variable to save unnecessary looping
        for(uint i = 0; i < currentCoidOwners.length; i++)
        {
            bytes32 current = currentCoidOwners[i];
            
            if(current == removalIdentity && keepGoing)
            {
                //check if they have verified the removal of themself:
                for(uint j = 0; j < verifiedSigs.length; j++)
                {
                    if(current == verifiedSigs[j])
                    {
                        keepGoing = false;
                    }
                }
            }
            else
            {
                if(current != 0x0 && keepGoing)//THE ARRAY MAY HAVE EMPTY VALUES FROM COID (FIXED SIZE ARRAY)
                {
                    
                    bool found = false;
                    
                    //loop to see if they have a verified signature
                    for(uint k = 0; k < verifiedSigs.length; k++)
                    {
                        if(current == verifiedSigs[k])
                        {
                            found = true;
                        }
                    }
                    
                    if(found == false)
                    {
                        keepGoing = false;
                        result = false;
                    }
                }
                
            }
        }
        
    }
    
    
    //Tells you if a public key hash is an owner of the Core Identity
    function isOwner(bytes32 pubKeyHash, address coidAddr) returns (bool result)
    {
        //TODO: add getOwners function to COID
        
        result = false;
        
        CoreIdentity theCoid = CoreIdentity(coidAddr);
        
        bytes32[10] owners = theCoid.getOwners();
        
        for(uint i = 0; i < owners.length;i++)
        {
            if(owners[i] == pubKeyHash)
            {
                result = true;
            }
        }
    }
    
    //Tells you if a public key hash is a controller of the Core Identity
    function isController(bytes32 pubKeyHash, address coidAddr) returns (bool result)
    {
        //TODO: add getControllers function to COID
        
        result = false;
        
        CoreIdentity theCoid = CoreIdentity(coidAddr);
        
        bytes32[10] controllers = theCoid.getControllers();
        
        for(uint i = 0; i < controllers.length; i++)
        {
            if(controllers[i] == pubKeyHash)
            {
                result = true;
            }
        }
    }
    
    function notify(address coidAddr, bytes32 toRemove, uint flag)
    {
        
        CoreIdentity theCoid = CoreIdentity(coidAddr);
        
        bytes32[10] currentOwners;
        
        bool isControlRemoval;
        
        if(flag == 0)
        {
            currentOwners = theCoid.getControllers();
            isControlRemoval = false;
        }
        else
        {
            currentOwners = theCoid.getOwners();
            isControlRemoval = true;
        }
        
        notifyProposal(currentOwners,toRemove,isControlRemoval);
    }
    
    
    //
    //
    // <- <- <- END HELPER FUNCTIONS <- <- <-
    
    // -> -> -> START USER FUNCTIONS -> -> ->
    //
    //
    
    //**QUESTION: Does this function need a Mutex?
    //TODO: Add getIsHuman() to COID
    function removeOwner(address coidAddr, string pub_Key, string msgHash, string sig, string to_Remove)
    {
        //calculate user hashes
        bytes32 caller = sha3(pub_key);
        bytes32 toRemove = sha3(to_Remove);
        
        //perform signature verification and make sure they are an owner of the COID:
        bool verificationResult = verify(pub_Key, msgHash, sig);
        bool isAnOwner = isOwner(caller,coidAddr);
        
        //make sure the person to remove is also an owner
        bool removalOwner = isOwner(toRemove,coidAddr);
        
        //calculate proposalID
        //1 denotes removal of an owner (recall 0 is for controller)
        bytes32 proposalID = sha3(coidAddr,toRemove,1)
        
        //GET FROM COID:
        bool isHuman;
        
        if(!isHuman && isAnOwner && removalOwner && verificationResult)
        {

            //see if this function has been called before on removing the owner in question:
            if(removalProposals[proposalID].calledBefore == 0)
            {
                //has not been called before; instantiate data:
                
                //GET FROM COID
                bool isHuman;
                
                removalProposals[proposalID].calledBefore = 1;
                removalProposals[proposalID].expiryTime = now + duration;
                removalProposals[proposalID].toRemove = toRemove;
                removalProposals[proposalID].type = 1;//1 means removal of an owner (not controller)
                removalProposals[proposalID].isHuman = isHuman;
                removalProposals[proposalID].coidAddr = coidAddr;
                removalProposals[proposalID].sigIndexer = 0;
                
                //notify others to sign
                notify(coidAddr,toRemove,1);
                
            }
            else
            {
                //check if expired. if so, reset signatures, and recalculate new expiry time:
                uint expiryTime = removalProposals[proposalID].expiryTime;
                
                if(now >= expiryTime)
                {
                    bytes32[10] newArray;
                    
                    removalProposals[proposalID].expiryTime = now + duration;
                    removalProposals[proposalID].verifiedSignatures = newArray;
                    
                    notify(coidAddr,toRemove,1);
                }
                
            }
            //TODO: ONLY DO THIS IF VERIFICATION WAS TRUE
            //add their signature:
            uint index = removalProposals[proposalID].sigIndexer;
            removalProposals[proposalID].verifiedSignatures[indexer] = caller;
            removalProposals[proposalID].sigIndexer += 1;
            
            //check if we are ready to remove the owner:
            bool ready = isRemovalReady(proposalID);
            
            if(ready)
            {
                //remove the owner from Core Identity:
                
                //reset called before (will in turn reset the proposal the n=-ext time this function
                //is called on removing the same owner):
                removalProposals[proposalID].calledBefore = 0;
            }
        }
    }
    
    
    //**QUESTION: Does this function need a Mutex?
    function removeController(address coidAddr, string pub_Key, string msgHash, string sig, string to_Remove)
    {
        //calculate user hashes
        bytes32 caller = sha3(pub_key);
        bytes32 toRemove = sha3(to_Remove);
        
        //perform signature verification and make sure they are an owner of the COID:
        bool verificationResult = verify(pub_Key, msgHash, sig);
        bool isAController = isController(caller,coidAddr);
        
        //make sure the person to remove is also an owner
        bool removalController = isController(toRemove,coidAddr);
        
        //calculate proposalID
        //0 denotes removal of a controller (recall 1 denotes removal of an owner)
        bytes32 proposalID = sha3(coidAddr,toRemove,0)
        
        //GET FROM COID:
        CoreIdentity myCoid = CoreIdentity(coidAddr);
        bool isHuman = myCoid.getIsHuman();
        
        if(!isHuman && isAController && removalController && verificationResult)
        {

            //see if this function has been called before on removing the owner in question:
            if(removalProposals[proposalID].calledBefore == 0)
            {
                //has not been called before; instantiate data:
                
                removalProposals[proposalID].calledBefore = 1;
                removalProposals[proposalID].expiryTime = now + duration;
                removalProposals[proposalID].toRemove = toRemove;
                removalProposals[proposalID].type = 0;//1 means removal of an owner (not controller)
                removalProposals[proposalID].isHuman = isHuman;
                removalProposals[proposalID].coidAddr = coidAddr;
                removalProposals[proposalID].sigIndexer = 0;
                
                notify(coidAddr,toRemove,0);
                
            }
            else
            {
                //check if expired. if so, reset signatures, and recalculate new expiry time:
                uint expiryTime = removalProposals[proposalID].expiryTime;
                
                if(now >= expiryTime)
                {
                    bytes32[10] newArray;
                    
                    removalProposals[proposalID].expiryTime = now + duration;
                    removalProposals[proposalID].verifiedSignatures = newArray;
                    
                    notify(coidAddr,toRemove,0);
                }
                
            }
            
            //add their signature:
            uint index = removalProposals[proposalID].sigIndexer;
            removalProposals[proposalID].verifiedSignatures[indexer] = caller;
            removalProposals[proposalID].sigIndexer += 1;
            
            //check if we are ready to remove the owner:
            bool ready = isRemovalReady(proposalID);
            
            if(ready)
            {
                //remove the owner from Core Identity:
                
                //reset called before (will in turn reset the proposal the next time this function
                //is called on removing the same owner):
                removalProposals[proposalID].calledBefore = 1;
            }
        }
    }
    
    //UPDATES??????????????????

    //FOR RECOVERY:    
    struct recoveryProposal
    {
        bytes32[10] sigs;
        
        uint mutex; //0 if inactive; 1 if active
        
        string newKey;
        string msgHash;
        string sig;
        
        uint expiration;
        
        uint counter;
    }
    
    //To notify (the Gatekeeper) to do recovery logic
    event notifyRecovery(bytes32[10] signers, address coidAddr, string newKey, uint condition);
    
    //Determined by the COID Address
    mapping(address => removalProposal) recoveryProposals;
    
    //The time duration for proposals before expiry.
    uint durationForRecovery = 1 days;
    
    //Event that it has been approved
    event approvedRecovery(address coidAddr, string pubKey);
    
    
    //NOTIFIES recoverers
    function notifyRecoverers(address myCoid)
    {
         //Get Recovery List from Coid
         CoreIdentity theCoid = CoreIdentity(coidAddr);
         bytes32[10] validators = theCoid.getIdentityRecoveryIdList;
         uint condition = theCoid.getIdentityRecoveryCondition;
         
         string newKey = recoveryProposals[myCoid].newKey;
         
         notifyRecovery(validators,myCoid,newKey,condition);
         
         
    }
    
    //FUNCTION TO RECOVER AN IDENTITY
    function initiateMyRecovery(address myCoid, string pubKey, string msgHash, string signature) returns(bool success)
    {
            
            success = true;
            
            //TODO: VERIFY
            bool verified = verify(pubKey,msgHash,signature);
            
            if(verified && isOwner(sha3(pubKey),myCoid))
            {
                if(recoveryProposals[myCoid].mutex == 0)
                {
                    //not called before, set params:
                    recoveryProposal[myCoid].mutex = 1;
                    recoveryProposal[myCoid].counter = 0;
                    recoveryProposal[myCoid].expiration = now + durationForRecovery;
                    recoveryProposal[myCoid].newKey = pubKey;
                    recoveryProposal[myCoid].msgHash = msgHash;
                    recoveryProposal[myCoid].sig = signature;
                    
                    noitfyRecoverers(myCoid);
                }
                else
                {
                    if(now > recoveryProposals[myCoid].expiration)
                    {
                        recoveryProposal[myCoid].counter = 0;
                        recoveryProposal[myCoid].expiration = now + durationForRecovery;
                        recoveryProposal[myCoid].newKey = pubKey;
                        recoveryProposal[myCoid].msgHash = msgHash;
                        recoveryProposal[myCoid].sig = signature;
                        
                        noitfyRecoverers(myCoid);
                    }
                    else
                    {
                        success = false;
                    }
                }
            }
    }
        
        
    }
    
    //FUNCTION TO SIGN ON A RECOVERY
    function recoverySigning(address myCoid, string pubKey, string msgHash, string signature) returns (bool success)
    {
        success = false;
        
        bool verified = verify(pubKey,msgHash,signature);
        
        //Get Recovery List from Coid
        CoreIdentity theCoid = CoreIdentity(coidAddr);
        bytes32[10] validators = theCoid.getIdentityRecoveryIdList;
        uint condition = theCoid.getIdentityRecoveryCondition;
            
        if(verified && now < recoveryProposals[myCoid].expiration)
        {
            //1. Make sure they are in the recovery list
            bytes32 caller = sha3(pubKey);
            bool found = false;
            for(uint i = 0; i < validators.length; i++)
            {
                if(validators[i] == caller)
                {
                    found = true;
                }
            }
            
            //2. Make sure they haven't already signed
            if(found)
            {
                bool signed = false;
                bytes32[10] theList = recoveryProposals[myCoid].sigs;
                
                if(recoveryProposal[myCoid].counter > 0)
                {
                    for(uint k = 0; k < recoveryProposals[myCoid].counter; k++)
                    {
                        if(caller == theList[k])
                        {
                            signed = true;
                        }
                    }
                }
                
                
                //Add their sig
                if(!signed)
                {
                    uint counter = recoveryProposals[myCoid].counter;
                    recoveryProposals[myCoid].sigs[counter] == caller;
                    
                    recoveryProposals[myCoid].counter = recoveryProposals[myCoid].counter + 1;
                    
                    if(counter + 1 >= condition)
                    {
                        approvedRecovery(myCoid,recoveryProposals[myCoid].newKey);
                    }
                }
            }
            
            
        }
        
    }
    
    
}
