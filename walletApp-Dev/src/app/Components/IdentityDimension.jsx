import React, { Component } from 'react';



class AddDimension extends Component {

    constructor() {
        super();
        this.state = {
            newDimension: {},
            files: ['FinanceChart.xls', 'Patent.pdf', 'Journal3.docx']
        }
        //propTypes = {}
    }

    handleSubmit(e) {
        if (this.refs.dimensionType.value === '') {
            alert('name is required')
        } else {
            this.setState({
                newDimension: {
                    ID: Math.floor(Math.random() * 100),
                    dimensionType: this.refs.dimensionType.value,
                    category: this.refs.category.value
                }
            }, function () {
                this.props.addDimension(this.state.newDimension)
            })
        }
    }

    render() {
        let categoryOptions = this.state.files.map(category => {
            return <option key={category} value={category}>{category}</option>
        });
        return (
            <div>
                <h3>Add Dimension</h3>
                <form onSubmit={this.handleSubmit.bind(this) }>

                    <div>
                        <label>Dimension name: </label><br />
                        <input type="text" ref="dimensionType" />
                    </div>
                    <div>
                        <label>Category</label><br />
                        <select ref="category">
                            {categoryOptions}
                        </select>
                    </div>
                    <br />
                    <input type="submit" value="Submit" />
                    <br />
                </form>

            </div>
        );
    }
}

class DimensionForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dimension: this.props.dataHandler,
            dimension_data: {}
        };

    }


    //HANDLE THE CHOICE OF USER INPUT
    submitHandler(e) {
        e.preventDefault();
        var ele = $(e.target);

        var json = {
            "publicKey": localStorage.getItem("pubKey")
        }


        //add request to add dimension

        //add request to update dimension

        //add request to remove dimension


    }//end submitHandler


    componentDidMount() {
        var _this = this;

        var dim = {
            ID: 123432, dimensionType: "financial"
        }

        //UNCOMMENT WHEN INTEGRATING CONTRACTS AND THE JS

        // $.ajax({
        //     type: "POST",
        //     url: twinUrl + 'getDimensionData',
        //     data: {
        //         "publicKey": localStorage.getItem("pubKey"),
        //         "ID": "321312231212312"
        //     },
        //     success: function (result) {
        //         //var isSecure = true;

        //         if ($.type(result) == "string") {
        //             result = JSON.parse(result);
        //         }

        _this.setState({
            dimension_data: {
                dim
            }
        });
        $("#dimensionDetails").modal('show');
        $("#dimensionDetails").on('hidden.bs.modal', this.props.hideHandler);

        //     }

        // })


    }



    render() {

        //var prop = this.state.dimension;
        console.log("state in DImensionForm" + JSON.stringify(this.state))
        var type = this.state.dimension;
        console.log("#" + JSON.stringify(type))


        //type = JSON.parse(type).dimensionType

        return (
            <div className="modal fade" id="dimensionDetails" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
                            <ul className="nav nav-pills" role="tablist">
                                <li role="presentation" className="active"><a href="#dimension_Details" role="tab" data-toggle="tab">Dimension Details</a></li>
                                <li role="presentation"><a href="#edit" role="tab" data-toggle="tab">Edit dimension</a></li>
                            </ul>
                        </div>

                        <div className="modal-body">
                        
                            <div className="tab-content">
                                <div role="tabpanel" className="tab-pane active" id="dimension_Details">

                                    <table className="table table-striped table-hover">
                                        <tbody>
                                            <tr>
                                                <td>Dimension Type</td>
                                                <td>{type.dimensionType}</td>
                                            </tr>

                                            <tr>
                                                <td>Reference Hash</td>
                                                <td>{type.ID}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div role="tabpanel" className="tab-pane center-block" id="edit" >
                                    <table className="table table-striped table-hover" >
                                        <tbody>
                                            <tr>
                                                <th><b>Public Key of Owner</b></th>
                                                <th><b>Ownership Token Quantity</b></th>
                                            </tr>
                                            <tr>
                                                <td><input name={'label2-' + this.props.labelref}  type="text" placeholder="Public Key of Owner"  /></td>
                                                <td><input name={'label2-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Ownership Token Quantity"  /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>



                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger btn-sm" onClick={this.submitHandler.bind(this) }>THIS BUTTON DOES SOMETHING</button>
                        </div>

                    </div>


                </div>

            </div>
        )
    }
}


class Modal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            iDimensions: [],
            showDetails: false,
            activeDimension: {}
        };
        this.showHandler = this.showHandler.bind(this);
    }

    getDimensions() {
        this.setState({
            iDimensions: [
                {
                    ID: 123124, dimensionType: "financial"
                },
                {
                    ID: 342342, dimensionType: "education"
                },
                {
                    ID: 212144, dimensionType: "personal"
                }
            ]
        })
    }

    // componentWillMount() {
    //     this.getDimensions();
    // }

    componentDidMount() {
        //ajax request to get identityDimensions from digital twin
        var dimensions = {
            identity_dimensions:
            [
                { dimensionType: "financial", ID: "123124" },
                { dimensionType: "personal", ID: "123124" },
                { dimensionType: "education", ID: "123124" }
            ]
        }

        this.setState({ iDimensions: dimensions.identity_dimensions })
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
        var style = {width: '180px'}
        
        
        return (
            <div id="dimensions_container">

                <h1>IDENTITY DIMENSIONS</h1><hr />

                <table className="table table-striped">
                    <tbody>
                        {(() => {
                            if ($.isArray(this.state.iDimensions) && this.state.iDimensions.length > 0) {
                                return this.state.iDimensions.map(function (el, i) {
                                    return (
                                        <tr key={i}>
                                            <td className="pull-right">
                                                <button type="button" className="btn btn-primary" style={style} data-item={el} data-index={i} onClick={_that.showHandler} >{el.dimensionType}</button>
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
                        })(this) }
                    </tbody>
                </table>

                {this.state.showDetails ? <DimensionForm hideHandler={this.hideHandler.bind(this) } dataHandler={this.state.activeDimension} /> : null}
            </div>
        );
    }

};

//<IdentityDimensions dimensions={dimensions} onDelete={this.handleDeleteDimension.bind(this) } key={dimensions.ID} onClick={this.showHandler.bind(this)}/>


export default Modal

