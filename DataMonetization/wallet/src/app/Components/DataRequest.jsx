import React from 'react';
import wallet from './wallet.js';
import {Typeahead} from 'react-bootstrap-typeahead';
import AnimatedNumber from 'react-animated-number';
import dmConfig from '../dm_config.json';

// #TODO - Show notification when signature validations failed
class DataRequest extends React.Component {

    constructor(param) {
        super(param);
        var util = new wallet();
        var signature = util.buffer_to_hexString(util.sign(util.hexString_to_buffer(localStorage.getItem("hash")), util.hexString_to_buffer(localStorage.getItem("privKey"))).signature);
        this.state = {
            reqPubKey: localStorage.getItem("pubKey"),
            reqHash: localStorage.getItem("hash"),
            reqSig: signature,
            sucessMessage: "",
            data_cat: [
                {
                    "id": "basic_info",
                    "category_title": "Public Profile"
                }, {
                    "id": "detailed_info",
                    "category_title": "Social Profile"
                }, {
                    "id": "social_profile",
                    "category_title": "Income Category"
                }, {
                    "id": "personal_contact",
                    "category_title": "Personal Information"
                }
            ],
            txnID: 'fcad266911f8fd514738d3db99ae3b791c0e58865ba6734b388fc14427b5d0a8',
            ownerPubkey: "02a1d0365f1c92971681dd0d28e0a0758c8e68d9ee2818f1b2371ad5c9bf1b7a5f",
            selectedDataType: [],
            cities: [],
            interest: [],
						total_count:0,
						btn_active: false
        }
    }

    componentWillMount() {
        $.getJSON(dmConfig.mongodb_url + "cities", function(res) {
            this.setState({cities: res});
        }.bind(this))
        $.getJSON(dmConfig.mongodb_url + "intrests", function(res) {
            this.setState({interest: res[0].tags});
        }.bind(this))
    }

    sendRequest(e) {
        e.preventDefault();
        var inputVal = {},
            obj = $(e.target).find("input");
        obj.each(function() {
            inputVal[this.name] = $(this).val();
        });
        inputVal["datatype"] = this.state.selectedDataType.join(",");
        $.post(twinUrl + "dataRequest", inputVal, function(res) {
            if (res.Message == "Success") {
                $("input[name=datatype]").attr("checked", false);
                this.setState({sucessMessage: "Your Data Request is submitted successfully"})
            }
        }.bind(this));

    }

    dataChangeHandler(e) {
        var val = e.target.value;
        console.log(typeof(this.state.selectedDataType));
        if (e.target.checked == true && this.state.selectedDataType.indexOf(e.target.value) < 0) {
            var tmpArray = this.state.selectedDataType;
            tmpArray.push(e.target.value);
            this.setState({'selectedDataType': tmpArray})
        } else if (e.target.checked == false) {
            var index = this.state.selectedDataType.indexOf(e.target.value);
            if (index > -1) {
                var tmpArray = this.state.selectedDataType;
                this.setState({
                    'selectedDataType': tmpArray.splice(index, 1)
                })
            }
        }
    }
		shortenLargeNumber(num, digits) {
				return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		findHandler(e){
			var $button = $(e.target);
			$button.button('loading');
			var filters = {
				"cities":[],
				"interest":[],
				"gender": $("input[name=gender]:checked").val(),
				"agegroup": $("input[name=filter_by_agegroup]:checked").val()
			}
			var _allCity = this._city.getInstance().state.selected;
			var _allInt = this._interest.getInstance().state.selected;
			if(_allCity.length > 0){
				_allCity.map(function(obj){
					filters.cities.push(obj.city)
				})
			}
			if(_allInt.length > 0){
				_allInt.map(function(obj){
					filters.interest.push(obj.tag)
				})
			}
			$.post(dmConfig.mongodb_url + "find",filters,function(res){
				this.setState({
					total_count:  parseInt(res[0].total_subscribers) || 0
				});
				setTimeout(function(){
					this.setState({
						btn_active: true
					})
					$button.button('reset');
				}.bind(this),1500)
			}.bind(this));
			//console.log("Typeahead",this._city.getInstance().state.selected);
		}

		nextHandler(e){
			e.preventDefault()
			$(".filters").addClass("hidden");
			$(".form_submission").removeClass("hidden");
		}

		cancelHandler(e){
			e.preventDefault()
			$(".filters").removeClass("hidden");
			$(".form_submission").addClass("hidden");
		}

    render() {
        return (
            <div id="NameRegisterContainer" className="container-fluid">
                {(this.state.sucessMessage != "")
                    ? <div className="alert alert-success alert-dismissible" role="alert">
                            <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <strong>Done!</strong>
                            {this.state.sucessMessage}
                        </div>
                    : ""
}

                <h3>Request Data</h3> <hr/>
                <form method="POST" id="register" role="form" onSubmit={this.sendRequest.bind(this)}>
                    <fieldset>
                        <div className="hidden">
                            <div className="form-group">
                                <label htmlFor="reqestee_publickey">Data Owner Public Key</label>
                                <input className="form-control" id="owner_publickey" type="text" defaultValue={this.state.ownerPubkey} name="owner_publickey"/>
                            </div>
                        </div>
                        <div className="filters">
                            <div className="form-group">
                                <label htmlFor="filter_by_city">City</label>
                                <Typeahead labelKey="city" multiple options={this.state.cities} placeholder="Filter by City..." ref={ref => this._city = ref} selected={this.state.cities.slice(0, 1)}/>
                            </div>
                            <div className="form-group">
                                <label>Age Group</label>
                                <div className="form-control form-align">
                                    <label className="radio-inline">
                                        <input type="radio" name="filter_by_agegroup" value="lt_13" defaultChecked/>
                                        Less than 13
                                    </label>
                                    <label className="radio-inline">
                                        <input type="radio" name="filter_by_agegroup" value="13-18"/>
                                        13-18
                                    </label>
                                    <label className="radio-inline">
                                        <input type="radio" name="filter_by_agegroup" value="19-27"/>
                                        19-27
                                    </label>
                                    <label className="radio-inline">
                                        <input type="radio" name="filter_by_agegroup" value="28-45"/>
                                        28-45
                                    </label>
                                    <label className="radio-inline">
                                        <input type="radio" name="filter_by_agegroup" value="gt_45"/>
                                        Greater than 45
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="filter_by_interest">Interest</label>
                                <Typeahead labelKey="tag" multiple options={this.state.interest} placeholder="Ex: Cricket Lover" ref={ref => this._interest = ref}/>
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <div className="form-control form-align">
                                    <label className="radio-inline">
                                        <input type="radio" name="gender" value="male" defaultChecked/>
                                        Male
                                    </label>
                                    <label className="radio-inline">
                                        <input type="radio" name="gender" value="female"/>
                                        Female
                                    </label>
                                </div>
                            </div>
														<div className="pull-right">
															<span className="filter_results">
															{this.state.total_count > 0 ?	<AnimatedNumber component="text" value={this.state.total_count}
												            style={{
												                transition: '0.8s ease-out',
												                fontSize: 16,
												                transitionProperty:
												                    'background-color, color, opacity'
												            }}
																		duration={1500}
												            formatValue={n => this.shortenLargeNumber(n) +` subscribers found` }/> :""}
															</span>
															<button className="btn btn-primary" type="button" data-loading-text="Searching ..." onClick={this.findHandler.bind(this)}>Search</button>&nbsp;
															{this.state.btn_active == true ? <button className="btn btn-success" type="button" onClick={this.nextHandler.bind(this)}>Next</button> :""}
														</div>
                        </div>
                        <div className="form_submission hidden">
                            <div className="form-group">
                                <label>Data Type</label>
                                <div className="form-control form-align">
                                    {this.state.data_cat.map(function(dt, i) {
                                        return (
                                            <label className="checkbox-inline" key={i}><input name="datatype" onChange={this.dataChangeHandler.bind(this)} type="checkbox" value={dt.id}/>{dt.category_title}</label>
                                        )
                                    	}.bind(this))
																		}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Access Type</label>
                                <div className="form-control form-align">
                                    <label className="radio-inline">
                                        <input type="radio" name="access_type" value="private" id="access_private" defaultChecked/>
                                        Private
                                    </label>
                                    <label className="radio-inline">
                                        <input type="radio" name="access_type" value="public" id="access_public"/>
                                        Public
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="suggested_price">Suggested Access Price</label>
                                <div className="input-group">
                                    <div className="input-group-addon">BTC</div>
                                    <input type="text" className="form-control" name="suggested_price" id="suggested_price" defaultValue="100" placeholder="Amount"/>
                                </div>
                            </div>
                            <div className="hidden">
                                <div className="form-group">
                                    <label htmlFor="requester_publickey">Requester Public Key</label>
                                    <input className="form-control" id="requester_publickey" type="text" defaultValue={this.state.reqPubKey} name="requester_publickey" disabled/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="requester_msghash">Requester Message Hash</label>
                                    <input className="form-control" id="requester_msghash" type="text" defaultValue={this.state.reqHash} name="requester_msghash" disabled/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="requester_signature">Requester Digital Signature</label>
                                    <input className="form-control" id="requester_signature" type="text" defaultValue={this.state.reqSig} name="requester_signature" disabled/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="requester_txnid">Requester COID Txn ID</label>
                                    <input className="form-control" id="requester_txnid" type="text" defaultValue={this.state.txnID} name="requester_txnid" disabled/>
                                </div>
                            </div>
                            <button className="btn btn-primary" type="submit">Submit</button>&nbsp;
                            <button className="btn btn-default" type="button" onClick={this.cancelHandler.bind(this)}>Cancel</button>
                        </div>
                    </fieldset>
                </form>
            </div>
        );
    }
}

export default DataRequest;
