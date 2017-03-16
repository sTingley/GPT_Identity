import React, { Component } from 'react';
import TagsInput from 'react-tagsinput';
import UploadIpfsFile from './UploadIpfsFile.jsx'

class DimensionDelegationForm extends React.Component {

    constructor(props) {
        super(props)
        this.maxDelegations = this.props.max
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
                                <th><b>Public Key of Delegatee</b></th>
                                <th><b>Control Token Quantity</b></th>
                            </tr>
                            <tr>
                                <td><input name={'delegatee-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Delegatee" /></td>
                                <td><input name={'delegatee-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity" /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
};

class DimensionAttributeForm extends React.Component {

    constructor(props) {
        super(props)
        this.maxDelegations = this.props.max
    }
    render() {
        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <label htmlFor="unique_id_attrs"> Dimension Attributes e.g. "My college transcript", "Chase Bank KYC", or "My blockchain research". </label>
                    <input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Descriptor" />
                </div>
                <div className="col-md-2">
                    <button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
                </div>
            </div>
        );
    }
};

class DimensionForm extends Component {

    constructor(props) {
        super(props);

        this.state = {
            dimension: this.props.dataHandler,
            //dimension_data: {},
            selected: false,
            docs: {}, //takes same form as it does in Documents.jsx and CoreIdentity.jsx/MyGatekeeper.jsx
            pubkey: localStorage.getItem("pubKey"),
            delegations: ['input-0']
        };
    }

    //HANDLE THE CHOICE OF USER INPUT
    submitHandler(e) {

        e.preventDefault();
        var ele = $(e.target);
        var button_val = parseInt(ele.attr("data-val"))
        //*********************************************/
        let dimension = this.state.dimension.dimension
        const typeInput = dimension.dimensionName

        var json = {
            "publicKey": localStorage.getItem("pubKey"),
            "typeInput": typeInput,
            "flag": "0",
            "accessCategories": ""
        }

        //*********************************************************************
        // request to add dimension descriptor/attribute pair
        if (button_val === 1) {
            console.log("hit add descriptor rq")
            let descriptor

            $.each($("input[name^='descriptor']"), function (obj) {
                var value = $.trim($(this).val())
                if (value.length > 0) {
                    descriptor = value
                }
            })
            //descriptor, ex: 'financial history 1/2017'
            json.descriptor = descriptor

            $.ajax({
                url: twinUrl + 'addDimensionAttribute',
                type: 'POST',
                data: json,
                success: function (res) {
                    if (res.status == "Ok" && res.msg == "true") {
                        //var i_dimension = this.state.dimension.ID
                    }
                }
            });
        }//end if
        //*********************************************************************
        // request to add a delegation for a dimension (one or many descriptors)
        if (button_val === 2) {
            console.log("hit delegation rq")

            //checking if they want to delegate access to all attrs
            //this mean accessCategories (contract) will be null
            var x = $("#allAttrs").is(":checked");
            console.log("checkbox: " + x)

            if ($("#allAttrs").is(":checked")) {
                $('#accessCategories').hide();
            }

            let accessCategories = []

            //Getting the value (index) of selected access categories
            //the index represents the desriptor/attribute
            $('#accessCategories option:selected').each(function () {
                accessCategories.push($(this).val());
                //accessCategories now contains the selected indices
            });

            console.log("selectedCategories: " + accessCategories)

            accessCategories.forEach(function (element) {
                //console.log("got element: " + element)
                json.accessCategories += dimension.data[element].descriptor + ","
            })

            json.accessCategories = json.accessCategories.substring(0, json.accessCategories.length - 1)

            json.delegations = this.prepareDelegationDistribution(function(err){
                if(err){console.log("ERROR DELEGATIONS: " + err)}
            })

            json.owner = this.state.dimension.owner

            json.coidAddr = this.state.dimension.coidAddr
            json.dimensionCtrlAddr = this.state.dimension.dimensionCtrlAddr

            console.log("\n JSON body: " + JSON.stringify(json))
            // $.ajax({
            //     url: twinUrl + 'dimensions/addDelegation',
            //     type: 'POST',
            //     data: json,
            //     success: function (res) {
            //         if (res.status == "Ok" && res.msg == "true") {
            //             //var i_dimension = this.state.dimension.ID
            //         }
            //     }
            // });
        }
        //*********************************************************************

    }//end submitHandler

    //THIS METHOD IS THE CONSTRUCTOR
    componentWillMount() {

        $('#accessCategories').show();

        if ($("#allAttrs").is(":checked")) {
            this.state.selected = true
        }
        if (this.state.selected = true) {
            $('#accessCategories').hide();
        }

    }

    componentDidMount() {

        // this.setState({dimension_data: this.props.dimension});
        $("#dimension_Details").modal('show');
        $("#dimension_Details").on('hidden.bs.modal', this.props.hideHandler);

        // $.ajax({
        //     url: twinUrl + "ipfs/alldocs/" + this.state.pubKey,
        //     dataType: 'json',
        //     cache: false,
        //     success: function (resp) {
        //         this.setState({ docs: resp.data.documents });
        //     }.bind(this),
        //     error: function (xhr, status, err) {
        //         console.error(this.props.url, status, err.toString());
        //     }.bind(this)
        // });

    }

    /*****************************************************************************
 * SAME PROCESS TO ADD DELEGATIONS
 * 1) define getDelegationInputValues
 * 2) getDelegationInputValues inside prepareDelegationDistribution
*****************************************************************************/
    getDelegationInputValues() {
        var labelVals = []
        var _this = this;
        //in DimensionForm
        $.each($("input[name^='delegatee-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label-", "")]: value
                });
            }
        });
        return labelVals;
        //returns an object array: [{"delegatee-input1-0":"pubkey"},{"delegatee-input1-0":"2"}
    }
    //*****************************************************************************
    //prepare the delegations object array
    prepareDelegationDistribution() {
        var labels = this.getDelegationInputValues();
        console.log("labels: " + JSON.stringify(labels))
        let delegatee = []
        let delegatee_token_quantity = []
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                delegatee.push(labels[i][key]);
                delegatee_token_quantity.push(labels[i + 1][key]);
            }
        }
        let delegationsArray = []
        //{ owner: "", delegatee: "", amount: "", dimension: "", expiration: "", accessCategories: "" },
        if (delegatee.length == delegatee_token_quantity.length) {
            for (var i = 0; i < delegatee.length; i++) {
                var delegationObj = {}
                delegationObj.owner = "COID_OWNER"// EDIT!!!!!!!!!!
                delegationObj.delegatee = delegatee[i]
                delegationObj.amount = delegatee_token_quantity[i]
                delegationObj.accessCategories = ""
                delegationsArray.push(delegationObj)
            }
            console.log("delegationObj: " + JSON.stringify(delegationsArray))
        }
        return delegationsArray
    }
    //*****************************************************************************
    appendDelegation() {
        var inputLen = this.state.delegations.length;
        console.log("dimensionForm delegations length: " + inputLen)
        if (inputLen < 10) {
            var newInput1 = `input1-${inputLen}`;
            this.setState({ delegations: this.state.delegations.concat([newInput1]) });
        }
    }
    //*****************************************************************************
    //*****************************************************************************

    render() {
        //console.log("state in DimensionForm\n" + JSON.stringify(this.state))
        var dims = this.state.dimension

        var dataArray = []
        var arrayOfArrays = []
        let data = dims.dimension.data //data comes from _dimension.json object structure

        Object.keys(data).forEach(key => {
            dataArray.push(data[key].descriptor)
            dataArray.push(data[key].attribute)
            dataArray.push(data[key].flag)
            dataArray.push(data[key].ID)
        })

        //data.length will equal the number of dimensions
        for (var i = 0; i < data.length; i++) {
            var element = [dataArray[4 * i + 0], dataArray[4 * i + 1], dataArray[4 * i + 2], dataArray[4 * i + 3]]
            arrayOfArrays.push(element)
        }

        // console.log("DataArray: " + dataArray)
        // console.log("arrayOfArrays[0][0]: " + arrayOfArrays[0][0])
        // console.log("arrayOfArrays[1][1]: " + arrayOfArrays[1][1])

        var controllers = dims.dimension.controllers

        var syle = {
            marginRight: '15px'
        }
        var center = {
            textAlign: 'center'
        };

        return (
            <div className="modal fade" id="dimension_Details" key={dims.ID} tabIndex="-1" role="dialog" aria-labelledby="dimension">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
                            <ul className="nav nav-pills" role="tablist">
                                <li role="presentation" className="active"><a href="#dimensionDetails" role="tab" data-toggle="tab">Identity Dimension Details</a></li>
                                <li role="presentation"><a href="#control" role="tab" data-toggle="tab">Add Descriptor</a></li>
                                <li role="presentation"><a href="#delegations" role="tab" data-toggle="tab">Token Delegations</a></li>
                            </ul>
                        </div>

                        <div className="modal-body">
                            <div className="tab-content">

                                <div role="tabpanel" className="tab-pane active" id="dimensionDetails">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <td>Asset</td>
                                                <td>MyCOID</td>
                                            </tr>
                                            <tr>
                                                <td>Dimension Type</td>
                                                <td>{dims.dimension.dimensionName}</td>
                                            </tr>
                                            <tr>
                                                <td>Controller List</td>
                                                <td>{(() => {
                                                    if (!$.isEmptyObject(dims)) {
                                                        return controllers.map((ids, i) => {
                                                            return <p key={i}> {controllers[i]}</p>
                                                        })
                                                    }
                                                })(this)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="2"><b>Descriptors:</b></td>
                                            </tr>
                                            {(() => {
                                                var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                                if (arrayOfArrays.length > 0) {
                                                    return arrayOfArrays.map((attrs, i) => {
                                                        //console.log("attrs[0]: " + attrs[0] + ", attrs[1]:" + attrs[1] + ", attrs[2]: " + attrs[2] + ", attrs[3]: " + attrs[3])
                                                        if (attrs[1] && attrs[1].charAt(0) == "Q") {
                                                            return (
                                                                <tr key={i}>
                                                                    <td>{attrs[0]}</td>
                                                                    <td><p><a target="_blank" href={ipfs_url + "/" + attrs[1]}>{attrs[1]}</a></p></td>
                                                                </tr>
                                                            )
                                                        }
                                                        else
                                                            return (
                                                                <tr key={i}>
                                                                    <td>{attrs[0]}</td>
                                                                    <td><a>{attrs[1]}></a></td>
                                                                </tr>
                                                            )
                                                    });
                                                }
                                                else { return <tr><td colSpan="2">No descriptors found.</td></tr> }
                                            })(this)}
                                        </tbody>
                                    </table>
                                </div>{/*dimensionDetails*/}

                                <div role="tabpanel" className="tab-pane" id="control">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <th><b>Add Dimension Descriptor and Attribute</b></th>
                                            </tr>
                                            <tr>
                                                <td><input name="descriptor" className="form-control col-md-4" type="text" placeholder="descriptor name" /></td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div className="body">
                                        <form>
                                            <div className="form-group">
                                                <label htmlFor="get-hash">Choose from documents</label>
                                                <select className="form-control col-md-4" onChange={this.inputChangeHandler}>
                                                    <option value="0">Select Document</option>
                                                    {(() => {
                                                        if (this.state.docs && this.state.docs.length > 0) {
                                                            var i = 0;
                                                            return this.state.docs.map((obj) => {
                                                                i++;
                                                                var optsVal = obj.hash + "|" + obj.file_hash;
                                                                return <option value={optsVal} key={i}>{obj.filename}</option>
                                                            });
                                                        } else {
                                                            return <option value="0">-- Empty --</option>
                                                        }
                                                    })()}
                                                </select>
                                            </div>
                                            <p style={center}>(or)</p>
                                            <div className="form-group">
                                                <label htmlFor="documents">Upload Document</label>
                                                <input type="file" className="form-control" name="newdoc" onChange={this.inputChangeHandler} />
                                            </div>
                                        </form>
                                    </div>{/*body*/}

                                    <button type="button" className="btn btn-info" data-val="1" onClick={this.submitHandler.bind(this)}> Add descriptor</button>
                                </div>{/*control*/}

                                <div role="tabpanel" className="tab-pane" id="delegations">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <thead>
                                            <tr>
                                                <th>Tokens delegated for this dimension: 0</th>
                                            </tr>
                                        </thead>
                                        <hr />
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <label htmlFor="control_dist">Enter Delegations and their delegated control token(s).</label>
                                                    {this.state.delegations.map(input => <DimensionDelegationForm max="10" key={input} labelref={input} />)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendDelegation.bind(this)}>
                                                        <span className="glyphicon glyphicon-plus"></span>Add More</button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Expiration" /></td>
                                            </tr>
                                            <tr>
                                                <th><b>Delegate access to all attributes:</b></th>
                                            </tr>
                                            <tr>
                                                <td><input id="allAttrs" type="checkbox" />YES</td>
                                            </tr>
                                            <tr>
                                                <th><b>Access Categories (select 1 or many):</b></th>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <select id="accessCategories" className="selectpicker" multiple="multiple">
                                                        {(() => {
                                                            if (arrayOfArrays.length > 0) {
                                                                return arrayOfArrays.map((attrs, i) => {
                                                                    return (<option key={i} value={i}>{attrs[0]}</option>)
                                                                })

                                                            }
                                                        })(this)}
                                                    </select>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-info" data-val="2" onClick={this.submitHandler.bind(this)}>Delegate tokens</button>
                                </div>

                            </div>
                        </div>


                    </div>
                </div>
            </div>
        )
    }
}


class IdentityDimensions extends Component {

    constructor(props) {
        super(props);
        this.state = {

            pubKey: localStorage.getItem("pubKey"),

            //Dimensions pulled from DT
            iDimensions: [],
            ctrlDimensions: [],
            //prop dataHandler passes activeDimension to DimensionForm
            activeDimension: {},

            //inputs array is pushed when addimg DimensionAttributeForm instances
            inputs: ['input-0'],
            //as we add more Dimension attributes, we end up shifting tmpFile and inputs
            //tmp file always holds current input label, ex: 'input-0'
            tmpFile: '',
            //file_attrs will look like: [ {input-0: IPFS_hash0}, {input-1: IPFS_hash1} ]
            file_attrs: [],

            //delegations array is pushed if 'addMore' is clicked
            delegations: ['input1-0'],

            //contains actual asset data from DT
            control_assets: [],
            controlled_assets_label: [],
            own_assets: [],
            owned_assets_label: [],

            showModal: false,

            showDetails: false,

            //Controllers for dimension (not necessarily COID controllers)
            control_list: []

        };
        this.showDimensionHandler = this.showDimensionHandler.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
        this.onFieldChange = this.onFieldChange.bind(this);

    }
    //*****************************************************************************
    //watch for inputs on control_list
    onFieldChange(inputField, e) {
        var multipleValues = {};
        multipleValues[inputField] = e;
        this.setState(multipleValues);
    }
    //*****************************************************************************
    hideHandler() {
        this.setState({ showDetails: false });
    }
    //*****************************************************************************
    //used to show activeDimension, is fired onClick
    showDimensionHandler(e) {
        e.preventDefault();
        this.setState({
            showDetails: true,
            activeDimension: this.dataHandler($(e.target).attr('data-index'))
        });
    }
    //*****************************************************************************
    //used to set activeDimension inside showDimensionHandler
    //When we render a DimensionForm, dataHandler={this.state.activeDimension}
    dataHandler(index) {
        return this.state.iDimensions[index];
    }
    //*****************************************************************************
    /*if this.state.showModal is true UploadIpfsFile component is rendered,
        and passed the prop dataHandler={this.getFileDetails.bind(this)}*/
    getFileDetails(filedata) {
        var obj = { [this.state.tmpFile]: filedata };
        this.setState({ file_attrs: this.state.file_attrs.concat([obj]) });
    }
    //*****************************************************************************
    //Passed as a prop to DimensionAttributeForm
    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }
    //is passed to UploadIpfsFile so it knows when to close the modal window
    //method also exists in DimensionForm
    handleHideModal() {
        this.setState({ showModal: false });
    }
    //*****************************************************************************
    // Get DT Dimension Data. Call this in componentWillMount
    getDimensions() {

        //MyCOID.json
        let dimension1 = {}
        dimension1.dimension = {
            "dimensionName": "FINANCES",
            "pubkey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
            "coidAddr": "7924DBF02BE23923790C5D82F8A39925F516CA0F",
            "dimensionCtrlAddr": "2C6C1B0DA4B8001C0EE4A8E1ED4704643C372534",
            "ID": 3432423423,
            "address": "HEXSTRING_address",
            "owner": [],
            "controllers": ["c1", "c2"],
            "delegations": [
                { owner: "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055", delegatee: "d1", amount: "2", dimension: "", expiration: "thursday", accessCategories: "" },
                { owner: "A1", delegatee: "D1", amount: "2", dimension: "", expiration: "friday", accessCategories: "" }
            ],
            "data": [
                { "descriptor": "financial_FEB", "attribute": "QMfgsddfsdffsdfsdsdfsdf", flag: "0", ID: "4465" },
                { "descriptor": "financial_MARCH", "attribute": "Qmsdfsdfsdfsdfsdfsdfsdfsdf", flag: "0", ID: "3433" },
            ]
        }
        //HOME.json
        let dimension2 = {}
        dimension2.dimension = {
            "dimensionName": "EDUCATION",
            "pubkey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
            "coidAddr": "872EDE47AEBC33CAD4AF1B8DA861E78D8E99BC56",
            "dimensionCtrlAddr": "2C6C1B0DA4B8001C0EE4A8E1ED4704643C372534",
            "ID": 69696969,
            "address": "HEXSTRING_address",
            "owner": [],
            "controllers": ["c1", "c2"],
            "delegations": [
                { owner: "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055", delegatee: "D1", amount: "2", dimension: "", expiration: "thursday", accessCategories: "" },
            ],
            "data": [
                { "descriptor": "education_highschool", "attribute": "QMfgsddfsdffsdfsdsdfsdf", flag: "0", ID: "4465" },
                { "descriptor": "education_college", "attribute": "Qmsdfsdfsdfsdfsdfsdfsdfsdf", flag: "0", ID: "3433" },
            ]
        }

        var arry = []
        arry.push(dimension1)
        arry.push(dimension2)

        this.setState({ iDimensions: arry })

    }//end getDimensions

    componentWillMount() {

        this.getDimensions();
        //****************************************************** */

        if (localStorage.getItem("owned_assets")) {
            let owned_labels = []
            let own_assets = []

            let owned = localStorage.getItem("owned_assets")
            owned = JSON.parse(owned)

            //for loop is preparing arrays to set state vars 'own_assets' and 'owned_assets_label'
            for (var i = 0; i < owned.length; i++) {
                owned_labels.push(owned[i].asset_id)
                own_assets[own_assets.length] = owned[i]
            }
            this.setState({ own_assets: own_assets, owned_assets_label: owned_labels })
        }

        if (localStorage.getItem("controlled_assets")) {
            console.log("WE HAVE CONTROLLED ASSETS!!!!!")
            let controlled_labels = []//set this.state.controlled_assets_label
            let control_assets = []

            let controlled = localStorage.getItem("controlled_asets")
            controlled = JSON.parse(controlled)

            for (var i = 0; i < controlled.length; i++) {
                controlled_labels.push(controlled[i].asset_id)
                control_assets[control_assets.length] = controlled[i]
            }
            this.setState({ control_assets: control_assets, controlled_assets_label: controlled_labels })
        }


    }//componentWillMount

    /*****************************************************************************
    /*****************************************************************************
     * IN ORDER TO ADD DIMENSION ATTRIBUTES, we have these functions
     * 1) define getLabelValues
     * 2) call getLabelValues inside prepareAttributes (where we group descriptors and attributes)
     * (use appendAttribute to make sure max limit isnt hit) ????
    *****************************************************************************/
    //used for DimensionAttributeForm to prepare attributes
    getLabelValues() {
        var labelVals = []
        var _this = this;
        //in DimensionForm
        $.each($("input[name^='label-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label-", "")]: value
                });
            }
        });
        return labelVals;
    }
    /*file_attrs looks like: [{key: "IPFS_hash | shaHash}]
        [{"input-0":"QmPcY8sJ8hSfWhzqX8iLzQEbgiESjqTaeEEoJUrZwhLNk5|9bb7e24956771c4f1bbfe5eceff9e9e1457fafa5d3af3a56f4d7cef0bdd509dc"},
        {"input-1":"QmUJGfdKUCFiL2cKE3dcVFL5Q6PsvcWJSPxff5snJ46tuk|28a6ce8b3c55a60f5923cb87e5fd1c47decb973d1973f047f722141460fdad71"},]*/
    prepareAttributes() {
        var newArr = [],
            labels = this.getLabelValues();
        console.log("labelVals: " + JSON.stringify(labels))
        //labelVals: [{"input-0":"mydocument"},{"input-1":"seconddocument"}]
        for (var i = 0; i < labels.length; i++) {
            var tmpArr = [];
            for (var key in labels[i]) {
                tmpArr.push(labels[i][key]);
                let ipfsHash = this.state.file_attrs[i][key].split("|")
                ipfsHash = ipfsHash[0] //not sending sha hash
                tmpArr.push(ipfsHash);
                //console.log("tmpArray: " + tmpArr)
            }
            newArr.push(tmpArr);
        }
        return newArr;
    }
    //*****************************************************************************
    //when we click Add More, a new value is pushed into this.state.inputs,
    //and a new DimensionAttributeForm is rendered
    appendAttribute() {
        var inputLen = this.state.inputs.length;
        if (inputLen < 10) {
            var newInput = `input-${inputLen}`;
            this.setState({ inputs: this.state.inputs.concat([newInput]) });
            //inputs: input-0
        }
    }
    /*****************************************************************************
    /*****************************************************************************
     * SAME PROCESS TO ADD DELEGATIONS
     * 1) define getDelegationInputValues
     * 2) getDelegationInputValues inside prepareDelegationDistribution
    *****************************************************************************/
    getDelegationInputValues() {
        var labelVals = []
        var _this = this;
        //in DimensionForm
        $.each($("input[name^='delegatee-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label-", "")]: value
                });
            }
        });
        return labelVals;
        //returns an object array: [{"delegatee-input1-0":"pubkey"},{"delegatee-input1-0":"2"}
    }
    //*****************************************************************************
    //prepare the delegations object array
    prepareDelegationDistribution() {
        var labels = this.getDelegationInputValues();
        let delegatee = []
        let delegatee_token_quantity = []
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                delegatee.push(labels[i][key]);
                delegatee_token_quantity.push(labels[i + 1][key]);
            }
        }
        let delegationsArray = []
        //{ owner: "", delegatee: "", amount: "", dimension: "", expiration: "", accessCategories: "" },
        if (delegatee.length == delegatee_token_quantity.length) {
            for (var i = 0; i < delegatee.length; i++) {
                var delegationObj = {}
                delegationObj.owner = "COID_OWNER"// EDIT!!!!!!!!!!
                delegationObj.delegatee = delegatee[i]
                delegationObj.amount = delegatee_token_quantity[i]
                delegationObj.accessCategories = ""
                delegationsArray.push(delegationObj)
            }
            //console.log("delegationObj: " + JSON.stringify(delegationsArray))
        }
        return delegationsArray
    }
    //*****************************************************************************
    appendDelegation() {
        var inputLen = this.state.delegations.length;
        console.log("delegations length: " + inputLen)
        if (inputLen < 10) {
            var newInput1 = `input1-${inputLen}`;
            this.setState({ delegations: this.state.delegations.concat([newInput1]) });
        }
    }
    //*****************************************************************************
    //*****************************************************************************

    //called onClick of 'Create Dimension' button
    createDimension(e) {
        e.preventDefault();

        //let delegatee = $("input[name^='delegatee_addr']").val()

        let dimensionName = $("input[name^='dimensionName']").val()

        let attributes = this.prepareAttributes()
        console.log("attributes: " + attributes)

        var json = {}
        if (dimensionName) { json.dimensionName = dimensionName }
        json.pubKey = localStorage.getItem("pubKey")
        json.address = ""
        json.flag = 0
        json.ID = 0

        let selected_asset = $("#assetSelect option:selected").text()
        this.state.own_assets.forEach(function (asset, index) {
            if (selected_asset == asset.asset_id) {
                json.coidAddr = asset.asset_coidAddr,
                    json.dimensionCtrlAddr = asset.asset_dimCtrlAddr,
                    json.uniqueId = asset.asset_uniqueId,
                    json.owners = asset.asset_owners,
                    json.controllers = asset.asset_controllers
            }
        })

        json.delegations = this.prepareDelegationDistribution()

        var objArray = []
        for (var i = 0; i < attributes.length; i++) {
            let obj = {}
            obj.descriptor = attributes[i][0]
            obj.attribute = attributes[i][1]
            obj.flag = 0
            objArray.push(obj)
        }
        json.data = objArray

        console.log("JSON: " + JSON.stringify(json))

        $.ajax({
            type: "POST",
            url: twinUrl + 'dimensions/CreateDimension',
            data: json,
            success: function (result) {
                //returns (bool success, bytes32 callerHash, address test)
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                console.log("response createDimenson: " + JSON.stringify(data))

                data = data.Result
                console.log("data.Result: " + data.Result)

                data = data.split(",")
                console.log("DATA: " + data)

                //var dimensionAddr = data.Result[2]
                //console.log("created dimension address: " + dimensionAddr)

                //get the array:
                //data = data.data;

            }.bind(this),
            complete: function () {
                // do something
            },
        })

    }//end creationDimension

    //*****************************************************************************
    render() {

        var _that = this

        var syle = { marginRight: '15px' }

        var table = { margin: '0 auto' }

        var inputAttrs = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "use comma(,) to add multiple values",
                style: { width: '30%' }
            }
        };

        return (
            <div id="IDENTITYDIMENSIONS_MODAL">

                <h1>IDENTITY DIMENSIONS</h1><hr />
                <div className="modal-header">
                    <ul className="nav nav-tabs" role="tablist">
                        <li role="presentation" className="active"><a href="#dimensions" role="tab" data-toggle="tab">Dimensions</a></li>
                        <li role="presentation"><a href="#addDimension" role="tab" data-toggle="tab">Create new dimension</a></li>
                    </ul>
                </div>

                <div className="modal-body">

                    <div className="tab-content">

                        <div className="tabpanel" role="tabpanel" className="tab-pane active" id="dimensions"><br />

                            <div id="ownedDimensions">
                                <h5><b>My Owned Dimensions</b></h5> <hr />
                                <table style={table} className="table table-striped center">
                                    <tbody>
                                        {(() => {
                                            if ($.isArray(this.state.iDimensions) && this.state.iDimensions.length > 0) {
                                                return this.state.iDimensions.map(function (el, i) {
                                                    return (
                                                        <tr key={i}>
                                                            <td>
                                                                <a data-item={el.dimension} data-index={i} onClick={_that.showDimensionHandler} >{el.dimension.dimensionName}</a>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            } else { return (<tr><td><p>No owned identity dimensions.</p></td></tr>) }
                                        })(this)}
                                    </tbody>
                                </table>
                                {this.state.showDetails ? <DimensionForm hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeDimension} /> : null}
                            </div><br />

                            <div id="controlledDimensions">
                                <h5><b>My Controlled Dimensions</b></h5> <hr />
                                <table style={table} className="table table-striped center">
                                    <tbody>
                                        {(() => {
                                            if ($.isArray(this.state.ctrlDimensions) && this.state.ctrlDimensions.length > 0) {
                                                return this.state.ctrlDimensions.map(function (el, i) {
                                                    return (
                                                        <tr key={i}>
                                                            <td>
                                                                <a data-item={el.dimension} data-index={i} onClick={_that.showDimensionHandler} >{el.dimension.dimensionName}</a>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            } else { return (<tr><td><p>No controlled identity dimensions.</p></td></tr>) }
                                        })(this)}
                                    </tbody>
                                </table>
                                {this.state.showDetails ? <DimensionForm hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeDimension} /> : null}
                            </div>

                        </div>{/*tabpanel dimensions*/}

                        <div className="tabpanel" role="tabpanel" className="tab-pane" id="addDimension"><br />

                            <div>
                                <h5><b>Select asset:</b></h5>
                                <select id="assetSelect" className="selectpicker show-tick">
                                    <optgroup label="Owned">
                                        {(() => {
                                            if (this.state.owned_assets_label.length > 0) {
                                                return this.state.owned_assets_label.map((label, i) => {
                                                    //let val = label.split(',') //get rid of the .json
                                                    return <option key={i} value={label}>{label}</option>
                                                })
                                            }
                                            else { return <option>None</option> }
                                        })(this)}
                                    </optgroup>
                                    <optgroup label="Controlled">
                                        {(() => {
                                            if (this.state.controlled_assets_label.length > 0) {
                                                return this.state.controlled_assets_label.map((label, i) => {
                                                    //let val = label.split(',') //get rid of the .json
                                                    return <option key={i} value={label}>{label}</option>
                                                })
                                            }
                                            else { return <option>None</option> }
                                        })(this)}
                                    </optgroup>
                                </select>
                            </div>

                            <div id="SubmitContainer">
                                <form method="POST" id="register" role="form">
                                    <div className="form-group">
                                        <label htmlFor="dimensionName">Dimension name:</label>
                                        <input name="dimensionName" className="form-control col-md-4" type="text" placeholder="Dimension Name" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="unique_id">Enter descriptor(s) and attribute(s):</label>
                                        {this.state.inputs.map(input => <DimensionAttributeForm handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
                                    </div>
                                    <div className="form-group">
                                        <div className="col-md-offset-6 col-md-6 ">
                                            <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendAttribute.bind(this)}>
                                                <span className="glyphicon glyphicon-plus"></span>Add More
							                </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="control_dist">Enter Delegations and their delegated control token(s).</label>
                                        {this.state.delegations.map(input => <DimensionDelegationForm max="10" key={input} labelref={input} />)}
                                    </div>
                                    <div className="form-group">
                                        <div className="col-md-offset-6 col-md-6 ">
                                            <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendDelegation.bind(this)}>
                                                <span className="glyphicon glyphicon-plus"></span>Add More
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="control_dist">Enter Controller(s).</label>
                                        <TagsInput {...inputAttrs} value={this.state.control_list} onChange={(e) => { this.onFieldChange("control_list", e) } } />
                                    </div>

                                    <div className="form-group">
                                        <div className="col-sm-6">
                                            <button className="btn btn-primary" data-loading-text="Submit" name="submit-form" type="button" onClick={this.createDimension.bind(this)}>Create Dimension</button>
                                        </div>
                                    </div>
                                </form>
                                {this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
                            </div>{/*CreateDimensionContainer*/}

                        </div>{/*tabpanel addDimension*/}

                    </div>{/*tab-content*/}

                </div>{/*modal-body*/}

            </div >
        );
    }

};


export default IdentityDimensions

//<IdentityDimensions dimensions={dimensions} onDelete={this.handleDeleteDimension.bind(this) } key={dimensions.ID} onClick={this.showHandler.bind(this)}/>
//handleShowModal={this.handleShowModal.bind(this)}

            // let delegatee = $("input[name^='delegatee_addr']").val()
            // if (delegatee) json.delegatee = delegatee
            // let tokenQuantity = $("input[name^='tokenQuantity']").val()
            // if (tokenQuantity) json.tokenQuantity = tokenQuantity

// <tr>
//     <th><b>Delegate tokens</b></th>
// </tr>
// <tr>
//     <td><input name="delegatee_addr" className="form-control col-md-4" type="text" placeholder="Delegatee Address" /></td>
// </tr>
// <tr>
//     <td><input name="tokenQuantity" className="form-control col-md-4" type="text" placeholder="Token Quantity" /></td>
// </tr>
