// CLIENT SIDE CRYPTO
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;

var signature = function(msg, privKey) {
  var msg = keccak_256(msg);
  console.log(msg);
  msg = new Buffer(msg, "hex");
  privKey = new Buffer(privKey,"hex");
  console.log("Length -->",privKey.length)
    var sigObj = secp256k1.sign(msg, privKey)
    return sigObj
};

console.log(signature("arun","E0D297F342B9B9040EBF0A1087E36541EC92C7B2AE13811113099321854072A3771B84288818D9AAB7CF528B5D16D4408C4084E07D5FF608A95CD8858D69063F"));
