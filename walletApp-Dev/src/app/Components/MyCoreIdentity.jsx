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
                myContractAddress: "BC3229FA258C55910B71D2955A8EEB492C712E2F",
                myCoidEndpoint: "MyCOID/myTokenAmount",
                controllerTokenEndpoint: "MyCOID/getControllerTokens",
                controllerListEndpoint: "MyCOID/getControllerList",
                twinURL: twinUrl,

                myTokenAmount: {},
                //amount: 3,
                
                //***************************************************************************************************************
                //USED IN TOKEN CLASSESS for appending (appendInputControllers and appendInputOwners)
                inputs_control: ['input1-0'], //the mapping of added controllers and their tokens
                inputs_ownership: ['input1-0'], //the mapping of added owners and their tokens
                
                //these 4 state vars are utilized in prepareControlTokenDistribution() and prepareOwnershipTokenDistribution()
                control_id: [],
                owner_id: [],
                owner_token_quantity: [],
                control_token_quantity: [],
                //***************************************************************************************************************
                
                //these 2 state vars are populated by AJAX requests to MyCOID_dev.js
                controllers: [],
                tokens: [],
                

                //remove_controller: [],
                //remove_owner: [],

                showModal: false,
                testList: ["first_person", "second_person", "third_person"],
                testValues: ["val1","val2","val3"]
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

    //is called by prepareControlTokenDistribution()
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

    Create2DArray(rows) {
        var arr = [];

        for (var i = 0; i < rows; i++) {
            arr[i] = [];
        }

        return arr;
    }

    prepareControllers(){
        var output = []
        create2DArray(output)
        var controllers = this.state.testList
        var tokens = this.state.testValues
        for(var i=0; i<controllers.length; i++){
            output.push(controllers[i],tokens[i])
        }
        console.log("output: " + output)
        
        
    }
    

    //************************************************************************
    //Invoke this code immediately after the component is mounted:
    //************************************************************************
    componentWillMount() {

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

        //make a request for my token amount
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

                this.setState({ myTokenAmount: data });

            }.bind(this),
            complete: function () {
                // do something
            }

        })
        
        
        //GET CONTROLLERS TOKENS
        $.ajax({
            type: "POST",
            url: this.state.twinURL + this.state.controllerTokenEndpoint,
            data: requestData,
            success: function (result) {
                var res = result;
                if ($.type(result) != "object") {
                    res = JSON.parseJSON(result)
                }
                console.log("response from C.Token endpoint: " + JSON.stringify(res))
                this.setState({ tokens: res.Result });

            }.bind(this),
            complete: function () {

            }

        })

        //GET CONTROLLER LIST
        $.ajax({
            type: "POST",
            url: this.state.twinURL + this.state.controllerListEndpoint,
            data: requestData,
            success: function (result) {
                var res = result;
                if ($.type(result) != "object") {
                    res = JSON.parseJSON(result)
                }
                console.log("response from C.List endpoint: " + JSON.stringify(res))
                this.setState({ controllers: res.Result });
                console.log("controller_list state var: " + JSON.stringify(this.state.controller_list))

            }.bind(this),
            complete: function () {

            }

        })
        
        
    }

    render() {

        //var controlLen = this.state.control_id.length
        //var ownerLen = this.state.owner_id.length
        //console.log(controlLen)
        
        var rows = []



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
        return (
            <div id="MyCOIDContainer">
                <h1>My Core Identity {this.state.twinUrl}</h1>
                <form method="POST" id="MyCOID" role="form">
                    <div className="form-group">
                        <label htmlFor="myControlAmount">Your current Ownership Token Amount is: {this.state.myTokenAmount.Result}</label>
                    </div>
                </form>
                
                <div className="modal-body">
                    <table className="table table-striped table-hover" style={style}>
                        <tbody>
                            <tr>
                            <td colSpan="3"><b>CONTROLLERS</b></td>
                            </tr>
                            
                            {(() => {
                                if (!$.isEmptyObject(localStorage.getItem("pubKey"))) {
                                    console.log("*****")
                                    return this.state.testList.map((ids, i) => {
                                        return (
                                            <tr key={i}>
                                                <td>{ids}</td>
                                                <td>{ids[0]}</td>
                                                <td><button type="button" className="btn btn-danger pull-right btn-sm" style={syle}> REMOVE </button></td>
                                            </tr>
                                        )
                                    });
                                    
                                } else { }

                            })(this) }
                            
                            
                            

                        </tbody>
                    </table>
                </div>
                
                
                <div className="form-group">
                    <label htmlFor="owner_dist">Add Owner:</label>
                    {this.state.inputs_ownership.map(input => <OwnerTokenDistributionForm handleShowModal={this.handleShowModal.bind(this) } min={this.state.subform_cont} max="10" key={input} labelref={input} />) }
                </div>
                <div className="form-group">
                    <div className="col-md-offset-6 col-md-6 ">
                        <p></p>
                        <button type="button" className="btn btn-info pull-right btn-sm" style={syle} onClick={this.appendInputOwners.bind(this) }>
                            <span className="glyphicon glyphicon-plus"></span>Add More
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="control_dist">Add Controller:</label>
                    {this.state.inputs_control.map(input => <ControlTokenDistributionForm handleShowModal={this.handleShowModal.bind(this) } min={this.state.subform_cont} max="10" key={input} labelref={input} />) }
                </div>
                <div className="form-group">
                    <div className="col-md-offset-6 col-md-6 ">
                        <p></p>
                        <button type="button" className="btn btn-info pull-right btn-sm" style={syle} onClick={this.appendInputControllers.bind(this) }>
                            <span className="glyphicon glyphicon-plus"></span>Add More
                        </button>
                    </div>
                </div>



            </div>

        );
    }

}
export default MyCoreIdentity;
