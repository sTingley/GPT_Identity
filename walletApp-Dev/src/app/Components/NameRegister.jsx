import React from 'react';

//TODO: IMPLEMENT ONCE WE HAVE NAME REGISTRY
//RIGHT NOW THIS COMPONENT IS COMMENTED OUT ON menu.jsx

class NameRegister extends React.Component {
	render () {
	    return (
	    	<div id="NameRegisterContainer">
	    		<h1>Name Register</h1>
	    		<form method="POST" id="register" role="form">
					<div className="form-group">
						<label htmlFor="publickey">Public Key</label>
						<input className="form-control" id="publickey" type="text" name="publickey"/>
					</div>
					<div className="form-group">
						<label htmlFor="signature">Signature</label>
						<input className="form-control" id="signature" type="text" name="signature"/>
					</div>
					<div className="form-group">
						<label htmlFor="datathree">Message</label>
						<input className="form-control" id="datathree" type="text" name="message"/>
					</div>
					<div className="form-group">
						<label htmlFor="message">Input</label>
						<input className="form-control" id="message" type="text" name="input"/>
					</div>
					<div className="form-group">
						<label htmlFor="address">Address</label>
						<input className="form-control" id="address" type="text" name="address"/>
					</div>
					<div className="form-group">
						<label htmlFor="name">Name</label>
						<input className="form-control" id="name" type="text" name="name"/>
					</div>
					<button className="btn btn-primary" type="submit">Submit</button>
				</form>
	    	</div>
	    );
   }
}

export default NameRegister;