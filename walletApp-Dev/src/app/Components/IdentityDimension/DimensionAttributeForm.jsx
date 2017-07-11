import React, { Component } from 'react';

//(for uploading files for desc/attr pairs)
class DimensionAttributeForm extends React.Component {

    constructor(props) {
        super(props)
        this.maxDelegations = this.props.max
        this.selectPrivacy = this.selectPrivacy.bind(this);
    }

    //*****************************************************************************
    //chosen from the select dropdown 'selectPrivacy'
    //right now we are not getting it this way... but in parent using jquery
    selectPrivacy(e) {
        //console.log("e.target.value" + e.target.value);
        if (e.target.value == "Public") {
            console.log("this one is public");
        }
        if (e.target.value == "Private") {
            console.log("this one is private");
        }
    }

    render() {
        //console.log("dimensionform props...\n" + JSON.stringify(this.props));
        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <label htmlFor="unique_id_attrs"> Persona Descriptor e.g. "My college transcript", "Chase Bank KYC", or "My blockchain research". </label>
                    <input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Descriptor" />
                    <div className="form-group">
                        <label> Descriptor privacy: </label>
                        <select name={'privacy-' + this.props.labelref} id="privacy" onChange={this.selectPrivacy}>
                            <option value="selectVisibility">--- Please select ---</option>
                            <option value="Public">Public</option>
                            <option value="Private">Private</option>
                        </select>
                    </div>
                    <button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn-sm btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
                </div>
            </div>
        );
    }
};

export default DimensionAttributeForm