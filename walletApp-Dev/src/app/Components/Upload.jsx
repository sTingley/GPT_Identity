import React from 'react';

class UploadKeyStore extends React.Component {

	constructor(props) {
		super(props);
		this.url = twinUrl + "ballot/readNotify/";
		this.state = {
			pubKey: "",
			fileread: false,
			contacts: [],
		};

		this.uploadFile = this.uploadFile.bind(this);
	}

	//puts the users keys into local storage
	createStorage(pubKey, private_key) {
		localStorage.setItem("pubKey", pubKey);
		localStorage.setItem("privKey", private_key);
		var now = new Date();
		now.setMinutes(now.getMinutes() + 30);
		localStorage.setItem("timestamp", now.getTime());
	}

	//set the users local storage and log them in
	uploadFile(e) {
		e.preventDefault();
		var file = e.target.files.value;
		var fileType = file.split('.').pop();
		if (fileType == "json") {
			var reader = new FileReader();
			reader.onload = function (event) {
				var obj = JSON.parse(event.target.result);
				this.createStorage(obj.public_key, obj.private_key);
				this.setState({ pubKey: obj.public_key, priKey: obj.private_key, fileread: true });
				this.props.loginHandler(this.state);
			}.bind(this);
			reader.readAsText(e.target.files.files[0]);
		} else {
			alert("Unknown file format ! We support only JSON");
		}

		//set contacts upon key upload; Replace hardcodede pubKey with uploaded key later
		$.ajax({
			url: twinUrl + "readContacts/" + '03a066efbb37f5fabfab05bf4a65e0dc376d0e3fb1c3d930d7f5ec6da3ac5bc237',
			dataType: 'json',
			cache: false,
			success: function (resp) {
				var names = [];
				var keys = [];
				for (var i = 0; i < resp.data.contacts.length; i++) {
					names.push(resp.data.contacts[i].contactName);
					keys.push(resp.data.contacts[i].pubKey);
				}

				localStorage.setItem("contactNames", names);
				localStorage.setItem("contactPubKeys", keys);
				console.log("LS contactNames: " + localStorage.getItem("contactNames"));
			}.bind(this)
		});
	}

	render() {
		var cssClass = 'hidden';
		if (this.state.fileread) cssClass = 'show';
		return (
			<div className="panel panel-default">
				{/* <small>JSON(.json) file format only supported</small> */}
				<div className="panel-heading"><strong>Upload Login Credentials</strong></div>
				<div className="panel-body">
					<h4>Select account file from your computer</h4>
					<form action="" method="post" encType="multipart/form-data" id="js-upload-form" onSubmit={this.uploadFile}>
						<div className="form-inline">
							<div className="form-group">
								<input type="file" name="files" id="js-upload-files" />
							</div>
							<button type="submit" className="btn btn-sm btn-primary" id="js-upload-submit">UPLOAD</button>
						</div>
					</form><br />
					<div className={cssClass}>
						<p><b>Public Key : </b>{this.state.pubKey}</p>
					</div>
				</div>
			</div>
		);
	}

}

export default UploadKeyStore;
