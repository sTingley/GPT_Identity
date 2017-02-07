import React, { Component } from 'react';

//TODO ------ ADD ROUTING!!!!!!!!!
//import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

// class AddDimension extends Component {

//     constructor() {
//         super();
//         this.state = {
//             newDimension: {},
//             files: ['FinanceChart.xls', 'Patent.pdf', 'Journal3.docx']
//         }
//         //propTypes = {}
//     }

//     handleSubmit(e) {
//         if (this.refs.dimensionType.value === '') {
//             alert('name is required')
//         } else {
//             this.setState({
//                 newDimension: {
//                     ID: Math.floor(Math.random() * 100),
//                     dimensionType: this.refs.dimensionType.value,
//                     category: this.refs.category.value
//                 }
//             }, function () {
//                 this.props.addDimension(this.state.newDimension)
//             })
//         }
//     }

//     render() {
//         let categoryOptions = this.state.files.map(category => {
//             return <option key={category} value={category}>{category}</option>
//         });
//         return (
//             <div>
//                 <h3>Add Dimension</h3>
//                 <form onSubmit={this.handleSubmit.bind(this) }>

//                     <div>
//                         <label>Dimension name: </label><br />
//                         <input type="text" ref="dimensionType" />
//                     </div>
//                     <div>
//                         <label>Category</label><br />
//                         <select ref="category">
//                             {categoryOptions}
//                         </select>
//                     </div>
//                     <br />
//                     <input type="submit" value="Submit" />
//                     <br />
//                 </form>

//             </div>
//         );
//     }
// }

class DimensionForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dimension: this.props.dataHandler,
            dimension_data: {},

            dimension_dist: []
        };

        var owned = true

    }

    //HANDLE THE CHOICE OF USER INPUT
    submitHandler(e) {
        e.preventDefault();
        var ele = $(e.target);

        var button_val = parseInt(ele.attr("data-val"))

        // console.log("ele: " + $(e.target))

        var json = {
            "publicKey": localStorage.getItem("pubKey")
        }


        // request to add dimension attribute
        if (button_val === 1) {
            console.log("hit add descriptor rq")

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
        }

        // request to update controllers
        if (button_val === 2) {
            console.log("hit controller rq")
            $.ajax({
                url: twinUrl + 'addController',
                type: 'POST',
                data: json,
                success: function (res) {
                    if (res.status == "Ok" && res.msg == "true") {
                        //var i_dimension = this.state.dimension.ID
                    }
                }
            });
        }

        // request to add delegations
        console.log("hit delegation rq")
        if (button_val === 3) {
            if (this.owned == true) {
                $.ajax({
                    url: twinUrl + 'addDelegation',
                    type: 'POST',
                    data: json,
                    success: function (res) {
                        if (res.status == "Ok" && res.msg == "true") {
                            //var i_dimension = this.state.dimension.ID
                        }
                    }
                });
            }
        }


    }//end submitHandler

    // componentWillMount(){

    // }


    componentDidMount() {

        this.setState({
            dimension_data: this.props.dimension
        });

        $("#dimension_Details").modal('show');
        $("#dimension_Details").on('hidden.bs.modal', this.props.hideHandler);


    }



    render() {

        console.log("state in DimensionForm" + JSON.stringify(this.state))
        var dims = this.state.dimension
        console.log("dims: " + JSON.stringify(dims))

        var syle = {
            marginRight: '15px'
        }

        var controllers = ["pubkey2121", "pubkey4422", "pubkey0"]



        return (
            <div className="modal fade" id="dimension_Details" key={dims.ID} tabIndex="-1" role="dialog" aria-labelledby="dimension">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
                            <ul className="nav nav-pills" role="tablist">
                                <li role="presentation" className="active"><a href="#dimensionDetails" role="tab" data-toggle="tab">Identity Dimension Details</a></li>
                                <li role="presentation"><a href="#control" role="tab" data-toggle="tab">Controllers</a></li>
                                <li role="presentation"><a href="#delegations" role="tab" data-toggle="tab">Token Delegations</a></li>
                            </ul>
                        </div>

                        <div className="modal-body">
                            <div className="tab-content">

                                <div role="tabpanel" className="tab-pane active" id="dimensionDetails">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <td>Dimension Type</td>
                                                <td>{dims.dimensionType}</td>
                                            </tr>

                                            <tr>
                                                <td colSpan="3"><b>Descriptors:</b></td>
                                            </tr>
                                            {(() => {
                                                if(dims.attr_list.length > 0) {
                                                    return dims.attr_list.map((attrs, i) => {
                                                        return (
                                                            <tr key={i}>
                                                                <td>{attrs[0]}</td>
                                                                <td><p>{attrs[1]}</p></td>
                                                                <td><input type="checkbox" id={i}></input></td>
                                                            </tr>
                                                        )
                                                    });
                                                } else { return <tr><td colSpan="3">No Ids found</td></tr> }
                                            })(this)}

                                            <tr>
                                                <th><b>Add Dimension Attribute</b></th>
                                            </tr>

                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="descriptor name" /></td>
                                            </tr>

                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-info" data-val="1" onClick={this.submitHandler.bind(this)}> Add descriptor</button>
                                </div>

                                <div role="tabpanel" className="tab-pane" id="control">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <td>controllerList</td>
                                            </tr>

                                            {(() => {
                                                if (!$.isArray(controllers) && controllers.length > 0) {
                                                    return controllers.map((pubkeys, i) => {
                                                        return (
                                                            <tr key={i}>
                                                                <td>{pubkeys[i]}</td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                                else {
                                                    return <tr><td colSpan="2">NO CONTROLLERS FOR THIS DIMENSION</td></tr>
                                                }
                                            })(this)}

                                            <tr>
                                                <td></td>
                                            </tr>

                                            <tr>
                                                <th><b>Public Key of Controller</b></th>
                                                <th><b>Control Token Quantity</b></th>
                                            </tr>
                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Public Key of Controller" /></td>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Control Token Quantity" /></td>
                                            </tr>

                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-info" data-val="2" onClick={this.submitHandler.bind(this)}> ADD CONTROLLER</button>
                                </div>

                                <div role="tabpanel" className="tab-pane" id="delegations">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <td>Delegations</td>
                                                <td>{2}</td>
                                            </tr>

                                            <tr>
                                                <th><b>Delegate tokens</b></th>
                                            </tr>

                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Delegatee Address" /></td>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Token Quantity" /></td>
                                            </tr>
                                            <tr>
                                                <option value="one">One</option>
                                                <option value="two">Two</option>
                                                <option value="three">Three</option>
                                                <option value="four">Four</option>
                                            </tr>

                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-info" data-val="3" onClick={this.submitHandler.bind(this)}>Delegate tokens</button>
                                </div>

                            </div>
                        </div>



                    </div>
                </div>
            </div>
        )
    }
}

//                             <div className="modal-footer">
//                                <button type="button" className="btn btn-danger" onClick={this.submitHandler.bind(this)}>THIS BUTTON DOES SOMETHING</button>
//                           </div>

class Modal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            iDimensions: [],
            delegations: [],
            showDetails: false,
            activeDimension: {}
        };
        this.showHandler = this.showHandler.bind(this);
    }

    //USED IF DIGITAL TWIN NOT AVAILABLE
    // getDimensions() {
    //     this.setState({
    //         iDimensions: [
    //             { dimensionType: 'FINANCIAL HISTORY', ID: '12234', owned: true, name: 'Football', descriptors: ["monday", "tuesday", "wednesday"], attributes: ["h1", "h2", "h3"] },
    //             { dimensionType: 'EDUCATION', ID: '34334', owned: true, name: 'iPod Touch', descriptors: ["monday", "tuesday", "wednesday"], attributes: ["h1", "h2", "h3"] },
    //             { dimensionType: 'DIGITAL ASSETS', ID: '56676', owned: false, name: 'iPhone 5', descriptors: ["monday", "tuesday", "wednesday"], attributes: ["h1", "h2", "h3"] }
    //         ]
    //     })
    // }

    componentWillMount() {
        //this.getDimensions();
        $.ajax({
            url: twinUrl + 'getMetaData',
            type: 'POST',
            data: {
                //"pubKey": localStorage.getItem("pubKey")
            },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parse(result)
                }

                console.log("data: " + JSON.stringify(data))
                data = JSON.stringify(data)
                data = JSON.parse(data).data
                console.log("data after parse: " + JSON.stringify(data))
                data = JSON.stringify(data)
                var dimensions = JSON.parse(data).Dimensions
                console.log("dimensions: " + JSON.stringify(dimensions))

                this.setState({ iDimensions: dimensions })

            }.bind(this),
            complete: function () {

            }
        })

    }

    hideHandler() {
        this.setState({ showDetails: false });
    }

    dataHandler(index) {
        return this.state.iDimensions[index];
    }

    getActiveData() {
        return this.state.activeDimension;
    }

    showHandler(e) {
        e.preventDefault();
        this.setState({
            showDetails: true,
            activeDimension: this.dataHandler($(e.target).attr('data-index'))
        });
    }

    handleAddDimension(dimension) {
        console.log("insidehandle add" + JSON.stringify(dimension))
        let dimensions = this.state.iDimensions;
        dimensions.push(dimension);
        this.setState({ iDimensions: dimensions })
    }

    handleDeleteDimension(id) {
        let dimensions = this.state.iDimensions;
        let index = dimensions.findIndex(x => x.id === id);
        dimensions.splice(index, 1);
        this.setState({ iDimensions: dimensions })
    }

    render() {
        console.log(JSON.stringify(this.state))
        let dimensions = this.state.iDimensions;
        var _that = this

        var table = {
            margin: '0 auto'
        }

        return (
            <div id="dimensions_container">

                <h1>IDENTITY DIMENSIONS</h1><hr />



                <table style={table} className="table table-striped center">
                    <tbody>
                        {(() => {
                            if ($.isArray(this.state.iDimensions) && this.state.iDimensions.length > 0) {
                                return this.state.iDimensions.map(function (el, i) {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <a data-item={el} data-index={i} onClick={_that.showHandler} >{el.dimensionType}</a>
                                            </td>
                                            <td className="pull-left">

                                            </td>
                                        </tr>
                                    );
                                });
                            } else {
                                return (
                                    <tr>
                                        <td>
                                            <p>No identity dimensions</p>
                                        </td>
                                    </tr>);
                            }
                        })(this)}

                    </tbody>
                </table>

                {this.state.showDetails ? <DimensionForm hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeDimension} /> : null}
            </div>
        );
    }

};





// //temp function
// app.post('/getMetaData', function(req,res)
// {
//         console.log("endpoint getMetaData was hit");
//         var obj1 = {"dimensionType": "financial history", "ID": "1234", "attr_list": ["jan1", "hash_jan1_ptr", "jan 2", "hash_jan2_ptr"], "flag": [0,1] }
//         var obj2 = {"dimensionType": "personal", "ID": "6678", "attr_list": ["val 1", "hash_val_1_ptr", "val 2", "hash_val_2_ptr"], "flag": [1,1] }
//         var obj3 = {"dimensionType": "photography",  "ID": "4538", "attr_list": ["document_1", "hash_ptr_doc1", "document_2", "hash_ptr_doc2"], "flag": [0,1,1] }
//         var response = { "Dimensions": [obj1, obj2, obj3] }
//         res.json({"data": response})

// })



















/*

                        {(() => {
                            if ($.isArray(this.state.delegations) && this.state.delegations.length > 0) {
                                return (
                                    <tr key={i}>
                                        <td>
                                            <a data-item={el} data-index={i}  >{el.dimensionType}</a>
                                        </td>
                                        <td className="pull-left">

                                        </td>
                                    </tr>
                                );
                            }

                        })(this)}


 */

//<AddDimension addDimension={this.handleAddDimension.bind(this) } /><br /><br />

//<IdentityDimensions dimensions={dimensions} onDelete={this.handleDeleteDimension.bind(this) } key={dimensions.ID} onClick={this.showHandler.bind(this)}/>


export default Modal
