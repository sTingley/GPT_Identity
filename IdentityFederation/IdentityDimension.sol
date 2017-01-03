contract IdentityDimension
{
    bytes32 ID;
    string dimensionType;
    string dimensionDescriptor;
    //Attributes
    struct Attributes
    {
        string descriptor;
        string value;
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
    function IdentityDimension(bytes32 uniqueID, string typeInput, string descriptorInput, uint flag)
    {
    
        nonce = 0;
        indexer = 0;
    
        ID = sha3(uniqueID + getRand(1,1000));
        dimensionType = typeInput;
        dimensionDescriptor = descriptorInput;
        
        //create the first Attribute/descriptor pair — is always “Owner"
        Attribute temp;
        temp.descriptor = “Owner";
        temp.value = sha3(uniqueID);
        temp.flag = flag;
        
        //add the attribute to the array;
        theAttributes.push(temp);
        //update the indexer
        indexer++;
    }
    //Add attribute/descriptor
    function addEntry(string descriptor, string value, uint flag) returns (bool success)
    {
        success = false;
        //see if there is an empty spot before indexer:
        //doing it this way rather than restructuring length at a delete should save memory
        bool found = false;
        uint theIndex = 0;
        for(uint i = 0; i < indexer; i++)
        {
            if(theAttributes.descriptor == “”)
            {
                found = true;
                theIndex = i;
            }
        }
        if(found)
        {
            theAttributes[theIndex].descriptor = descriptor;
            theAttributes[theIndex].value = value;
        }
        else //create a new spot in the array
        {
            Attribute temp;
            temp.descriptor = descriptor;
            temp.value = value;
            temp.flag = flag;
            //add the attribute to the array;
            theAttributes.push(temp);
            //update the indexer
            indexer++;
        }
        success = true;
    }
    function deleteEntry(string descriptor) returns (bool success)
    {
        success = false;
        for(uint i = 0; i < indexer; i++)
        {
            if(theAttributes[i].descriptor == descriptor))
            {
                success = true;
                theAttributes.descriptor = “";
                theAttributes.value = “";
                theAttributes.flag = 0;
            }
        }
    }
    function update(string descriptor, string value, uint flag) returns (bool success)
    {
        success = false;
        for(uint i = 0; i < indexer; i++)
        {
            if(theAttributes[i].descriptor == descriptor)
            {
                success = true;
                theAttributes.value = value;
                theAttributes.flag = flag;
            }           
        }
    }
    function read(string descriptor) returns (string value)
    {
        value = “”;
        
            for(uint i = 0; i < indexer; i++)
         {
            if(theAttributes[i].descriptor == descriptor)
            {
                value = theAttributes.value;
            }
        }
    
    }
    
    function kill()
    {
        suicide(this);
    }
    //TODO: Should the below access reading (from GPT Specification 1.4) be added to this contract or IdentityDimensionControl contract?
    //1. Only a COID Owner can instantiate or kill an Identity Dimension Contract (function #1 & #6). Invoking #6 requires consensus of all owners
    //2. Only a COID Owner or full controller can access functions #2 - #4
    //3. COID onwers & controllers and delegate controllers specified in the Identity Dimension Control Token contract can access function #5
 }
