contract Verification {

  address chairperson = 0x06DF20C4A4220D1B8D2CB3917BC896DD5A8D13A6;

  function verifySignature(string message, string sig, string pubKey)  returns (bool status) {
    address newsender = msg.sender;
    if(chairperson == msg.sender){
      status = true;
    } else {
      status = false;
    }
  }
}
