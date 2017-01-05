//See the Digital Identity Specification for more on terminology
//Descriptor is something that describes a dimension category. Ex "MyAddr"
//Attribute is the reference. For exmaple, a bigchainDB transaction ID or an IPFS hash.


//READ ME: A new strategy for managing arrays is used in this contract.
//When you delete something, don't restructure the size; set the value(s) null.
//When you add something, find the first null index.
//This strategy saves lookups, and ultimately, should be used for future arrays.
//NOTE: IdentityDimensionControl manages tokens and function call permissions of this contract.

contract IdentityDimension
{
    
    address chairperson;
    
    bytes32 ID; //This is the Identity Dimension ID 
    string dimensionType; //The use case of the identity dimension. For example, "Financial History".
    
    //Having a private and public struct makes lookups easier:
    
    //Attribute that is public
    struct PublicAttribute
    {
        string attribute;
        string descriptor;
    }
    
    //Attribute that is private
    struct PrivateAttribute
    {
        string attribute;
        string descriptor;
    }
    
    
    //Arrays are preferred over mappings, since the use of a mapping
    //invokes the need for an array in order to do searches.
    PublicAttribute[] PublicAttributes;
    PrivateAttribute[] PrivateAttributes;
    
    uint PublicIndexer; //tells you the current index of the array PublicAttributes
    uint PrivateIndexer; //tells you the current index of the array PrivateAttributes
    
    uint nonce;//for random number generation
    
    
    //constructor — input information at instantiation
    //INPUT: uniqueID (unhashed)
    //       dimensionType (ex. "My Music Playlist")
    //       flag (for making the first attribute, the Owner. flag = (0,1) = (public,private))
    function IdentityDimension(bytes32 uniqueID, string theDimensionType, uint flag)
    {
        //make the chairperson the deployer of this contract, by this line in the constructor:
        chairperson = msg.sender;
        
        //instantiate vars:
        nonce = 0;
        PublicIndexer = 0;
        PrivateIndexer = 0;
    
        //To Consider -- get rid of the random number?
        ID = sha3(uniqueID,attributeInput,getRand(1,1000));
        dimensionType = theDimensionType;
        
        //create the first Attribute/descriptor pair — it is always “Owner":
        this.addEntry("owner",sha3(uniqueID));
    }
    
    
    
    //creates an attribute/descriptor and puts it in the appropriate array,
    //determined by the flag (flag = 0 => public; flag = 1 => private)
    function addEntry(string descriptor, string attribute, uint flag) returns (bool success)
    {
        success = false;
        
        uint indexer = 0;
        
        //make sure an entry with the descriptor doesn't already exist
        uint temp = 0;
        bool existsPub;
        bool existsPriv;
        
        (existsPub,temp) = this.existsInPublicRecord(descriptor);
        (existsPriv,temp) = this.existsInPrivateRecord(descriptor);
            
        if(flag == 0 && existsPub == false)
        {
                indexer = PublicIndexer;
                
                PublicAttribute tempPub;
                
                tempPub.attribute = attribute;
                tempPub.descriptor = descriptor;
                
                if(indexer == 0)//because looping will give an out of bounds error if indexer = 0
                {
                    PublicAttributes.push(tempPub);
                    PublicIndexer++;
                }
                else
                {
                    bool foundPub = false;
                    
                    //see if there are empty entries, in which case you don't have to push (see *)
                    for(uint i = 0; i < indexer; i++)
                    {
                        if(PublicAttributes[i].descriptor = "" && foundPub == false)
                        {
                            foundPub = true;
                            
                            PublicAttributes[i] = tempPub;
                        }
                    }
                    
                    if(foundPub == false)
                    {
                        PublicAttributes.push(tempPub);
                        PublicIndexer++;
                    }
                }
                
        }
        else //flag = 1, add as private
        {
            if(existsPriv == false)
            {
                indexer = PrivateIndexer;
                
                PrivateAttribute tempPriv;
                
                tempPriv.attribute = attribute;
                tempPriv.descriptor = descriptor;
                
                if(indexer == 0)//because looping will give an out of bounds error if indexer = 0
                {
                    PrivateAttributes.push(tempPriv);
                    PrivateIndexer++;
                }
                else
                {
                    bool foundPriv = false;
                    
                    //see if there are empty entries, in which case you don't have to push (see *)
                    for(uint i = 0; i < indexer; i++)
                    {
                        if(PrivateAttributes[i].descriptor = "" && foundPriv == false)
                        {
                            foundPriv = true;
                            
                            PrivateAttributes[i] = tempPriv;
                        }
                    }
                    
                    if(foundPriv == false)
                    {
                        PrivateAttributes.push(tempPriv);
                        PrivateIndexer++;
                    }
                }
            }
        }
            
    }
    
    //removes an entry
    function removeEntry(string descriptor) returns (bool success)
    {
        success = false;
        
        uint index = 0;
        bool exists = false;
        
        (exists,index) = this.existsInPublicRecord(descriptor);
        
        if(exists)
        {
            PublicAttributes[index].descriptor = "";   
            success = true;
        }
        else
        {
            (exists,index) = this.existsInPrivateRecord(descriptor);
            
            if(exists)
            {
                PrivateAttributes[index].descriptor = "";
                success = true;
            }
        }
        
    }
    
    //Gives you an attribute for a given descriptor.
    //return SpendToken = 1, if it is private
    //return SpendToken = 0, if it is public
    //return success = false if not found
    //value is the attribute for the descriptor
    function readEntry(string descriptor) returns (string value, bool success, uint spendToken)
    {
        success = true;
        spendToken = 0;
        
        //find the index of the entry:
        bool existsPub;
        bool existsPriv;
        uint pubIndex;
        uint privIndex;
        
        (existsPub,pubIndex) = this.existsInPublicRecord(descriptor);
        (existsPriv,privIndex) = this.existsInPrivateRecord(descriptor);
        
        if(existsPub == false && existsPriv == false)
        {
            //doesn't exist, change success to false
            success = false;
        }
        else
        {
            if(existsPub)
            {
                value = PublicAttributes[index].attribute;
            }
            else
            {
                //private, so change spendToken
                spendToken = 1;
                
                value = PrivateAttributes[index].attribute;
            }
        }
    }
    
    //This function is to update entries.
    //IMPORTANT:
    //In calling this function, if someone doesn't want to change the flag,
    //put flag = 2.
    //In calling this function, if someone doesn't want to change the attribute, 
    //you can put the attribute as an empty string.
    //You CANNOT change the descriptor. If you wish to do that,
    //you must call the function changeDescriptor (or deleteEntry then addEntry)
    function update(string descriptor, string attribute, uint flag) returns (bool success)
    {
        success = false;
        
        bool existsPub;
        bool existsPriv;
        uint pubIndex;
        uint privIndex;
        
        (existsPub,pubIndex) = this.existsInPublicRecord(descriptor);
        (existsPriv,privIndex) = this.existsInPrivateRecord(descriptor);
        
        //they don't want to change the attribute.
        if(attribute == "")
        {
            if(existsPub)
            {
                attribute = PublicAttributes[pubIndex].attribute;
            }
            if(existsPriv)
            {
                attribute = PrivateAttributes[privIndex].attribute;
            }
        }
        
        //they don't want to change the flag (or don't know what it is and want to keep it same)
        if(flag == 2)
        {
            if(existsPub)
            {
                flag = 0;
            }
            if(existsPriv)
            {
                flag = 1;
            }
        }
        
        //only if it exists, do the update:
        if(existsPub == true || existsPriv == true)
        {
            //order of operations, does removeEntry before addEntry
            success = (removeEntry(descriptor) && addEntry(descriptor,attribute,flag));
        }
        
        
    }
    
    //helper function
    //tells you if a descriptor exists in the public record
    function existsInPublicRecord(string descriptor) returns (bool exists, uint index)
    {
        exists = false;
        index = 0;
        
        if(PublicIndexer > 0)
        {
            for(uint i = 0; i < PublicIndexer; i++)
            {
                //checking if exists = false saves lookups
                if(exists = false && PublicAttributes[i].descriptor = descriptor)
                {
                    exists = true;
                    index = i;
                }
            }
        }
    }
    
    //helper function
    //tells you if a descriptor exists in the private record
    function existsInPrivateRecord(string descriptor) returns (bool exists, uint index)
    {
        exists = false;
        index = 0;
        
        if(PrivateIndexer > 0)
        {
            for(uint i = 0; i < PrivateIndexer; i++)
            {
                //checking if exists = false saves lookups
                if(exists = false && PrivateAttributes[i].descriptor = descriptor)
                {
                    exists = true;
                    index = i;
                }
            }
        }
    }
    
    //helper function, gives you a random integer in the closed interval [min,max]
    function getRand(uint min, uint max) returns (uint val)
    {
        nonce++;
        val = uint(sha3(nonce))%(min+max)-min;
    }
    
    //gives you the ID
    function getID() returns (bytes32 theID)
    {
        theID = ID;
    }
    
    //kills the contract
    function kill()
    {
        suicide(this);
    }

 }
