var crypto = require('crypto');
var secp256k1 = require('secp256k1/js');

var wallet = {};

wallet.byteToHexString = function (uint8arr) {
  if (!uint8arr) {
    return '';
  }
  
  var hexStr = '';
  for (var i = 0; i < uint8arr.length; i++) {
    var hex = (uint8arr[i] & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    //console.log(uint8arr[i] + "is converted to "+ hex);
    hexStr += hex;
  }
  
  return hexStr.toUpperCase();
}

wallet.hexStringToByte = function (str) {
  if (!str) {
    return new Uint8Array();
  }
  
  var a = [];
  for (var i = 0, len = str.length; i < len; i+=2) {
    a.push(parseInt(str.substr(i,2),16));
  }
  
  return new Uint8Array(a);
}

// string to uint array
wallet.stringToTypedArray =function (s) {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        ua[i] = ch.charCodeAt(0);
    });
    return ua;
}

wallet.stringify = function() {
	if(this.keypair != null && this.keypair != undefined) {
		console.log(this.keypair.publicKey.toString());
		return this.keypair.publicKey.toString();
	}
	
};

wallet.getKeyPair = function() {
	console.log(secp256k1);
	var privKey;
	do {
	  privKey = crypto.randomBytes(32);
	} while (!secp256k1.privateKeyVerify(privKey));

	// get the public key in a compressed format
	var pubKey = secp256k1.publicKeyCreate(privKey);

	this.keypair = {
		"privateKey": privKey,
		"publicKey": pubKey
	};
	console.log(this.keypair);
};

wallet.getSign = function(msg) {
	console.log(msg);
	
	var sign = secp256k1.sign(msg, this.keypair.privateKey);
	return sign;					
}

module.exports = wallet;