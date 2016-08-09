//******************************************************************************
// CLIENT SIDE CRYPTO
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;

var wallet = function(){
  this.password = "";
  this.algorithm = 'aes-256-ctr';
  this.pubKey = "";
  this.privKey = "";
  this.hash = "";

  this.setPassword = function(password){
    this.password = password;
  };

  //******************************************************************************
// Generate keys from secp256k1 elliptic curve
  this.generateKeys = function() {
    do {
        this.privKey = crypto.randomBytes(32)
    } while (!secp256k1.privateKeyVerify(this.privKey))
    this.pubKey = secp256k1.publicKeyCreate(this.privKey);
    console.log('generating keys.... ')
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

  this.getHash = function(msg){
    this.hash = keccak_256(msg);
    return this.hash;
  };

  //******************************************************************************
  // Sign a message with a (buffer) private key
  // Before calling this method, transform msg into a buffer
  // msg = new Buffer(msg, "hex")
  this.sign = function(msg, privKey) {
      console.log('secp256k1 signing... ');
      var sigObj = secp256k1.sign(msg, privKey)
      return sigObj
  };

  //******************************************************************************
  // Verify a signed message
  this.verify = function(msg, signature, pubKey) {
      // parameters are buffer objects
      // msg = new Buffer(msg, "hex")
      console.log('verifying msg, sig, pubKey....');
      var verified = secp256k1.verify(msg, signature, pubKey);
      return verified;
  };

  //******************************************************************************
  // Encryption methods
  // USE utf8 encoding for a buffer!
  this.encrypt = function(buffer) {
      var cipher = crypto.createCipher(this.algorithm, this.password);
      var crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      return crypted;
  };

  //******************************************************************************
  this.decrypt = function(buffer) {
      var decipher = crypto.createDecipher(this.algorithm, this.password);
      var dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
      return dec;
  };

  //******************************************************************************
  this.encryptKeys = function() {
      this.encrypt(this.pubkey);
      this.encrypt(this.privKey);
      console.log('pub: ' + this.pubkey + ' priv: ' + this.privKey);
  };

  //******************************************************************************
  // Keys & signatures are normally represented as hexstrings
  this.buffer_to_hexString = function(buffer) {

      var hexString = "";

      var i;
      for (i = 0; i < buffer.length; i++) {
          hexString = hexString + buffer[i].toString(16);
      }
      return hexString;
  }

  //******************************************************************************
  // Hexstring need to be converted in order to use internal secp256k1 methods
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

  //******************************************************************************
  // Using fs.writeFile
  this.makeWalletFile = function() {

      //we hash the keys before writing them a file
      //wallet name will be saved as 'hashed_public_key.txt'
      this.pubKey = this.getHash(this.buffer_to_hexString(this.pubKey));
      this.privKey = this.getHash(this.buffer_to_hexString(this.privKey));

      var jsonStr = {
        'public_key' : this.pubKey,
        'private_key' : this.privKey
      };

      var json = JSON.stringify(jsonStr);
      var blob = new Blob([json], {type: "application/json"});
      return URL.createObjectURL(blob);
  };

  //******************************************************************************
  //******************************************************************************
  //NEEDS TO BE FINISHED!!!!!!!!!

  //current design is to hash the pubkey and then check for the correct wallet
  //the wallet file will have to be read and then can be returned to the user

  this.retrieveWallet = function(pub) {

      

  }


};

module.exports = wallet;

//******************************************************************************
//TESTING!!!!!!
/*
generateKeys()

console.log()
var msgHash = getHash("this is a message")
//console.log("this is the msg hash: " + msgHash)
msgHash = new Buffer(msgHash, "hex")
//msgHash = hexString_to_buffer(msgHash)

var privString = "AC27664FF75970D606D731D4F6CBD391E18D839D0365C4991944132F806441380000000000000000000000000000000000000000000000000000000000000000";

var buffer3 = hexString_to_buffer(privString)
console.log('buffer3: ' + buffer3)

var erisSigObj = sign(msgHash, buffer3)

var erisSig = JSON.parse(JSON.stringify(erisSigObj)).signature

esig = JSON.parse(JSON.stringify(erisSig)).data
console.log('erisSig: ' + buffer_to_hexString(esig))

var erispubKey = secp256k1.publicKeyCreate(buffer3)

console.log('result of verify ERIS: ' + verify(msgHash, erisSigObj.signature, erispubKey))
console.log('eris pubkey: ' + buffer_to_hexString(erispubKey))

//Eris data
//*************************************************************************

console.log('private key: ' + JSON.stringify(privKey))
console.log('right before signing pubkey is: ' + typeof (pubkey))
var sigObj = secp256k1.sign(msgHash, privKey)
console.log('sigObj ' + sigObj)

var sig = JSON.parse(JSON.stringify(sigObj)).signature
sig = JSON.parse(JSON.stringify(sig)).data

var hexSig = buffer_to_hexString(sig)
console.log('signature: ' + hexSig)
console.log()
var hexPub = buffer_to_hexString(pubKey)
console.log('pubKey: ' + hexPub)

makeWalletFile(pubKey, privKey)

console.log('result of verify: ' + secp256k1.verify(msgHash, sigObj.signature, pubKey))
//console.log(pubKey)
//console.log(sigObj.signature)
console.log("this pub key: " + pubKey.toString('hex'));
console.log("this signature: " + sigObj.signature.toString('hex'));

//console.log("pub key: " + pubKey.toString('hex'));
//console.log("sig: " + sigObj.signature.toString('hex'));
//console.log("hash msg: " + msgHash.toString('hex'));

*/