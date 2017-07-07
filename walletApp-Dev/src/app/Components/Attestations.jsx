import React from 'react';
import DayPicker from "react-day-picker";
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;
function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = [];
    for (var n = 0; n < hex.length; n += 1) {
        str.push(String.fromCharCode(parseInt(hex.substr(n, 2), 16)));
    }
    return str;
}
class ModalWin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            proposal: this.props.dataHandler,
            proposal_data: {},
            selectedDay: new Date() //for signature expiration
        };
    }
    submitHandler(e) {
        e.preventDefault();
        var ele = $(e.target);
        //get private key from local storage
        var privKey = localStorage.getItem("privKey");
        //make private key hex buffer
        var privKey1 = new Buffer(privKey, "hex");
        //message is "vote_transaction"
        var msg = "vote_transaction"
        //get hash of message
        var msg_hash = keccak_256(msg);
        //make msg_hash a hex buffer
        var msg_hash_buffer = new Buffer(msg_hash, "hex");
        //sign the message
        var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
        //get json object with key "signature"
        signature1 = JSON.parse(signature1).signature;
        signature1 = JSON.stringify(signature1);
        //get json object with key "data" in side the json object with key "signature"
        signature1 = JSON.parse(signature1).data;
        //make the signature a buffer, then a string, to emit the commas
        signature1 = new Buffer(signature1, "hex");
        signature1 = signature1.toString("hex");
        //log for testing
        console.log("sig" + signature1)
        console.log(typeof (signature1))
        let day = this.state.selectedDay;
        let sigExpire = day.getTime() / 1000;
        var json = {
            txid: this.state.proposal.txid,
            pubKey: localStorage.getItem("pubKey"),
            sig: signature1,
            msg: msg_hash_buffer.toString("hex"),
            proposalId: this.state.proposal.proposal_id
        };
        console.log(JSON.stringify(json));
        if (parseInt(ele.attr("data-val")) == 2) {
            $.ajax({
                url: twinUrl + 'signature/revokeIca',
                type: 'POST',
                data: json,
                success: function (res) {
                    if (res.status == "Ok" && res.msg == "true") {
                    } else {
                        //alert("Unable to submit your vote. Please try again later");
                    }
                }
            });
        }
    }
    componentDidMount() {
        var _this = this;
        let propType = 2;
        console.log("propType: " + propType);
        var bigchainServer = 'http://10.101.114.230:5000'
        var endpoint = '/getTransaction/' + this.state.proposal.txid;
        //console.log("this.state.proposal: "+JSON.stringify(this.state.proposal));
        //onsole.log("getStuff: "+keccak_256(this.state.proposal.owner).toUpperCase() +"   "+ this.state.proposal.assetId+".json")
        $.ajax({
            type: "POST",
            url: twinUrl + 'getAsset',
            data: { "pubKey":  this.state.proposal.owner, "flag": 0, "fileName": this.state.proposal.assetId +".json" },
            success: function (result) {
                var dataResult = result;
                if ($.type(result) != "object") {
                    dataResult = JSON.parseJSON(result)
                }
                console.log("getasset result: "+result);
                console.log("getasset result: "+JSON.stringify(result));
                // assetData[assetData.length] = {
                //     asset_id: dataResult.assetID,
                //     asset_uniqueId: dataResult.uniqueId,
                //     asset_dimCtrlAddr: dataResult.dimensionCtrlAddr,
                //     asset_coidAddr: dataResult.coidAddr,
                //     asset_gatekeeperAddr: dataResult.gatekeeperAddr,
                //     asset_owners: dataResult.ownerIdList,
                //     asset_controllers: dataResult.controlIdList,
                //     asset_bigchainID: dataResult.bigchainID,
                //     asset_type: dataResult.propType
                // }
                _this.setState({
                    proposal_data: dataResult
                });
            }.bind(this),
            complete: function () { },
        })
        // $.ajax({
        //     type: "GET",
        //     url: bigchainServer + endpoint,
        //     data: {
        //     },
        //     success: function (result) {
        //         var fileValidation = true;
        //         result = result.asset.data.Coid_Data;
        //         console.log("BCDB: " + JSON.stringify(result))
        //         // Fill up data in Modal window
        //         //data.publicKey
        //         if ($.type(result) == "string") {
        //             result = JSON.parse(result);
        //         }
        //         var ownerArray = [];
        //         for (var i = 0; i < result.ownershipTokenQuantity.length; i++) {
        //             var temp = [];
        //             temp[0] = result.ownerIdList[i];
        //             temp[1] = result.ownershipTokenQuantity[i];
        //             ownerArray.push(temp)
        //         }
        //         result.ownerArray = ownerArray
        //         //console.log(result.ownerArray)
        //         console.log('result of getCoidData' + JSON.stringify(result));
        //         _this.setState({
        //             proposal_data: result
        //         });
                 $("#proposalDetails").modal('show');
                 $("#proposalDetails").on('hidden.bs.modal', _this.props.hideHandler);
                 let standardAsset = document.getElementById("standardAsset");
                 let KYC = document.getElementById("KYC");
        //         // if (propType == 2) {
                      //KYC.style.display = 'block';
                      //standardAsset.style.display = 'none';
        //         // } else {
                     KYC.style.display = 'none';
        //         //}
        //     }//end success
        // });
    }// end componentDidMount
    render() {
        var prop = this.state.proposal;
        console.log("this.state.proposal_data: " + JSON.stringify(this.state.proposal_data));
        //{"type":"proposal","proposal_id":"AAC312616FFE818CA093C9B34BB58DB26AFA7287C0B3DB689F9AAD337BE8C5B1",
        //"message":"You have been selected to vote on the proposal.","read_status":false,"time":1496256497368,
        //"gatekeeperAddr":"0000000000000000000000000000000000000000","isHuman":true}
        var style = {
            fontSize: '12.5px'
        }
        return (
            <div className="modal fade" id="proposalDetails" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 className="modal-title" id="asset">Revoke this asset?</h4>
                        </div>
                        <div id="standardAsset" className="modal-body">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td>Proposal ID</td>
                                        <td>{prop.proposal_id}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2"><b>Official IDs</b></td>
                                    </tr>
                                    {(() => {
                                        var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                        if (!$.isEmptyObject(this.state.proposal_data)) {
                                            return this.state.proposal_data.uniqueIdAttributes.map((ids, i) => {
                                                return (
                                                    <tr key={i}>
                                                        <td>{ids[0]}</td>
                                                        <td><p>File hash: {ids[2]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url + "/" + ids[1]}>{ids[1]}</a></p></td>
                                                    </tr>
                                                )
                                            });
                                        } else {
                                            return <tr><td colSpan="2">No Ids found</td></tr>
                                        }
                                    })(this)}
                                    <tr>
                                        <td>Ownership ID</td>
                                        <td>{this.state.proposal_data.ownershipId}</td>
                                    </tr>
                                    <tr>
                                        <td>Ownership ID List</td>
                                        <td>
                                            {(() => {
                                                if (!$.isEmptyObject(this.state.proposal_data)) {
                                                    return this.state.proposal_data.ownerIdList.map((ids, i) => {
                                                        return <p key={i}> {this.state.proposal_data.ownerIdList[i]}</p>
                                                    })
                                                }
                                                else {
                                                    return <p>No Ids found</p>
                                                }
                                            })(this)}
                                        </td>
                                    </tr>
                                    
                                </tbody>
                            </table>
                        </div>
                        <div id="KYC" className="modal-body">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td>Proposal ID</td>
                                        <td>{prop.proposal_id}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" data-val="2" onClick={this.submitHandler.bind(this)}>Yes</button>
                            <button type="button" className="btn btn-default" data-val="1" onClick={this.submitHandler.bind(this)}>No</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
};
class Attestations extends React.Component {
    constructor(props) {
        super(props);
        //coid=proposals
        this.state = {
            coid: [], //array of messages from DT
            showDetails: false,
            activeProposal: {}
        };
        this.showHandler = this.showHandler.bind(this);
    }
    getDateFormat(timestamp) {
        var d = new Date(timestamp);
        return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    }
    componentDidMount() {
        $.ajax({
            url: twinUrl + "signature/readAttestation/" + keccak_256(localStorage.getItem("pubKey")).toUpperCase(),
            dataType: 'json',
            cache: false,
            success: function (result) {
                console.log("result: " + JSON.stringify((result)));
                if (typeof (result) != "object") {
                    //if(true){
                    var data = JSON.parse(result);
                    console.log("TOVOTE needs else brackets?" + localStorage.getItem("pubKey"));
                } else {
                    var data = result;
                    //var test = JSON.parse((result.data));
                    //test = JSON.parse(JSON.stringify(test.messages));
                    console.log("data.coid: " + JSON.stringify(data));
                }
                this.setState({ coid: data.data.coid });
                console.log("ToVote state: " + JSON.stringify(this.state))
                console.log("result: " + JSON.stringify((result.data)));
            }.bind(this)
        });
    }
    hideHandler() {
        this.setState({ showDetails: false });
    }
    //assigns entire COID to activeProposal, 
    dataHandler(index) {
        return this.state.coid[index];
    }
    // getActiveData() {
    //  return this.state.activeProposal;
    // }
    showHandler(e) {
        e.preventDefault();
        this.setState({
            showDetails: true,
            activeProposal: this.dataHandler($(e.target).attr('data-index'))
        });
    }
    render() {
        console.log("STATE: " + JSON.stringify(this.state));
        var _that = this;
        return (
            <div id="vote_container">
                <h1>Assets you have attested to</h1> <hr />
                <table className="table table-striped">
                    <tbody>
                        {(() => {
                            if ($.isArray(this.state.coid) && this.state.coid.length > 0) {
                                return this.state.coid.map(function (el, i) {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <div><b>Proposal ID: </b>{el.proposal_id}</div>
                                                <div><b>Published On: </b>{_that.getDateFormat(el.time)}</div>
                                            </td>
                                            <td className="pull-right">
                                                <button type="button" title="View proposal to vote" data-item={el} data-index={i} onClick={_that.showHandler} className="btn btn-primary">Revoke Signature</button>
                                            </td>
                                        </tr>
                                    );
                                });
                            } else {
                                return (<tr>
                                    <td>
                                        <p>No attestations !</p>
                                    </td>
                                </tr>);
                            }
                        })(this)}
                    </tbody>
                </table>
                {this.state.showDetails ? <ModalWin hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeProposal} /> : null}
            </div>
        )
    }
};
export default Attestations;