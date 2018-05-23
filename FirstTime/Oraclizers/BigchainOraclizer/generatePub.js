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
        // this.pubKey = secp256k1.publicKeyCreate(this.privKey);
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
      var sigObj = secp256k1.sign(msg,privKey)
      return sigObj
  };

  //******************************************************************************
  // Verify a signed message
  this.verify = function(msg, signature, pubKey) {
      // parameters are buffer objects
      //msg = new Buffer(msg, "hex")
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
        return buffer.toString("hex");
  }

  //******************************************************************************
  // Hexstring need to be converted in order to use internal secp256k1 methods
  this.hexString_to_buffer = function(str) {

      return new Buffer(str,"hex");
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


//I updated the functions buffer_to_hexString, hexString_to_buffer
//I added newBuffer(privKey,"hex") or sign wasn't working

//Instantiate the wallet
var myWallet = new wallet();
myWallet.generateKeys();

//This gets pubKey
var pubKey = myWallet.getPubKey();

//This gets privKey
var privKey = myWallet.getPrivateKey();
console.log(privKey);


//This is string of pubKey and privKey
var pubKeyString = myWallet.buffer_to_hexString(pubKey);
var privKeyString = myWallet.buffer_to_hexString(privKey);

console.log("String of public key is: " + pubKeyString);
console.log("String of private key is: " + privKeyString);



//Generate a message:
var message = "hi";
var msgHash = myWallet.getHash(message);
var msgHashString = myWallet.buffer_to_hexString(msgHash);
console.log("Message hash string: " + msgHashString);


//Sign the message:
var signature = myWallet.sign(new Buffer(msgHashString,"hex"), new Buffer(privKeyString,"hex"));

//Get the signature
var sigString = signature.signature.toString('hex');

//Do verification
console.log(myWallet.verify(new Buffer(msgHashString,"hex"), new Buffer(sigString, "hex"), new Buffer(pubKeyString,"hex")))
console.log("sig string is: " + sigString)
