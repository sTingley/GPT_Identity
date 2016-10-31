import "nameReg.sol"; contract identity{
   // address owner;
   // address nameReg;
    bool isRegister;
    bool isAvailable;
    event Registered(address addr, string retMessage);
     mapping (string => address) internal users;
    // event namespaceMapping (address sender, string username);
      address owner = msg.sender;
   function toRegister(address nameRegAddress, string name, string pubkey) returns (bool message)
   {
       nameRegistry nR = nameRegistry(nameRegAddress);
       isRegister = nR.register(name, pubkey);
       if (isRegister == true)
       {
         // Register the provided name with the caller address.
           users[name] = msg.sender;
           message = true;
           Registered(users[name],"The user is successfullt registered");
       }
       else
       {
           message = false;
       }
       return message;
   }
   function checkAvailable(address nameRegAddress, string name, string pubkey) returns (bool retmessage)
   {
       nameRegistry nR = nameRegistry(nameRegAddress);
       isAvailable = nR.isAvailable(name,pubkey);
        if(isAvailable == true)
           return true;
        else
          return false;
   }
     function remove() {
        if (msg.sender == owner){
            suicide(owner);
        }
    }
}
