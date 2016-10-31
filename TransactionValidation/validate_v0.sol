contract validate{

   address owner = msg.sender;

   //recevies actual transaction to validate against list of tx types

   //(transaction type e.g. name_request, transaction data as a byte array
   //you can parse in the smart contract (public key, requested name))

   string[] txArray = ["NamespaceRegister", "CreateCOID"];

   struct transaction
   {
       string name;   // short name (up to 32 bytes)
       bytes data; // number of accumulated votes
   }

   function checkTxs(string input,string name) returns (bool result)
   {
       result = false;

       bytes memory n = bytes(name);
       uint length = n.length;
       if(length > 30 || length < 1) throw;

       for(uint i = 0; i < txArray.length; i++)
       {
           if(equal(input,txArray[i]))
           {
               result = true;
           }
       }
   }

   function add__tx(string s){

       txArray.push(s);
   }

   function compare(string _a, string _b) returns (int) {
       bytes memory a = bytes(_a);
       bytes memory b = bytes(_b);
       uint minLength = a.length;
       if (b.length < minLength) minLength = b.length;
       //@todo unroll the loop into increments of 32 and do full 32 byte comparisons
       for (uint i = 0; i < minLength; i ++)
           if (a[i] < b[i])
               return -1;
           else if (a[i] > b[i])
               return 1;
       if (a.length < b.length)
           return -1;
       else if (a.length > b.length)
           return 1;
       else
           return 0;
   }

   function equal(string _a, string _b) returns (bool) {
       return compare(_a, _b) == 0;
   }

   //   function stringsEqual(string storage _a, string memory _b) internal returns (bool) {
   //           bytes storage a = bytes(_a);
   //           bytes memory b = bytes(_b);
   //           if (a.length != b.length)
   //                   return false;
   //           // @todo unroll this loop
   //           for (uint i = 0; i < a.length; i ++)
   //                   if (a[i] != b[i])
   //                           return false;
   //           return true;
   //   }

}
