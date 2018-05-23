import React from 'react';
import {Link} from 'react-router';
import wallet from './wallet.js';

class Notify extends React.Component {
    constructor(props) {
        super(props);
        this.prop = props;
    }
    render() {
        //var type = this.prop.params.type || "info";
        //var css = "alert alert-"+type;
        return (
            <div className="alert alert-info" role="alert">
                <span className="glyphicon glyphicon-alert"></span>You received an notification
                <Link to="/tovote">Click to open</Link>
            </div>
        );
    }
};

// TODO : Drag and Upload
// TODO	: Dropbox/google cloud upload for mobile/tablet users
// TODO : File type validation, this can be done once finalized supported formats
class UploadKeyStore extends React.Component {

    constructor(props) {
        super(props);
        this.url = twinUrl + "ballot/readNotify/";
        this.state = {
            pubKey: "",
            priKey: "",
            fileread: false,
            notify: false,
            coid: null
        };
        this.util = new wallet();
        this.uploadFile = this.uploadFile.bind(this);
        this.onResponse = this.onResponse.bind(this);
    }

    getUrl() {
        return this.url + this.state.pubKey;
    }

    toVote() {
        $.get(this.getUrl(), this.onResponse);
    }

    createStorage(pubKey, private_key, hash, role) {
        localStorage.setItem("pubKey", pubKey);
        localStorage.setItem("privKey", private_key);
        localStorage.setItem("hash", hash);
        localStorage.setItem("role", role);
        var now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        localStorage.setItem("timestamp", now.getTime());
    }

    uploadFile(e) {
        e.preventDefault();
        this.pwd = e.target.w_password.value;
        var file = e.target.files.value;
        var fileType = file.split('.').pop();
        if (this.pwd.length == 0) {
            alert("Password cannot be empty");
            return false;
        }
        var role = $("input[name=role]:checked").val();
        if (fileType == "json") {
            var reader = new FileReader();
            reader.onload = function(event) {
                var obj = JSON.parse(event.target.result);
                var pwd = this.util.getHash(this.pwd);
                this.createStorage(obj.public_key, obj.private_key, pwd, role);
                this.setState({
                    pubKey: obj.public_key,
                    priKey: obj.private_key,
                    hash: pwd,
                    fileread: true,
                    message: "Your login as " + role + " is successful",
                    role: role
                });
                this.props.loginHandler(this.state);
            }.bind(this);
            reader.readAsText(e.target.files.files[0]);
        } else {
            alert("Unknown file format ! We support only JSON");
        }
    }

    onResponse(result) {
        if (!$.isPlainObject(result)) {
            var data = JSON.parse(result);
        } else
            var data = result;
        if (data.messages) {
            var msgs = data.messages;
            this.setState({coid: msgs});
            if (msgs.length > 0) {
                for (var i = 0; i < msgs.length; i++) {
                    if (msgs[i].read_status == false) {
                        this.setState({notify: true});
                    }
                }
            }

        }
    }

    render() {
        var cssClass = 'hidden';
        if (this.state.fileread)
            cssClass = 'show';
        return (
            <div className="panel panel-default">
                {this.props.message
                    ? <div className="alert alert-success">{this.props.message}</div>
                    : null}
                {this.state.message
                    ? <div className="alert alert-success">{this.state.message}</div>
                    : null}
                <div className="panel-heading">Upload your Keystore file to Login to your Wallet</div>
                <div className="panel-body">
                    {this.state.notify
                        ? <Notify/>
                        : null}
                    <form action="" method="post" encType="multipart/form-data" id="js-upload-form" onSubmit={this.uploadFile}>
                        <div className="form">
                            <div className="form-group">
                                <label htmlFor="files">Key Store File</label>
                                <input type="file" name="files" id="js-upload-files"/>
                                <span className="help-block">JSON(.json) file format only supported</span>
                            </div>
                            <div className="form-group">
                                <div className="radio-inline">
                                    <label>
                                        <input type="radio" name="role" defaultValue="requester" defaultChecked="true"/>
                                        Data Requester
                                    </label>
                                </div>
                                <div className="radio-inline">
                                    <label>
                                        <input type="radio" name="role" defaultValue="owner"/>
                                        Data Owner
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="w_password">Enter your password</label>
                                <input className="form-control" type="password" name="w_password" id="w_password"/>
                            </div>
                            <br/>
                            <button type="submit" className="btn btn-sm btn-primary" id="js-upload-submit">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
          );
      }
  }

  export default UploadKeyStore;
