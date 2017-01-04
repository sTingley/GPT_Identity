import React, {Component} from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
//import DropDown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown'
import SimpleTable from 'react-simple-table'
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;

//TODO:
//PUT CONTRACT ADDRESS IN LOCAL STORAGE
//MAKE SURE PUBKEY, PRIVKEY IN LOCAL STORAGE

//QUESTION: SHOULD WE READ THE ENDPOINT BASED ON A BUTTON CLICK and put it in this.state?
//SO it will be set in another function?


class ControlTokenDistributionForm extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            controltoken_quantity: [],
            controltoken_list: [],
            showModal: false
        };

        this.MAX = 10;
        //this.onFieldChange = this.onFieldChange.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
    }
    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }
    render() {
        var style = {
            fontSize: '12.5px'
        }
        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <table className="table table-striped table-hover" style={style}>
                        <tbody>
                            <tr>
                                <th><b>Public Key of Controller</b></th>
                                <th><b>Control Token Quantity</b></th>
                            </tr>
                            <tr>
                                <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Controller"  /></td>
                                <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity"  /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
};

class OwnerTokenDistributionForm extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            ownertoken_quantity: [],
            ownertoken_list: [],
            showModal: false
        };

        this.MAX = 10;
        //this.onFieldChange = this.onFieldChange.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
    }
    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }
    render() {
        var style = {
            fontSize: '12.5px'
        }
        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <table className="table table-striped table-hover" style={style}>
                        <tbody>
                            <tr>
                                <th><b>Public Key of Owner</b></th>
                                <th><b>Ownership Token Quantity</b></th>
                            </tr>
                            <tr>
                                <td><input name={'label2-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Owner"  /></td>
                                <td><input name={'label2-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Ownership Token Quantity"  /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
};







class MyCoreIdentity extends React.Component {
    constructor(props) {
        super(props);

        this.state =
            {
                pubKey: localStorage.getItem("pubKey"),
                myContractAddress: "AA8EEA027ADD908040574442FBC259FB5546D28C",
                myCoidEndpoint: "MyCOID/myTokenAmount",
                controllerEndpoint: "MyCOID/getControllers",
                twinURL: twinUrl,
                requestResult: {},
                //amount: 3,
                inputs_control: ['input1-0'], //the mapping of added controllers and their tokens
                inputs_ownership: ['input1-0'], //the mapping of added owners and their tokens

                control_id: [],
                owner_id: [],
                owner_token_quantity: [],
                control_token_quantity: [],

                remove_controller: [],
                remove_owner: [],

                showModal: false,

            };

        //event handlers
        this.MAX = 10;
        this.onFieldChange = this.onFieldChange.bind(this);
    }

    //this is for getting data entered into the tags into the state.
    onFieldChange(inputField, e) {
        var multipleValues = {};
        multipleValues[inputField] = e;
        this.setState(multipleValues);
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }

    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }


    //************************************************************************
    // FUNCTIONS TO PREPARE THE CONTROLLERS
    //************************************************************************

    //used in token form class for control token distribution list.. is called by appendInputControllers()
    getLabelValuesController() {
        var labelVals1 = []
        $.each($("input[name^='label1-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals1.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label1-", "")]: value
                });
            }
            console.log("obj: " + JSON.stringify(obj))
        });
        return labelVals1;
    }

    prepareControlTokenDistribution() {
        var labels = this.getLabelValuesController();
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                this.state.control_id.push(labels[i][key]);
                this.state.control_token_quantity.push(labels[i + 1][key]);
            }
        }
        console.log("controller_ID: " + JSON.stringify(this.state.control_id))
		console.log("controller_token_quantity: " + JSON.stringify(this.state.control_token_quantity))
    }

    //called onClick of add controller button
    appendInputControllers() {
        var inputLen = this.state.inputs_control.length;
        console.log("controller list length: " + inputLen)
        if (inputLen < this.MAX) {
            var newInput1 = `input1-${inputLen}`;
            this.setState({ inputs_control: this.state.inputs_control.concat([newInput1]) });
        }
    }


    //************************************************************************
    // FUNCTIONS TO PREPARE THE OWNERS
    //************************************************************************

    //used in token form class for control token distribution list.. is called by appendInputOwners()
    getLabelValuesOwner() {
        var labelVals2 = []
        $.each($("input[name^='label2-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals2.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label2-", "")]: value
                });
            }
            console.log("obj: " + JSON.stringify(obj))
        });
        return labelVals2;
    }

    prepareOwnershipTokenDistrbution() {
        var labels = this.getLabelValuesOwner();
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                this.state.owner_id.push(labels[i][key]);
                this.state.owner_token_quantity.push(labels[i + 1][key]);
            }
        }
        console.log("owner_ID: " + JSON.stringify(this.state.owner_id))
        console.log("owner_token_quantity: " + JSON.stringify(this.state.owner_token_quantity))
    }

    //called onClick of add owner button
    appendInputOwners() {
        var inputLen = this.state.inputs_ownership.length;
        console.log("ownerlist length: " + inputLen)
        if (inputLen < this.MAX) {
            var newInput2 = `input1-${inputLen}`;
            this.setState({ inputs_ownership: this.state.inputs_ownership.concat([newInput2]) });
        }
    }


    //************************************************************************
    //REMOVE A CONTROLLER
    //************************************************************************
    removeOwnersClick() {

    }

    //************************************************************************
    //REMOVE A CONTROLLER
    //************************************************************************
    removeControllersClick() {

    }

    //************************************************************************
    //Invoke this code immediately after the component is mounted:
    //************************************************************************
    componentWillMount() {
        

        //generate their signature:
        //(note: we have them sign the coid endpoint)

        // var privKey = localStorage.getItem("privKey");
        // var privKey1 = new Buffer(privKey,"hex");
        // var msg = this.state.myCoidEndpoint;
        // var msg_hash = keccak_256(msg);
        // var msg_hash_buffer = new Buffer(msg_hash,"hex");
        // var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
        // signature1 = JSON.parse(signature1).signature;
        // signature1 = JSON.stringify(signature1);
        // signature1 = JSON.parse(signature1).data;
        // signature1 = new Buffer(signature1,"hex");
        // signature1 = signature1.toString("hex");

        var msg = "abc"
        var signature1 = "abc"

        //prepare request data:
        var requestData =
            {
                "owner": this.state.pubKey,
                "address": this.state.myContractAddress,
                "msg": msg,
                "sig": signature1
            }
        
        
        $.ajax({
            type: "POST",
            url: this.state.twinURL + this.state.controllerEndpoint,
            data: requestData,
            success: function (result) {
                var res = result;
                if($.type(result) != "object") {
                    res = JSON.parseJSON(result)
                }
                console.log(JSON.stringify(res))
                this.setState({ requestResult: data });
                
            }.bind(this),
            complete: function () {
                
            }
            
        })
        
        //make a request for the 
        $.ajax({
            type: "POST",
            url: this.state.twinURL + this.state.myCoidEndpoint,
            data: requestData,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                    
                }

                //log it for testing
                console.log(JSON.stringify(data))

                this.setState({ requestResult: res });

            }.bind(this),
            complete: function () {
                // do something
            }
            
        })
    }

    render() {
        
        var controlLen = this.state.control_id.length
        var ownerLen = this.state.owner_id.length
        console.log(ownerLen)
        
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
        return (
            <div id="MyCOIDContainer">
                <h1>My Core Identity {this.state.twinUrl}</h1>
                <form method="POST" id="MyCOID" role="form">
                    <div className="form-group">
                        <label htmlFor="myControlAmount">Your current Ownership Token Amount is: {this.state.requestResult.Result}</label>
                    </div>
                </form>
                <div className="form-group">
                    <label htmlFor="owner_dist">Add Owner.</label>
                    {this.state.inputs_ownership.map(input => <OwnerTokenDistributionForm handleShowModal={this.handleShowModal.bind(this) } min={this.state.subform_cont} max="10" key={input} labelref={input} />) }
                </div>
                <div className="form-group">
                    <div className="col-md-offset-6 col-md-6 ">
                        <p></p>
                        <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInputOwners.bind(this) }>
                            <span className="glyphicon glyphicon-plus"></span>Add More
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="control_dist">Enter Controllers and their control token(s).</label>
                    {this.state.inputs_control.map(input => <ControlTokenDistributionForm handleShowModal={this.handleShowModal.bind(this) } min={this.state.subform_cont} max="10" key={input} labelref={input} />) }
                </div>
                <div className="form-group">
                    <div className="col-md-offset-6 col-md-6 ">
                        <p></p>
                        <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInputControllers.bind(this) }>
                            <span className="glyphicon glyphicon-plus"></span>Add More
                        </button>
                    </div>
                </div> 
                <div className="form-group">
                    <label htmlFor="remove_owner">Remove Owner(s) </label>
                    <TagsInput {...inputAttrs} value={this.state.remove_owner} onChange={(e) => { this.onFieldChange("remove_owner", e) } } />
                </div>
                <div className="form-group">
                    <div className="txt-right">
                        <p></p>
                        <button type="button" className="btn btn-secondary pull-right" style={syle} onClick={this.removeOwnersClick.bind(this) }>
                            <span className="glyphicon glyphicon-minus"></span>Remove
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="remove_controller">Remove controller(s) </label>
                    <TagsInput {...inputAttrs} value={this.state.remove_controller} onChange={(e) => { this.onFieldChange("remove_controller", e) } } />
                </div>
                <div className="form-group">
                    <div className="txt-right">
                        <p></p>
                        <button type="button" className="btn btn-secondary pull-right" style={syle} onClick={this.removeControllersClick.bind(this) }>
                            <span className="glyphicon glyphicon-minus"></span>Remove
                        </button>
                    </div>
                </div>

            </div>

        );
    }

}
export default MyCoreIdentity;
