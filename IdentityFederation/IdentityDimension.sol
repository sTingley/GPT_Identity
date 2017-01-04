contract IdentityDimension
{
    bytes32 ID;
    string dimensionType;
    string dimensionDescriptor;
    //Attributes
    struct Attributes
    {
        string attribute;
        string descriptor;
        uint flag; //flag = 0 ==> public, flag = 1 ==> public
    }
    Attributes[] theAttributes;
    uint indexer; //tells you the current index of the array;
    uint nonce;//for random number generation
    function getRand(uint min, uint max) returns (uint val)
    {
        nonce++;
        val = uint(sha3(nonce))%(min+max)-min;
    }
    //constructor — input information at instantiation
    function IdentityDimension(bytes32 uniqueID, string attributeInput, string descriptorInput, uint flag)
    {
    
        nonce = 0;
        indexer = 0;
    
        ID = sha3(uniqueID + getRand(1,1000));
        dimensionType = attributeInput;
        dimensionDescriptor = descriptorInput;
        
        //create the first Attribute/descriptor pair — is always “Owner"
        Attributes temp;
        temp.attribute = “Owner";
        temp.descriptor = sha3(uniqueID);
        temp.flag = flag;
        
        //add the attribute to the array;
        theAttributes.push(temp);
        //update the indexer
        indexer++;
    }
    
    function getID() returns (bytes32 theID)
    {
        theID = ID;
    }
    
    
    
    //Add attribute/descriptor
    function addEntry(string attribute, string descriptor, uint flag) returns (bool success)
    {
        success = false;
        //see if there is an empty spot before indexer:
        //doing it this way rather than restructuring length at a delete should save memory
        bool found = false;
        uint theIndex = 0;
        for(uint i = 0; i < indexer; i++)
        {
            if(theAttributes.attribute == "")
            {
                found = true;
                theIndex = i;
            }
        }
        if(found)
        {
            theAttributes[theIndex].attribute = attribute;
            theAttributes[theIndex].descriptor = descriptor;
        }
        else //create a new spot in the array
        {
            Attributes temp;
            temp.attribute = attribute;
            temp.descriptor = descriptor;
            temp.flag = flag;
            //add the attribute to the array;
            theAttributes.push(temp);
            //update the indexer
            indexer++;
        }
        success = true;
    }
    function deleteEntry(string attribute) returns (bool success)
    {
        success = false;
        for(uint i = 0; i < indexer; i++)
        {
            if(theAttributes[i].attribute == attribute))
            {
                success = true;
                theAttributes.attribute = "";
                theAttributes.descriptor = "";
                theAttributes.flag = 0;
            }
        }
    }
    
    //If the descriptor is "", then leave it as it is
    //if the flag is 2, then leave it as it is
    function update(string attribute, string descriptor, uint flag) returns (bool success)
    {
        success = false;
        for(uint i = 0; i < indexer; i++)
        {
            if(theAttributes[i].attribute == attribute)
            {
                success = true;
                if(descriptor != "")
                {
                    theAttributes.descriptor = descriptor;
                    success = true;
                }
                if(flag != 2)
                {
                    theAttributes.flag = flag;
                    success = true;
                }   
                
            }    
        }
    }
    function read(string attribute) returns (string value)
    {
        value = “”;
        
        for(uint i = 0; i < indexer; i++)
         {
            if(theAttributes[i].attribute == attribute)
            {
                value = theAttributes.attribute;
            }
        }
    
    }
    
    function kill()
    {
        suicide(this);
    }

 }
