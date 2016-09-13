var crypto = require('crypto');

class Crypto {
	
	constructor(params){
		// crypto password will be the password so every user will have their own password
		this.pubKey = params.pubKey;
		this.algorithm = params.algorithm || "aes-256-ctr";
	}
	
	encrypt(dataStr){
		if(dataStr.length > 0){
			var cipher = crypto.createCipher(this.algorithm, this.pubKey);
			var crypted = cipher.update(dataStr,'utf8','hex');
			crypted += cipher.final('hex');
			return crypted;
		}
		return '';
	}
	
	decrypt(cryptData){
		if(cryptData.length > 0){
			var decipher = crypto.createDecipher(this.algorithm, this.pubKey);
			var dec = decipher.update(cryptData,'hex','utf8');
			dec += decipher.final('utf8');
			return dec;
		}
		return '';
	}
	/**
	 * validate the public key against the session key
	 */
	validateKey(){
		// todo
	}
}
module.exports = Crypto;