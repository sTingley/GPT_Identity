contract ErisBigchainRequester
{
    //this is analagous to "chairperson" in "Ballot"
    //this makes sure only the application can call functions,
    //which requesters should not be able to call:
    //this will be hardcoded in this contract
    address chairperson = 0xE6A299E460649D658504E1D887AE738321EDBD5B;

    event CallbackReady(address addr);
    event requestMade(address addr);	
	
    //Create the structue for requests
    //it will prove useful in the future
    struct requestStruct
    {
        uint txnInProgress;
        string theRequest;
    }
    
    //Mappings (could have put callbacks in requestStruct?)
    mapping (address => requestStruct) requests;
    mapping (address => string) callbacks;
    
    //This information is needed to implement first-in-first-out
    address[] indexer;

    // string requestInfo is a stringified JSON obj with the structure:
    // {"method":[GET/POST], "stringJsonData": [JSON structured data for POST request], "endpoint":[endpoint specified by BigchainDBDriver_v[#].py]}
    function BigChainQuery(string requestInfo)    
    {

        //check there is no previous request with msg.sender
        if(requests[msg.sender].txnInProgress != 0)
        {
            throw;
        }

        //no previous request, add to the mapping of requests
        requests[msg.sender].txnInProgress = 1;
        requests[msg.sender].theRequest = requestInfo;
        
        //create the callback!
        callbacks[msg.sender] = "Your transaction is in progress.";

        //push into the indexer
        indexer.push(msg.sender);

	requestMade(msg.sender);        
        
    }

	
    function removeMyRequest()
    {
	
        //(1) FIND index of msg.sender (there can be only one):
        uint theIndex = 0;
		bool check = false;

        for (uint i = 0; i < indexer.length; i++)
        {
            if(indexer[i] == msg.sender)
            {
                theIndex = i;
		check = true;
            }
        }
	
	if(check)
	{
        //(2) Remove it, without leaving a gap, so we can treat it as a stack:
        //does doing this imply the need of mutex logic (confused multiple deletes)???
        for (uint j = 0; j < indexer.length; j++)
        {
            if( j >= theIndex && j < indexer.length -1)
            {
                indexer[j] = indexer[j+1];
            }     
        }

        delete(indexer[indexer.length - 1]);	
	}	

	
	address addr = msg.sender;
	
		
	callbacks[addr] = "";
	requests[addr].txnInProgress = 0;
        requests[addr].theRequest = "";

    }


    function myCallback() returns (string userCallback)
    {
	userCallback = callbacks[msg.sender];
    }	


    //this function is intended for ErisBigchainService.js
    //check if the list is empty    
    function listIsEmpty() returns (bool emptyList)
    {
        if(msg.sender == chairperson)
        {
            emptyList = true;
            if(indexer.length == 0)
            {
                emptyList = true;    
            }
            
	    for (uint n = 0; n < indexer.length; n++)
	    {
		address curAddr = indexer[n];
		if(requests[curAddr].txnInProgress == 1)
		{
			emptyList = false;
		}	
	    }
        }
    }


    //this function is intended for ErisBigchainService.js
    //0 is the index of the current address in the stack
    function getCurrentInList() returns (address addr)
    {
        if(msg.sender == chairperson)
        {
	    bool checkIt = false;

	    uint theIndex = 0;
	    for (uint k = 0; k < indexer.length; k++)
	    {
		address current = indexer[k];
		if(requests[current].txnInProgress == 1)
		{
			if(checkIt == false)
			{
				theIndex = k;
				checkIt = true;
			}
		}
	    }
	    if(checkIt == true)
	    {	
	    	addr = indexer[theIndex];
	    }
        }
    }


    //this function is intended for ErisBigchainService.js
    //this passes the request by address    
    function getRequestByAddress(address addr) returns (string request)
    {
        if(msg.sender == chairperson)
        {
            return requests[addr].theRequest;
        } 
    }


    //allows the javascript application(ErisBigchainService.js) to set values
    //ErisBigchainService.js uses the response field to pass responses from bigChainDB to the contract
    function setCurrentInList(address addr, string response)
    {
        if(msg.sender == chairperson)
        {
	    CallbackReady(msg.sender);
            requests[addr].txnInProgress = 0;
            callbacks[addr] = response;
            
        }            
    }
}
