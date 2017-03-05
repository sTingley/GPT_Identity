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

    //takes in a msg and returns a signature (needed for requests)
    getSignature(msg) {
        var privKey = localStorage.getItem("privKey")
        var privKey1 = new Buffer(privKey, "hex");
        var msg_hash = keccak_256(JSON.stringify(msg));
        var msg_hash_buffer = new Buffer(msg_hash, "hex")
        let signature = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
        signature = JSON.parse(signature).signature;
        signature = JSON.stringify(signature);
        signature = JSON.parse(signature).data;
        signature = new Buffer(signature, "hex");
        signature = signature.toString("hex");
        return signature
    }

    //**********************************************************************
    // START CONTROLLER FUNCTIONS:

    getControllerValues() {
        let controller
        let controller_tokens
        var _this = this;
        $.each($("input[name^='pubkey_controller']"), function (obj) {
            var value = $.trim($(this).val())
            if (value.length > 0) {
                controller = value
            }
        })
        console.log("controller: " + controller)
        $.each($("input[name^='token_quantity']"), function (obj) {
            var value = $.trim($(this).val())
            if (value.length > 0) {
                controller_tokens = value
            }
        })
        console.log("tokens: " + controller_tokens)

        var arr = []
        arr.push(controller)
        arr.push(controller_tokens)

        return arr
    }

    requestUpdateController(e) {
        e.preventDefault()
        //FORMAT of control_dist = [pubkey, quantity]
        var control_dist = this.getControllerValues()
        console.log("control_dist: " + control_dist)

        var json = {}

        json.pubKey = localStorage.getItem("pubKey")
        json.address = localStorage.getItem("coidAddr")
        json.controller = control_dist[0]
        json.token_quantity = control_dist[1]

        var signature = this.getSignature(json)

        console.log("sig: " + signature)
        console.log(typeof (signature))

        //UNCOMMENT THESE LATER!!!!!!!!!!
        // json.sig = signature;
        // json.msg = msg_hash_buffer.toString("hex");

        json.sig = ""
        json.msg = ""

        console.log("JSON!! " + JSON.stringify(json))

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
    // END CONTROLLER UPDATE FUNCTIONS:
    //**********************************************************************



    //**********************************************************************
    // START RECOVERY UPDATE FUNCTIONS:

    getRecoveryParams() {
        let recoveryID
        let recoveryCondition
        var _this = this;

        $.each($("input[name^='recoveryID']"), function (obj) {
            var value = $.trim($(this).val())
            if (value.length > 0) {
                recoveryID = value
            }
            console.log("got recoveryID: " + recoveryID)
        })
        $.each($("input[name^='recoveryCondition']"), function (obj) {
            var value = $.trim($(this).val())
            if (value.length > 0) {
                recoveryCondition = value
            }
            console.log("got recoveryCondition: " + recoveryCondition)
        })

        var arr = []
        arr.push(recoveryID)
        if (recoveryCondition) { arr.push(recoveryCondition) }
        return arr
    }

    requestUpdateRecovery(e) {
        e.preventDefault()

        var json = {}
        json.pubKey = localStorage.getItem("pubKey")
        json.address = localStorage.getItem("coidAddr")

        var recoveryParams = this.getRecoveryParams()
        console.log("recovery arr: " + recoveryParams)

        if (recoveryParams.length > 1) {
            json.recoveryCondition = recoveryParams[1]
        }

        json.recoveryID = recoveryParams[0]

        var signature = this.getSignature(json)

        $.ajax({
            type: "POST",
            url: twinUrl + 'MyCOID/addRecoveryID',
            data: json,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                //get the array:
                data = data.Result;
                //DEBUGGING:
                console.log("addRecovery result: " + JSON.stringify(data));
                //data is: MYCOID.json

            }.bind(this),
        })

    }

    // END RECOVERY UPDATE FUNCTIONS:
    //**********************************************************************


    //**********************************************************************
    // START OFFICAL ID FUNCTIONS:

    //TODO: ADD THESE FUNCTIONS!!!!!!!!!!!! Grab entered values
    //WE ALSO NEED TO IMPORT THE IPFS CLASS

    // END OFFICIAL ID FUNCTIONS:
    //**********************************************************************


    componentDidMount() {
        // $("#assetDetails").modal('show');
        // $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);
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
                        <li role="presentation"><a href="#officalID" role="tab" data-toggle="tab">Official IDs</a></li>
                    </ul>
                </div>{/*END MODAL-HEADER*/}

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
                                <button type="button" className="btn btn-primary" onClick={this.requestUpdateController.bind(this)}><span className="glyphicon glyphicon-plus"></span>Update Control</button>
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
                                        <td><input name="recoveryID" className="form-control col-md-4" type="text" placeholder="Public Key of Recoverer" /></td>
                                    </tr>
                                    <tr>
                                        <td>Change recovery condition:</td>
                                        <td><input name="recoveryCondition" className="form-control col-md-4" type="text" placeholder="# of signatures required." /></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={this.requestUpdateRecovery.bind(this)}><span className="glyphicon glyphicon-plus"></span>Update Recovery Conditions</button>
                            </div>

                        </div>{/*tab-pane recovery*/}


                        <div role="tabpanel" className="tab-pane" id="officalID">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td colSpan="2"><b>Official IDs</b></td>
                                    </tr>
                                    {(() => {
                                        var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                        if (!$.isEmptyObject(prop)) {
                                            return prop.uniqueIdAttributes.map((ids, i) => {
                                                return (
                                                    <tr key={i}>
                                                        <td>{ids[0]}</td>
                                                        <td><p>File hash: {ids[1]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
                                                    </tr>
                                                )
                                            });
                                        } else {
                                            return <tr><td colSpan="2">No Ids found</td></tr>
                                        }
                                    })(this)}
                                </tbody>
                            </table>
                            <p>Need either 1) documents from digital twin or to import ipfs class</p>
                        </div>{/*tab-pane officialIDs*/}


                    </div>{/*tab-content*/}

                </div>{/*modal-body*/}

            </div>

        )
    }

}

Asset.propTypes = {
    hideHandler: React.PropTypes.func.isRequired	// hideHandler method must exists
};


/**************************************************************************
 * This class is the PARENT Component
 * componentWillMount method will populated nav bar tabs with DT assets
/*************************************************************************/
class Identities extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                pubKey: localStorage.getItem("pubKey"),
                own_assets: [], //populated from DT
                controlled_assets: [], //[populated from DT

                showDetails: false, //will be set true when user selects asset
                active_asset: {}, //passes active asset as prop to Asset class
            };

        //handleSelectAsset will be called anytime we select from the nav bar
        this.handleSelectAsset = this.handleSelectAsset.bind(this);
        //if this.state.showDetials is true, handleHideAsset is passed as a prop (hideHandler) to Asset class
        this.handleHideAsset = this.handleHideAsset.bind(this);
    }

    handleHideAsset() {
        this.setState({ showDetails: false, active_asset: {} });
    }

    //handle choice from asset navigation bar
    handleSelectAsset(asset) {
        var _this = this
        let assetID = asset.asset_id
        if (assetID) {
            _this.setState({ showDetails: true, active_asset: asset })
        }
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
                                console.log(JSON.stringify(theArray))
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
        //ADD THE CODE SO THAT MYCOID displays on the page by default?
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
                                                return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleSelectAsset(own)}>{own.asset_id}</a></li>
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
                                                return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleSelectAsset(ctrl)}>{ctrl}</a></li>
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

    }//render

}//class Identities


export default Identities;
