import React, { Component } from 'react';
class TokenDistributionForm extends React.Component {
    
    constructor(props) {
        super(props)
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
                                <th><b>Public Key</b></th>
                                <th><b>Token Quantity</b></th>
                            </tr>
                            <tr>
                                <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key" /></td>
                                <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Token Quantity" /></td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>
        );
    }
}; export default TokenDistributionForm;