import React from 'react';
import wallet from './wallet.js';


class Home extends React.Component {

	constructor(props){
		super(props);
		this.state = {
			pwd:'',
			hashCreated: false,
			pubKey:'',
			priKey: ''
		};
		this.keyGenerate = this.keyGenerate.bind(this);
	}

	/*
	 * Generate Public/Private key pair from SECP256k1
	 */
	keyGenerate(e){
		e.preventDefault();
		var password = e.target.pwd.value;
		console.log(password);
		wallet.getKeyPair();
		var pubKey = wallet.byteToHexString(wallet.keypair.publicKey);
		var priKey = wallet.byteToHexString(wallet.keypair.privateKey);


		this.setState({
			pwd: password,
			hashCreated: true,
			pubKey: pubKey,
			priKey: priKey
		});


		console.log("Public Key : " + pubKey + ", privateKey " + priKey);
	}

	render () {
	    return (
	    	<div id="HomeContainer">
	    		<h1>Keypair Generation</h1>
		    	<form method="POST" id="key-gen-form" role="form" onSubmit={this.keyGenerate}>
      				<p>Please enter your password and generate Keypair to get started</p>
      				<div className="form-group">
	      				<label htmlFor="pwd">Enter your password</label>
						<input className="form-control" id="wallet-pwd" type="password" name="pwd" />
					</div>
					<div className="form-group">
						<button className="btn btn-primary" type="submit">Generate Keypair</button>
					</div>
				</form>
	    	</div>
	    );
   }
}

export default Home;