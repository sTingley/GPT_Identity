import React from 'react';

class Votes extends React.Component {
	render(){
		console.log(this.props);
		if(this.props.msg != ""){
			return(
				<tr>
					<td>
						<p><h3>{this.props.msg}</h3></p>
						<textarea className="form-control" placeholder="Comments here.." />
					</td>
					<td>
						<p>
						  <button type="button" className="btn btn-primary btn-block">Yes</button>
						  <button type="button" className="btn btn-default btn-block">No</button>
						</p>
					</td>
				</tr>
			)
		} else {
			return(
				<tr>
					<td>
						<p>No data to act upon !</p>
					</td>
				</tr>
			)
		}
		
	}
};

class ToVote extends React.Component {
	constructor(props){
		super(props);
		this.state = { coid: this.props.getcoid() };
	}
	
	render(){
		return(
			<div id="vote_container">
				<h1>Vote</h1> <hr/>
				<table className="table">
					<tbody>
					{this.state.coid.map(function(el,i) {
						return <Votes key={i} msg={el.msg} timestamp={el.time} />;
					})}
					</tbody>
				</table>
			</div>
		)
	}
};
export default ToVote;