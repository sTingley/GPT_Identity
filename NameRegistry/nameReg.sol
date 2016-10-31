contract nameRegistry{
    uint i;
    bool available;
    mapping(uint => string) public registry;
    uint indexer = 0;
    uint access;
    
struct Users{
    string pubkey;
    string name;
 // uint access; // permanent or temporary, will be 0 or 1
    
}
mapping ( address => Users) public users; address public user;
   // mapping (string => string) public users;
    function register(string namespace, string publickey) returns (bool available)
    {
        user = msg.sender;
        users[user].pubkey = publickey;
        users[user].name = namespace;
        //If access == 1, the namespace is permanent, otherise, it is temporary
        //users[user].access = setAddress(namespace);
        
        available = isAvailable(namespace,publickey);
        if(available == true)
        {
          registry[indexer] = namespace;
          indexer++;
        }
    }
/* function get() constant returns(string setmessage)
    {
        regMessage = "we are going to add the new user: ";
        regMessage = "";
    }
*/
    function isAvailable(string regName, string publickkey) returns (bool result)
    {
        result = true;
        for(i=0; i < indexer; i++)
        {
          if (stringsEqual(registry[i], regName)== true )
           // if (users[i] == regName /* && users[i] != 0x00*/)
            {
                result = false;
            }
        }
        return result;
    }
        function stringsEqual(string storage _a, string memory _b) internal returns (bool) {
                bytes storage a = bytes(_a);
                bytes memory b = bytes(_b);
                if (a.length != b.length)
                        return false;
                // @todo unroll this loop
                for (uint i = 0; i < a.length; i ++)
                        if (a[i] != b[i])
                                return false;
                return true;
        }
        
/* Set the access to permanant after IDF gatekeeper verify it
    function setAccess(string name) returns (uint access)
    {
      access = 0;
     if (isAvailable(name)==true)
     {
         access = 1;
     }
     else
     {
         access = 0;
     }
      
      return access;
    }
*/
}
