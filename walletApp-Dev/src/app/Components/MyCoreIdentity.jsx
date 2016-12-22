import React, {Component} from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;



//TODO:
//PUT CONTRACT ADDRESS IN LOCAL STORAGE
//MAKE SURE PUBKEY, PRIVKEY IN LOCAL STORAGE

//QUESTION: SHOULD WE READ THE ENDPOINT BASED ON A BUTTON CLICK and put it in this.state?
//SO it will be set in another function?





//this class aids in adding a controller
class TokenDistributionForm extends React.Component {
    
    constructor(props){
        super(props)
        this.state = {
            controltoken_quantity: [],
            controltoken_list: [],
            
            showModal: false
        };
        this.maxUniqAttr = 10;
        //this.onFieldChange = this.onFieldChange.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
    }
    handleShowModal(e){
        this.setState({showModal: true, tmpFile: $(e.target).attr('data-id')});
    }
    
    handleHideModal(){
        this.setState({showModal: false});
    }
    render(){
        var style = {
            fontSize: '12.5px'
        }
        return(
            <div className="form-group col-md-12">
                <div className="col-md-10">
                <table className="table table-striped table-hover" style={style}>
                        <tbody>
                        <tr>
                        <th><b>Public Key of Controller</b></th>
						<th><b>Control Token Quantity</b></th>
                        </tr>
                        <tr>
                        <td><input name={'label1-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key of Controller"  /></td>
                        <td><input name={'label1-'+this.props.labelref} className="form-control col-md-4" type="text" placeholder="Control Token Quantity"  /></td>
                        </tr>
                        </tbody>
                </table>
                
                </div>
            </div>    
        );
    }
};



class MyCoreIdentity extends React.Component
{
    constructor(props) {
		super(props);
        
        
        //static values:
        this.state = 
        {
            pubKey: localStorage.getItem("pubKey"),
            myContractAddress:"AA8EEA027ADD908040574442FBC259FB5546D28C",
            myCoidEndpoint: "MyCOID/myTokenAmount",
            twinURL: twinUrl,
            requestResult: {},
            amount: 3,
            add_controller: [],
            remove_controller: [],
            inputs_name:['input1-0']//this is for the mapping of controllers and their tokens (in add controllers)        
        };
        
        //event handlers
        this.onFieldChange = this.onFieldChange.bind(this);
    }
    
    //this is for getting data entered into the tags into the state.
    onFieldChange(inputField, e)
    {
		var multipleValues = {};
		multipleValues[inputField] = e;
		this.setState(multipleValues);
	}
    
    handleHideModal()
    {
		this.setState({showModal: false});
	}

	handleShowModal(e)
    {
        this.setState({showModal: true, tmpFile: $(e.target).attr('data-id')});
    }
   
	addControllersClick()
    {
        
    }
    removeControllersClick()
    {
        
    }
    
    //componentDidMount means invoke the code immediately after the component is is mounted:
    componentWillMount()
    {
        
        //generate their signature:
        //(note: we have them sign the coid endpoint)
        
        // var privKey = localStorage.getItem("privKey");
        // var privKey1 = new Buffer(privKey,"hex");
        // var msg = this.state.myCoidEndpoint;
		// var msg_hash = keccak_256(msg);
		// var msg_hash_buffer = new Buffer(msg_hash,"hex");
		// var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
		// signature1 = JSON.parse(signature1).signature;
		// signature1 = JSON.stringify(signature1);
		// signature1 = JSON.parse(signature1).data;
		// signature1 = new Buffer(signature1,"hex");
		// signature1 = signature1.toString("hex");
        
        var msg = "abc"
        var signature1 = "abc"
        
        //prepare request data:
        var requestData = 
        {
            "owner":this.state.pubKey,
            "address":this.state.myContractAddress,
            "msg": msg,
            "sig": signature1
        }
        
        
        
        
        //make a request for the 
        $.ajax({
			type: "POST",
			url: this.state.twinURL + this.state.myCoidEndpoint,
			data: requestData,
			success: function (result) 
            {
				var data = result;
				if ($.type(result) != "object") 
                {
					data = JSON.parseJSON(result)
				}
                
                //log it for testing
                console.log(JSON.stringify(data))
				
                
                this.setState({ requestResult: data });

			}.bind(this),
			complete: function () 
            {
				// do something
			},	
		})
    }
    
    render()
    {
        
        var inputAttrs = {
			addKeys: [13,188],	// Enter and comma
			inputProps: {
				placeholder: "use comma(,) to add multiple values",
				style:{width:'30%'}
			}
		};
		var syle = {
			marginRight:'10px'
		}
        return (
            <div id="MyCOIDContainer">
	    		<h1>My Core Identity {this.state.twinUrl}</h1>
	    		<form method="POST" id="MyCOID" role="form">
                    <div className="form-group">
						<label htmlFor="myControlAmount">Your current Ownership Token Amount is:  {this.state.requestResult.Result}</label>
					</div>
                </form>
                <div className="form-group">
					<label htmlFor="control_dist">Add Controller</label>
					{this.state.inputs_name.map(input => <TokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
				</div>
                <div className="form-group"> 
					<div className="col-md-offset-6 col-md-6 "> 
						<p></p>
						<button type="button" className="btn btn-secondary pull-right" style={syle} onClick={this.addControllersClick.bind(this)}>
							<span className="glyphicon glyphicon-plus"></span>Add
						</button>
					</div>
				</div>
                <div className="form-group">
					<label htmlFor="remove_controller">Remove controller(s)</label>
					<TagsInput {...inputAttrs} value={this.state.remove_controller} onChange={(e)=>{ this.onFieldChange("remove_controller", e) } } />
				</div>
                <div className="form-group"> 
					<div className="txt-right"> 
						<p></p>
						<button type="button" className="btn btn-secondary pull-right" style={syle} onClick={this.removeControllersClick.bind(this)}>
							<span className="glyphicon glyphicon-minus"></span>Remove
						</button>
					</div>
				</div>

            </div>
            
                );
    }
    
}
export default MyCoreIdentity;
