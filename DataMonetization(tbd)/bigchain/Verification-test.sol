contract Verification
{

  //this is analagous to "chairperson" in "Ballot"
  //this makes sure only the application can call functions,
  //which requesters should not be able to call:
  //this will be hardcoded in this contract
  address chairperson = 0xDD5BCFA23E88606392D66EB2B45295638F72009E;

  event requestMade(address addr);

  //string msg, string sig, string pubKey
  function VerificationQuery(string pubKey) returns (address newsender){
    newsender = msg.sender;
    requestMade(newsender);
    return newsender;
  }

}
