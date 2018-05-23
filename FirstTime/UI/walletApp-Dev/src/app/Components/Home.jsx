import React from 'react';
import wallet from './wallet.js';

class DownloadFile extends React.Component{

	constructor(props){
		super(props);
		this.state = {
			download_url: props.params[1],
			//pwd: props.params[0],
			pub_key: props.params[2]
		};
	}

	render(){
		return (
			<div className="download_container row"><hr/>
			<h1>Success! Your account has been created.</h1>
			<div className="col-md-6">
				<div className="form-group">
					<label htmlFor="download_button">Keystore/JSON File (Encrypted)</label>
					<a href={this.state.download_url} download="keypairs.json" name="download_button" className="btn btn-primary btn-block">DOWNLOAD</a>
				</div>
			</div>
			<div className="col-md-6">
				<div className="form-group">
					<label htmlFor="private_key">Public Key</label>
					<textarea name="private_key" className="form-control" id="pub_key" disabled>{this.state.pub_key}</textarea>
				</div>
			</div>
		   </div>	
		);
	}

};


class Home extends React.Component {

	constructor(props){
		super(props);
		this.state = {
			pwd:'',
			hashCreated: false,
			download_url:'',
			private_key:'',
		};
		this.wallet = new wallet();
		this.keyGenerate = this.keyGenerate.bind(this);
	}

	/*
	 * Generate Public/Private key pair from SECP256k1
	 */
	keyGenerate(e){
		e.preventDefault();
		var password = e.target.pwd.value;
		this.wallet.setPassword(password);
		this.wallet.generateKeys();
		if(this.wallet.getPubKey()) {
			var url = this.wallet.makeWalletFile();
			this.setState({ pwd: password, hashCreated: true, download_url: url, private_key: this.wallet.getPrivateKey(), public_key: this.wallet.getPubKey() });
			console.log(url);
		} else {
			console.log("Error: creating key pairs");
		}
	}

	render () {
	    return (
	    	<div id="HomeContainer">
	    		<h1>Account Generation</h1>
				<hr/>
		    	<form method="POST" id="key-gen-form" role="form" onSubmit={this.keyGenerate}>
      				<div className="form-group">
	      				<label htmlFor="pwd">Enter a password that will be used to generate your account file</label>
						<input className="form-control" id="wallet-pwd" type="password" name="pwd" />
					</div>
					<div className="form-group">
						<button className="btn btn-primary" type="submit">Generate Account</button>
					</div>
				</form>
				{ this.state.hashCreated ? <DownloadFile params={[this.state.pwd, this.state.download_url, this.state.public_key]} /> : null }
	    	</div>
	    );
   }
}

export default Home;
