import React from 'react';

class CoreIdentity extends React.Component {
	render () {
	    return (
	    	<div id="CoreIdentityContainer">
	    		<h1>Core Identity</h1>
	    		<form method="POST" id="register" role="form">
							<div className="form-group">
								<label htmlFor="name">Name</label>
								<input className="form-control" id="name" type="text" name="name"/>
							</div>	
							<div className="form-group">
								<label htmlFor="officialid1">Official ID 1</label>
								<input className="form-control" id="officialid1" type="text" name="officialid1"/>
							</div>
							<div className="form-group">
								<label htmlFor="officialid2">Official ID 2</label>
								<input className="form-control" id="officialid2" type="text" name="officialid2"/>
							</div>
							<div className="form-group">
								<label htmlFor="officialid3">Official ID 3</label>
								<input className="form-control" id="officialid3" type="text" name="officialid3"/>
							</div>
							<div className="form-group">
								<label htmlFor="officialid4">Official ID 4</label>
								<input className="form-control" id="officialid4" type="text" name="officialid4"/>
							</div>
							<div className="form-group">
								<label htmlFor="officialid5">Official ID 5</label>
								<input className="form-control" id="officialid5" type="text" name="officialid5"/>
							</div>

							
							<div className="form-group">
								<label htmlFor="ownerid1">Owner ID 1</label>
								<input className="form-control" id="ownerid1" type="text" name="ownerid1"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownerid2">Owner ID 2</label>
								<input className="form-control" id="ownerid2" type="text" name="ownerid2"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownerid3">Owner ID 3</label>
								<input className="form-control" id="ownerid3" type="text" name="ownerid3"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownerid4">Owner ID 4</label>
								<input className="form-control" id="ownerid4" type="text" name="ownerid4"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownerid5">Owner ID 5</label>
								<input className="form-control" id="ownerid5" type="text" name="ownerid5"/>
							</div>

							
							<div className="form-group">
								<label htmlFor="controlid1">Control ID 1</label>
								<input className="form-control" id="controlid1" type="text" name="controlid1"/>
							</div>
							<div className="form-group">
								<label htmlFor="controlid2">Control ID 2</label>
								<input className="form-control" id="controlid2" type="text" name="controlid2"/>
							</div>
							<div className="form-group">
								<label htmlFor="controlid3">Control ID 3</label>
								<input className="form-control" id="controlid3" type="text" name="controlid3"/>
							</div>
							<div className="form-group">
								<label htmlFor="controlid4">Control ID 4</label>
								<input className="form-control" id="controlid4" type="text" name="controlid4"/>
							</div>
							<div className="form-group">
								<label htmlFor="controlid5">Control ID 5</label>
								<input className="form-control" id="controlid5" type="text" name="controlid5"/>
							</div>

							
							<div className="form-group">
								<label htmlFor="recoveryid1">Recovery ID 1</label>
								<input className="form-control" id="recoveryid1" type="text" name="recoveryid1"/>
							</div>
							<div className="form-group">
								<label htmlFor="recoveryid2">Recovery ID 2</label>
								<input className="form-control" id="recoveryid2" type="text" name="recoveryid2"/>
							</div>
							<div className="form-group">
								<label htmlFor="recoveryid3">Recovery ID 3</label>
								<input className="form-control" id="recoveryid3" type="text" name="recoveryid3"/>
							</div>

							
							<div className="form-group">
								<label htmlFor="ownershiptokenid1">Ownership Token ID 1</label>
								<input className="form-control" id="ownershiptokenid1" type="text" name="ownershiptokenid1"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownershiptokenid2">Ownership Token ID 2</label>
								<input className="form-control" id="ownershiptokenid2" type="text" name="ownershiptokenid2"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownershiptokenid3">Ownership Token ID 3</label>
								<input className="form-control" id="ownershiptokenid3" type="text" name="ownershiptokenid3"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownershiptokenid4">Ownership Token ID 4</label>
								<input className="form-control" id="ownershiptokenid4" type="text" name="ownershiptokenid4"/>
							</div>
							<div className="form-group">
								<label htmlFor="ownershiptokenid5">Ownership Token ID 5</label>
								<input className="form-control" id="ownershiptokenid5" type="text" name="ownershiptokenid5"/>
							</div>

							
							<div className="form-group">
								<label htmlFor="controltokenid1">Control Token ID 1</label>
								<input className="form-control" id="controltokenid1" type="text" name="controltokenid1"/>
							</div>
							<div className="form-group">
								<label htmlFor="controltokenid2">Control Token ID 2</label>
								<input className="form-control" id="controltokenid2" type="text" name="controltokenid2"/>
							</div>
							<div className="form-group">
								<label htmlFor="controltokenid3">Control Token ID 3</label>
								<input className="form-control" id="controltokenid3" type="text" name="controltokenid3"/>
							</div>
							<div className="form-group">
								<label htmlFor="controltokenid4">Control Token ID 4</label>
								<input className="form-control" id="controltokenid4" type="text" name="controltokenid4"/>
							</div>
							<div className="form-group">
								<label htmlFor="controltokenid5">Control Token ID 5</label>
								<input className="form-control" id="controltokenid5" type="text" name="controltokenid5"/>
							</div>				
							<button className="btn btn-primary" type="submit">Submit</button>
						</form>
	    	</div>
	    );
   }
}

export default CoreIdentity;