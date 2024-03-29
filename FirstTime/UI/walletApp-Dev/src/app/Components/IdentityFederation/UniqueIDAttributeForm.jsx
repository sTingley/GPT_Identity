import React from 'react';

class UniqueIDAttributeForm extends React.Component {

    constructor(props) {
        super(props);
        this.maxAttributes = this.props.max;
    }
    renderIDF() {
        return (<label htmlFor="unique_id_attrs">Official IDs e.g. SSN, Passport, Driver's License, Digital retinal scans and/or digital fingerprints</label>)
    }
    renderMyGK() {
        return (<label htmlFor="unique_id_attrs">Unique Identfiers e.g. Serial Numbers, MAC Addresses, Vehicle Identitfication Numbers</label>)
    }
    renderICA() {
        return(<label htmlFor="unique_id_attrs">Claims e.g. "My 120 day payment history"</label>)
    }
    renderMyCOID() {
        return (<label htmlFor="unique_id_attrs">Attributes e.g. "My college transcript", "Chase Bank KYC", or "My blockchain research"</label>)
    }
    render() {
        //console.log("UniqueIDAttributeForm props: " + JSON.stringify(this.props));
        let style = { fontSize: '12.5px' }
        return (
            <div className="form-group" style={style}>
                {this.props.type == "IDF" ? this.renderIDF() : null}
                {this.props.type == "MyGK" ? this.renderMyGK() : null}
                {this.props.type == "ICA" ? this.renderICA(): null}
                {this.props.type == "MyCOID" ? this.renderMyCOID() : null}
                <input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Label" />
                <button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn-sm btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
            </div>
        );
    }
};

export default UniqueIDAttributeForm;