import React from 'react';

class Votes extends React.Component {
	render(){
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
		this.state = { coid: '' };
	}
	
	componentDidMount(){
		$.ajax({
			url: "http://localhost:5050/ballot/readNotify/" + localStorage.getItem("pubKey"),
			dataType: 'json',
			cache: false,
			success: function(result) {
				if(!$.isPlainObject(result)){
					var data = JSON.parse(result);	
				} else 
					var data = result;
				this.setState({coid: data.messages});
			}.bind(this)
		});
	}
	
	render(){
		return(
			<div id="vote_container">
				<h1>Vote</h1> <hr/>
				<table className="table">
					<tbody>
					{(()=>{
						if($.isPlainObject(this.state.coid)){
							return this.state.coid.map(function(el,i) {
								return <Votes key={i} msg={el.msg} timestamp={el.time} />;
							});
						} else {
							return (<tr>
										<td>
											<p>No data to act upon !</p>
										</td>
									</tr>);
						}
					})(this)}
					</tbody>
				</table>
			</div>
		)
	}
};
export default ToVote;