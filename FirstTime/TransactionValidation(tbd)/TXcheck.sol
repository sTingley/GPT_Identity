contract TXcheck{    
    /*********************************************************************************************    
    [   {tx_n, element_n, rule_n, value_},
        {tx_n, element_n, rule_n+1, value_},
        {tx_n, element_n, rule_n, value_},
        {tx_n, element_n, rule_n+1, value_},    ]
        
    [   {CreateCOID, UniqueID, isnot, ""},
        {CreateCOID, name, isnot, ""},
        {CreateCOID, UniqueIDAttrs, isnot, "0x0"},
        {CreateCOID, UniqueIDAttrs, gt, 0},     
        {CreateCOID, name, isnot, "nikhil"},]    
    *********************************************************************************************/   
    
    //dynamic array where elements are of type [4]
    //npc: is this array for crosschecking the incoming transaction against values in array?
  // AF: needs to be changed to string
    struct ruleDef {
        string tx_type;
        string tx_element;
        string tx_rule;
        string tx_value;
    }
//    mapping (uint => ruleDef) ruleArray;
//    bytes32[] helperArray;
    
    ruleDef[] ruleArray;

    ruleDef temp;

function returnTime() returns(uint time){
        return now;
    }    
        
 //validating transactions returning boolean result, considering tx_type, element and value as input
//AF: changed type to string to ensure consistency. Changed logic somewhat
    function validateTransactionElement(string txn_type, string txn_element, string txn_value) returns (bool result, string message){
            
            //matching transaction types will be matched and indexes will stored in indices array
            //getTxType(txn_type);
            //if(tx_found){//if "indices" array is not blank
                
        result = true; //if no rule found assumption is that tx is valid!
    
        for(uint i=0; i< ruleArray.length; i++){
            string arrTxn_type = ruleArray[i].tx_type;
            string arrTxn_element = ruleArray[i].tx_element;
            string arrTxn_rule = ruleArray[i].tx_rule; //isnot, is,gt,lt
            string arrTxn_value = ruleArray[i].tx_value;
                    
            //comparing incoming elements with element in array
        //    if (txn_type == arrTxn_type) {
              if(compare(txn_type, arrTxn_type)== 0){
                
    //            if(txn_element == arrTxn_element){
                if(compare(txn_element, arrTxn_element)==0){
                    
                    if(compare(arrTxn_rule, "is")==0){
    //                if(arrTxn_rule=="is"){ //checking for "="
    //                    if(txn_value != arrTxn_value){
                        if(compare(txn_value, arrTxn_value)!=0){
                            result = false;
                        }//close tx_value if statement for "is"
                        //else if(arrTxn_rule=="isnot"){ //checking for "!="
                        else if(compare(arrTxn_rule, "isnot")==0){
                            if(compare(txn_value, arrTxn_value)==0){
                                result = false;
                            }//close tx_value if statement for "isnot" if statement
                            else if(compare(arrTxn_rule, "lt")==0){ //checking for "<"
                                uint intTxn_value = parseInt(txn_value);
                                uint intArrTxn_value = parseInt(arrTxn_value);
                                
                            //  if(txn_value > arrTxn_value){
                                if(intTxn_value > intArrTxn_value){
                                    result = false;
                                }//close tx_value if statement for "lt" if statement
                                else if(compare(arrTxn_rule, "gt")==0){ // checking for ">"
                                    intTxn_value = parseInt(txn_value);
                                    intArrTxn_value = parseInt(arrTxn_value);
                                    
                                    //if(txn_value < arrTxn_value){
                                    if(intTxn_value < intArrTxn_value){
                                        result = false;
                                    }//close tx_value if statement for "gt" if statement
                                }// close ">" rule if statement
                            }//close "<" rule if statement
                        }// close "isnot" rule if statement
                    }//close "is" rule if statement
                }//close tx_element if statement
            }//close tx_type if statement
        
            if (result == false) {//if a rule is violated. Stop right away and return result
               return (result, "Transaction is not valid!");
            }
    
        }//close for loop
    
        if (result == true) {
            return (result, "Transaction is valid!");}
        else {
            return (result, "Transaction is not valid!");
        }
    }//close function
    
    
     /*********************************************************************************************
    
    Adds a block to the ruleArray
    This adds rules to ruleArray against which we will verify transactions
    
    *********************************************************************************************/
    function addblock(string txnType, string element, string rule, string value) returns (string result) {
        
       // ruleArray[ruleArray.length+1].tx_type = txnType;
       // ruleArray[ruleArray.length+1].tx_element = element;
       // ruleArray[ruleArray.length+1].tx_rule = rule; //isnot, is,gt,lt
       // ruleArray[ruleArray.length+1].tx_value = value;
        
       // ruleDef ruleDefToAdd = new ruleDef;
        temp.tx_type = txnType;
        temp.tx_element = element;
        temp.tx_rule = rule;
        temp.tx_value = value;
        
        ruleArray.push(temp);
        
        return result = "New rule added!";
        
    }
    
/***************************************************************************************/    
    //code for string comparison
    //taken from https://github.com/ethereum/dapp-bin/blob/master/library/stringUtils.sol
    
    
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
    /// @dev Compares two strings and returns true iff they are equal.
    function equal(string _a, string _b) returns (bool) {
        return compare(_a, _b) == 0;
    }
    
/***************************************************************************************/ 


//AF: we need to loop through the array 1 time anyway. Then we might as well apply the logic for each loop    
    /*********************************************************************************************
    
    We call getTxType to check if a TxType exists in array[][4]
    the 'blocks' in our global dynamic which holds arrays of size 4, ruleArray[4][]
    
    RETURN VALUE IS SET TO GLOBAL VALUE, uint[] indices;
    
    *********************************************************************************************/
   
 /* function getTxType(string tx) returns (uint[]){
        
                
       for(uint i=0;i< ruleArray.length; i++){
            
          if (tx == ruleArray[i][0]){
                
            indices.push(i);
            }
            
        }
        if(indices.length == 0){
            tx_found = false;
        }else{
            tx_found = true;
        }
    }
    */
    
    /*********************************************************************************************
    
    INPUT an array of size 4 [txnType, element, rule value] to check input against
    the 'blocks' in our global dynamic which holds arrays of size 4, array[4][]
    
    *********************************************************************************************/
    
    // bool tx_match;
    
/***    function getValue(string[4] input) returns (bool res){
                
        txnType = input[0];
        element = input[1];
        rule = input[2];
        value = input[3];
        res = false //AF: assume no match
        for(uint i=0; i<ruleArray.length; i++){
            
            //if we find a matching tx_type ex: coidCreate
            if(txnType = ruleArray[i].ruleDef.tx_type){
                return res = true;            
            }            
        }
    }
****/
   
    function parseInt(string _a) internal returns (uint) {
        return parseInt(_a, 0);
    }
    function parseInt(string _a, uint _b) internal returns (uint) {
        bytes memory bresult = bytes(_a);
        uint mint = 0;
        bool decimals = false;
        for (uint i=0; i<bresult.length; i++){
            if ((bresult[i] >= 48)&&(bresult[i] <= 57)){
                if (decimals){
                   if (_b == 0) break;
                    else _b--;
                }
                mint *= 10;
                mint += uint(bresult[i]) - 48;
            } else if (bresult[i] == 46) decimals = true;
        }
        if (_b > 0) mint *= 10**_b;
        return mint;
    }
}
