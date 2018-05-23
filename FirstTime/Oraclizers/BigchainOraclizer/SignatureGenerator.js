var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;


var pubKey1 = "41d0466cbb129d6b4ad727d9be77acb34e86577e627f555299dc12e7a515169d";
var privKey1 = "62e48f7480ecf6164c1ee2cea4b13ae6df2ea2f6bd705bbbb481cb5122b792c5";

var pubKey2 = "aded1145a6c95b8334c85f9d1d44f66077123f48edd61cd9fd0357547788805e";
var privKey2 = "d857921f7ab6f75fa1929b426cdda5ed443f9a07b4fadfad88cc6fcee6211efd";

var pubKey3 = "4c055c9a8cc16e8c37d3957170887774da8df5fc9998d7f31b36d89238df7019";
var privKey3 = "4fc67597a4e793e51ee5744e14c5bd437d419a190c6da47fa35e959a0f10f701";

// Generate keys from secp256k1 elliptic curve
this.generateKeys = function() {
    do {
        this.privKey = crypto.randomBytes(32)
    } while (!secp256k1.privateKeyVerify(this.privKey))
    this.pubKey = secp256k1.publicKeyCreate(this.privKey);
    console.log('generating keys.... ')
    //console.log("public key is: " + this.buffer_to_hexString(this.pubKey));
    //console.log('generated pubkey: ' + pubKey)
};




  //******************************************************************************
// Return the pubKey (buffer)
  this.getPubKey = function() {
    return this.pubKey;
  };

  this.getPrivateKey = function(){
    return this.privKey;
  }

this.generateKeys()


  this.hexString_to_buffer = function(str) {

      var bufferString = [];
      var current = "";
      var counter = 0;
      for (j = 0; j < str.length / 2; j = j + 2) {

          current = str[j] + str[j + 1];
          //now convert to decimal
          current = parseInt(current, 16);
          //now add it to buffer
          bufferString[counter] = current;
          counter++;
      }
      var buffer = Buffer.from(bufferString);
      console.log('buffer: ' + buffer);
      return buffer;
  }


  this.buffer_to_hexString = function(buffer) {

      var hexString = "";

      var i;
      for (i = 0; i < buffer.length; i++) {
          hexString = hexString + buffer[i].toString(16);
      }
      return hexString;
  }

  this.sign = function(msg, privKey) {
      console.log('secp256k1 signing... ');
      var sigObj = secp256k1.sign(msg, privKey)
      return sigObj
  };


  this.getHash = function(msg){
    this.hash = keccak_256(msg);
    return this.hash;
  };




//get hash:
//var theHash = this.getHash("AC27664FF75970D606D731D4F6CBD391E18D839D0365C4991944132F806441380000000000000000000000000000000000000000000000000000000000000000");
//console.log("Message hash is: " + theHash);
//var theHash = this.getHash("this is a message");
//console.log(theHash);



//make the privkeys buffers
//privKey1 = this.hexString_to_buffer(privKey1);
//privKey2 = this.hexString_to_buffer(privKey2);
//privKey3 = this.hexString_to_buffer(privKey3);

//sign the messages:
//var sig1 = this.sign(this.hexString_to_buffer(theHash),privKey1);
//var sig2 = this.sign(this.hexString_to_buffer(theHash),privKey2);
//var sig3 = this.sign(this.hexString_to_buffer(theHash),privKey3);


//make the signatures strings:
//sig1 = this.buffer_to_hexString(sig1);
//sig2 = this.buffer_to_hexString(sig2);
//sig3 = this.buffer_to_hexString(sig3);

//log the signatures:
//console.log("First sig: " + sig1);
//console.log("First pub: " + pubKey1);

//console.log("Second sig: " + sig2);
//console.log("Second pub: " + pub2);

//console.log("Third sig: " + sig3);
//console.log("Third pub: " + pub3);

