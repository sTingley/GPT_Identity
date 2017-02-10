import React, { Component } from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;



class Asset extends React.Component {
    constructor(props) {
        super(props)
        this.state = {

            asset: props.asset || {}
        }

    }

    componentDidMount() {
        // $("#assetDetails").modal('show');
        // $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);

    }

    getControllerValues(){
        let controller
        let controller_tokens
        var _this = this;
        $.each($("input[name^='pubkey_controller']"), function(obj){
            var value = $.trim($(this).val())
            if (value.length > 0){
                controller = value
            }
        })
        console.log("controller: " + controller)
        $.each($("input[name^='token_quantity']"), function(obj){
            var value = $.trim($(this).val())
            if (value.length > 0){
                controller_tokens = value
            }
        })
        console.log("tokens: " + controller_tokens)

        var arr = []
        arr.push(controller)
        arr.push(controller_tokens)

        return arr

    }

    updateController(e){
        e.preventDefault()

        //FORMAT of control_dist = [pubkey, quantity]
        var control_dist = this.getControllerValues()
        console.log("control_dist: " + control_dist)

        var json = {}

        json.pubKey = localStorage.getItem("pubKey")

        json.address = localStorage.getItem("coidAddr")

        json.controller = control_dist[0]

        json.token_quantity = control_dist[1]

        var privKey = localStorage.getItem("privKey")

        var privKey1 = new Buffer(privKey,"hex");
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash,"hex");
		var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
		
		signature1 = JSON.parse(signature1).signature;
		signature1 = JSON.stringify(signature1);
		signature1 = JSON.parse(signature1).data;
		signature1 = new Buffer(signature1,"hex");
		signature1 = signature1.toString("hex");
		
		console.log("sig" + signature1)
		console.log(typeof(signature1))
		
        //UNCOMMENT THESE LATER!!!!!!!!!!
		// json.sig = signature1;
		// json.msg = msg_hash_buffer.toString("hex");

        json.sig = ""
        json.msg = ""

        console.log("JSON!! "+ JSON.stringify(json))

        $.ajax({
            type: "POST",
            url: twinUrl + 'MyCOID/addController',
            data: json,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                //get the array:
                data = data.Result;
                //DEBUGGING:
                console.log("addController result: " + JSON.stringify(data));
                //data is: MYCOID.json

            }.bind(this),
        })

    }

    render() {

        var syle = {
            marginRight: '15px'
        }
        var style = {
            fontSize: '12.5px'
        }

        var prop = this.props.asset.asset_name;

        //console.log("asset form state: " + JSON.stringify(this.state))
        //console.log("asset form props: " + JSON.stringify(this.props))
        return (
            <div className="container">
                {this.props.asset.asset_id}

                <div className="modal-header">
                    <ul className="nav nav-pills" role="tablist">
                        <li role="presentation" className="active"><a href="#controllers" role="tab" data-toggle="tab">Control</a></li>
                        <li role="presentation"><a href="#recovery" role="tab" data-toggle="tab">Recovery</a></li>
                    </ul>
                </div>

                <div className="modal-body">

                    <div className="tab-content">

                        <div role="tabpanel" className="tab-pane active" id="controllers">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td><b>Control ID List</b></td>
                                        <td>
                                            {(() => {
                                                if (!$.isEmptyObject(prop)) {
                                                    return prop.controlIdList.map((ids, i) => {
                                                        return <p key={i}> {prop.controlIdList[i]}</p>
                                                    })
                                                }
                                            })(this)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Add a controller:</td>
                                        <td><input name="pubkey_controller" className="form-control col-md-4" type="text" placeholder="Public Key of Controller" /></td>
                                    </tr>
                                    <tr>
                                        <td>Control token to be given:</td>
                                        <td><input name="token_quantity" className="form-control col-md-4" type="text" placeholder="Token Quantity" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={this.updateController.bind(this)}><span className="glyphicon glyphicon-plus"></span>Update Control</button>
                        </div>


                        </div>{/*tab-pane controllers*/}



                        <div role="tabpanel" className="tab-pane" id="recovery">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td>Recovery IDs</td>
                                        <td>{(() => {
                                            if (!$.isEmptyObject(prop)) {
                                                return prop.identityRecoveryIdList.map((ids, i) => {
                                                    return <p key={i}> {prop.identityRecoveryIdList[i]}</p>
                                                })
                                            }
                                        })(this)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Recovery Condition</td>
                                        <td><p>{prop.recoveryCondition}</p></td>
                                    </tr>
                                    <tr>
                                        <td>Add a recovery ID:</td>
                                        <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key" /></td>
                                    </tr>
                                    <tr>
                                        <td>Change recovery condition:</td>
                                        <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="# of signatures required" /></td>
                                    </tr>
                                </tbody>
                            </table>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary"><span className="glyphicon glyphicon-plus"></span>Update Recovery Conditions</button>
                        </div>

                        </div>{/*tab-pane recovery*/}


                    </div>{/*tab-content*/}

                </div>{/*modal-body*/}

            </div>

        )
    }

}

Asset.propTypes = {
    hideHandler: React.PropTypes.func.isRequired	// hideHandler method must exists
};

class Identities extends React.Component {

    constructor(props) {
        super(props);

        this.state =
            {
                pubKey: localStorage.getItem("pubKey"),
                showDetails: false,

                own_assets: [],
                controlled_assets: [],

                active_asset: {},

                testList: ["first_person", "second_person", "third_person"],
                testValues: ["val1", "val2", "val3"]
            };

        //event handlers
        this.handleAsset = this.handleAsset.bind(this);
        this.handleHideAsset = this.handleHideAsset.bind(this);

    }

    //************************************************************************
    //Invoke this code immediately before mounting occurs:
    //************************************************************************
    componentWillMount() {
        // -> -> -> START get OWNED assets -> -> ->
        $.ajax({
            type: "POST",
            url: twinUrl + 'getOwnedAssets',
            data: { "pubKey": localStorage.getItem("pubKey") },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                //get the array:
                data = data.data;
                //DEBUGGING:
                console.log("getOwnedAssets result: " + data);
                //data is: MYCOID.json

                if (data.length > 0) {
                    //loop through OWNED assets
                    for (let i = 0; i < data.length; i++) {
                        //AJAX each asset:
                        $.ajax({
                            type: "POST",
                            url: twinUrl + 'getAsset',
                            data: { "pubKey": localStorage.getItem("pubKey"), "flag": 0, "fileName": data[i] },
                            success: function (result) {
                                var dataResult = result;
                                if ($.type(result) != "object") {
                                    dataResult = JSON.parseJSON(result)
                                }
                                //***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
                                var theArray = this.state.own_assets;

                                console.log("length is: " + theArray.length) //get total number of owned assets
                                console.log(theArray)
                                theArray[theArray.length] = { asset_id: dataResult.assetID, asset_name: dataResult }
                                if (dataResult.assetID = "MyCOID")
                                    this.setState({ own_assets: theArray });

                            }.bind(this),
                            complete: function () {
                            },
                            //console.log(result)	
                        })
                    }//end for loop
                }
            }.bind(this),
        })
        // <- <- <- END get OWNED assets <- <- <-

        // -> -> -> START get CONTROLLED assets -> -> ->
        $.ajax({
            type: "POST",
            url: twinUrl + 'getControlledAssets',
            data: { "pubKey": localStorage.getItem("pubKey") },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }

                //get the array:
                data = data.data;
                //debugging:
                console.log("Get Controlled Assets result: " + data);

                if (data.length > 0) {
                    //loop through OWNED assets
                    for (let i = 0; i < data.length; i++) {
                        //AJAX each asset:
                        $.ajax({
                            type: "POST",
                            url: twinUrl + 'getAsset',
                            data: { "pubKey": localStorage.getItem("pubKey"), "flag": 1, "fileName": data[i] },
                            success: function (result) {
                                var dataResult = result;
                                if ($.type(result) != "object") {
                                    dataResult = JSON.parseJSON(result)
                                }
                                //***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
                                this.setState({ controlled_assets: [{ asset_id: dataResult.assetID, asset_name: dataResult }] });

                            }.bind(this),
                            complete: function () {
                            },
                            //console.log(result)	
                        })
                    }//end of for loop
                }
            }.bind(this)
        })
        // <- <- <- END get CONTROLLED assets <- <- <-

    }//componentWillMount()

    //************************************************************************
    //Invoke this code immediately after mounting occurs:
    //************************************************************************
    componentDidMount() {
        //TODO:
        //ADD THE CODE SO THAT MYCOID displays on the page
    }

    handleHideAsset() {
        this.setState({ showDetails: false, active_asset: {} });
    }

    //handle choice from nav bar
    handleAsset(asset) {
        var _this = this
        let assetID = asset.asset_id
        if (assetID) {
            console.log("should be inside here")
            _this.setState({ showDetails: true, active_asset: asset })
        }
    }


    ShowOwned(input) {

        if (input == "MyCOID") {
            //this.setState({active_asset: })
            //$('.CONTROLLED').hide()
            console.log("got myCOID")
        }
    }



    render() {

        var inputAttrs = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "use comma(,) to add multiple values",
                style: { width: '30%' }
            }
        };
        var syle = {
            marginRight: '10px'
        }
        var style = {
            fontSize: '12.5px'
        }

        //replace with owned assets
        var controlled = ["iPad", "BMW"]

        return (


            <div id="MyCOIDContainer">

                <h1>Identity Utility</h1><hr />

                <div className="modal-content">

                    <div className="modal-header" role="navigation">
                        <ul className="nav nav-tabs">
                            {/*<li role="presentation" className="active"><a onClick={this.HandleOwnedAsset(own)}>My COID</a></li>*/}

                            <li role="presentation" className="dropdown active">
                                <a className="dropdown-toggle" data-toggle="dropdown" role="button">
                                    Owned <span className="caret"></span></a>
                                <ul className="dropdown-menu">
                                    {(() => {
                                        {/* POPULATE the owned assets, */ }
                                        if (this.state.own_assets.length > 0) {
                                            return this.state.own_assets.map((own, i) => {
                                                return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleAsset(own)}>{own.asset_id}</a></li>
                                            })
                                        }
                                        else { return <li>None</li> }
                                    })(this)}
                                </ul>
                            </li>
                            <li role="presentation" className="dropdown">
                                <a className="dropdown-toggle" data-toggle="dropdown" role="button">
                                    Controlled <span className="caret"></span></a>
                                <ul className="dropdown-menu">
                                    {(() => {
                                        {/* POPULATE the controlled assets, */ }
                                        if (controlled.length > 0) {
                                            return controlled.map((ctrl, i) => {
                                                return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleAsset(ctrl)}>{ctrl}</a></li>
                                            })
                                        }
                                        else { return <li>None</li> }
                                    })(this)}
                                </ul>
                            </li>

                            <li role="presentation"><a href="#/identityDimension">Identity Dimensions</a></li>
                        </ul>{/*end 'nav nav-tabs' class*/}

                    </div>{/*END MODAL-HEADER*/}


                    <div className="modal-body">

                        {this.state.showDetails ? <Asset hideHandler={this.handleHideAsset} asset={this.state.active_asset} /> : null}

                    </div>{/*END MODAL-BODY*/}


                </div>{/*END MODAL-CONTENT*/}



            </div>

        );
    }

}

export default Identities;


                        // <div id="OWNED" className="tab-pane fade">
                        //     <p>PUT COID ON HERE AS DEFAULT, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                        // </div>