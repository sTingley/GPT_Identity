import React, { Component } from 'react';
class TokenDistributionForm extends React.Component {

	constructor(props) {
		super(props)
		// this.state = {
		// 	controltoken_quantity: [],
		// 	controltoken_list: [],
		// 	showModal: false
		// };
		//this.maxUniqAttr = 10;
		//this.onFieldChange = this.onFieldChange.bind(this);
		//this.handleHideModal = this.handleHideModal.bind(this);
	}
	// handleShowModal(e) {
	// 	this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
	// }

	// handleHideModal() {
	// 	this.setState({ showModal: false });
	// }
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
								<th><b>Controller</b></th>
								<th><b>Token Quantity</b></th>
							</tr>
							<tr>
								<td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Controller" /></td>
								<td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity" /></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}
};
export default TokenDistributionForm;