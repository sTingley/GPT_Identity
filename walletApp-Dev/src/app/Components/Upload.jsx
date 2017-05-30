import React from 'react';
import { Link } from 'react-router';
import ReactDOM from 'react-dom';
import { WithContext as ReactTags } from 'react-tag-input';
import Autosuggest from 'react-autosuggest'
import TagsInput from 'react-tagsinput';

class Notify extends React.Component {
	constructor(props) {
		super(props);
		this.prop = props;
	}
	render() {
		//var type = this.prop.params.type || "info";
		//var css = "alert alert-"+type;
		return (
			<div className="alert alert-info" role="alert">
				<span className="glyphicon glyphicon-alert"></span>You received an notification <Link to="/tovote">Click to open</Link>
			</div>
		);
	}
};


function states () {
  return [
    {abbr: 'AL', name: 'Alabama'},
    {abbr: 'AK', name: 'Alaska'},
    {abbr: 'AZ', name: 'Arizona'},
    {abbr: 'AR', name: 'Arkansas'},
    {abbr: 'CA', name: 'California'},
    {abbr: 'CO', name: 'Colorado'},
    {abbr: 'CT', name: 'Connecticut'},
    {abbr: 'DE', name: 'Delaware'},
    {abbr: 'FL', name: 'Florida'},
    {abbr: 'GA', name: 'Georgia'},
    {abbr: 'HI', name: 'Hawaii'},
    {abbr: 'ID', name: 'Idaho'},
    {abbr: 'IL', name: 'Illinois'},
    {abbr: 'IN', name: 'Indiana'},
    {abbr: 'IA', name: 'Iowa'},
    {abbr: 'KS', name: 'Kansas'},
    {abbr: 'KY', name: 'Kentucky'},
    {abbr: 'LA', name: 'Louisiana'},
    {abbr: 'ME', name: 'Maine'},
    {abbr: 'MD', name: 'Maryland'},
    {abbr: 'MA', name: 'Massachusetts'},
    {abbr: 'MI', name: 'Michigan'},
    {abbr: 'MN', name: 'Minnesota'},
    {abbr: 'MS', name: 'Mississippi'},
    {abbr: 'MO', name: 'Missouri'},
    {abbr: 'MT', name: 'Montana'},
    {abbr: 'NE', name: 'Nebraska'},
    {abbr: 'NV', name: 'Nevada'},
    {abbr: 'NH', name: 'New Hampshire'},
    {abbr: 'NJ', name: 'New Jersey'},
    {abbr: 'NM', name: 'New Mexico'},
    {abbr: 'NY', name: 'New York'},
    {abbr: 'NC', name: 'North Carolina'},
    {abbr: 'ND', name: 'North Dakota'},
    {abbr: 'OH', name: 'Ohio'},
    {abbr: 'OK', name: 'Oklahoma'},
    {abbr: 'OR', name: 'Oregon'},
    {abbr: 'PA', name: 'Pennsylvania'},
    {abbr: 'RI', name: 'Rhode Island'},
    {abbr: 'SC', name: 'South Carolina'},
    {abbr: 'SD', name: 'South Dakota'},
    {abbr: 'TN', name: 'Tennessee'},
    {abbr: 'TX', name: 'Texas'},
    {abbr: 'UT', name: 'Utah'},
    {abbr: 'VT', name: 'Vermont'},
    {abbr: 'VA', name: 'Virginia'},
    {abbr: 'WA', name: 'Washington'},
    {abbr: 'WV', name: 'West Virginia'},
    {abbr: 'WI', name: 'Wisconsin'},
    {abbr: 'WY', name: 'Wyoming'}
  ]
}
// TODO : Drag and Upload
// TODO	: Dropbox/google cloud upload for mobile/tablet users
// TODO : File type validation, this can be done once finalized supported formats
//defaul tag exaple { id: 1, text: "Thailand" }, { id: 2, text: "India" }
class UploadKeyStore extends React.Component {

	constructor(props) {
		super(props);
		this.url = twinUrl + "ballot/readNotify/";
		this.state = {
			pubKey: "",
			priKey: "",
			fileread: false,
			notify: false,
			coid: null,
			names:['shane','spencer','andreas'],
			keys:[],
			contacts:[],
			tags: [],
			suggestions: [],
			value:""
		};
		this.uploadFile = this.uploadFile.bind(this);
		this.onResponse = this.onResponse.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onFieldChange = this.onFieldChange.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	
onFieldChange(inputField, e) {
		var multipleValues = {};
		if (inputField == "name" || inputField == "signature" || inputField == "message") {
			this.setState({ [inputField]: e.target.value });
		} else {
			multipleValues[inputField] = e;
			this.setState(multipleValues);
		}
	}

	handleDelete(i) {
        let tags = this.state.tags;
        tags.splice(i, 1);
        this.setState({tags: tags});
    }
 
    handleAddition(tag) {
        let tags = this.state.tags;
		let index = this.state.names.indexOf(tag);
		let val = tag;
		if(index >= 0){
			val = this.state.keys[index];
		}
        tags.push({
            id: tags.length + 1,
            text: tag,
			value: val
        });
        this.setState({tags: tags});
		console.log(JSON.stringify(this.state.tags));
		console.log("index: "+index);
		console.log("tag: "+tag);
		console.log(this.state.names);
    }
 
    handleDrag(tag, currPos, newPos) {
        let tags = this.state.tags;
 
        // mutate array 
        tags.splice(currPos, 1);
        tags.splice(newPos, 0, tag);
 
        // re-render 
        this.setState({ tags: tags });
    }
	handleFilterSuggestions(textInputValue, possibleSuggestionsArray) {
    var lowerCaseQuery = textInputValue.toLowerCase()
 
    return possibleSuggestionsArray.filter(function(suggestion)  {
        return suggestion.toLowerCase().includes(lowerCaseQuery)
    })
}

	getUrl() {
		return this.url + this.state.pubKey;
	}

	toVote() {
		$.get(this.getUrl(), this.onResponse);
	}

	createStorage(pubKey, private_key) {
		localStorage.setItem("pubKey", pubKey);
		localStorage.setItem("privKey", private_key);
		var now = new Date();
		now.setMinutes(now.getMinutes() + 30);
		localStorage.setItem("timestamp", now.getTime());
	}

	uploadFile(e) {
		e.preventDefault();
		var file = e.target.files.value;
		var fileType = file.split('.').pop();
		if (fileType == "json") {
			var reader = new FileReader();
			reader.onload = function (event) {
				var obj = JSON.parse(event.target.result);
				this.createStorage(obj.public_key, obj.private_key);
				this.setState({ pubKey: obj.public_key, priKey: obj.private_key, fileread: true });
				this.props.loginHandler(this.state);
				this.toVote();
			}.bind(this);
			reader.readAsText(e.target.files.files[0]);
		} else {
			alert("Unknown file format ! We support only JSON");
		}


		//set contacts upon key upload; Replace hardcodede pubKey with uploaded key later
		$.ajax({
			url: twinUrl + "readContacts/" + '03a066efbb37f5fabfab05bf4a65e0dc376d0e3fb1c3d930d7f5ec6da3ac5bc237',
			dataType: 'json',
			cache: false,
			success: function (resp) {
				var names=[];
				var keys=[];
				for(var i=0;i<resp.data.contacts.length;i++){
					names.push(resp.data.contacts[i].contactName);
					keys.push(resp.data.contacts[i].pubKey);
				}
				console.log(names);
				console.log(keys);
				localStorage.setItem("contactNames", names);
				localStorage.setItem("contactPubKeys", keys);
				//console.log("Response Data in Documents (parent) component: ", JSON.stringify(resp.data.documents))
				this.setState({ names: names});
				this.setState({ keys: keys});
				console.log("LS contactNames: "+localStorage.getItem("contactNames"));
			}.bind(this)
		});

	}

	onResponse(result) {
		if (!$.isPlainObject(result)) {
			var data = JSON.parse(result);
		} else
			var data = result;
		if (data.messages) {
			var msgs = data.messages;
			this.setState({ coid: msgs });
			if (msgs.length > 0) {
				for (var i = 0; i < msgs.length; i++) {
					if (msgs[i].read_status == false) {
						this.setState({ notify: true });
					}
				}
			}

		}
	}

	componentDidMount() {
		var widgetHTML = $('div.react-tagsinput').html();
		var widgetHTML2 = $('div.react-autosuggest__suggestions-container').html();
		
		console.log("HTML Origin: "+widgetHTML)
    //widgetHTML = widgetHTML.replace(/<div/, '<span').replace(/<\/div><\/div>/g, '<\/div>');
	$('div.react-autosuggest__container').css("display","inline");
	
	//widgetHTML = widgetHTML.replace(/<span/g, '<div').replace(/<\/span>/g, '</div>');
	
	//$('span.react-tagsinput').html(widgetHTML2);
	console.log("HTML: "+widgetHTML)
	//$('div.react-tagsinput').replaceWith(widgetHTML)
	}


	onChange(event, { newValue }) {
		console.log("onchange");
    this.setState({
      value: newValue
    });
  };
handleChange (e) {
	console.log("handlechange TRIGGERED");
    this.setState({tags:tags})
	
  }
	render() {



		var cssClass = 'hidden';
		var options = '';
		var names = ['shane','spencer','andreas']
		var str=[]; // variable to store the options
var month = new Array('January',"February","March","April","May","June","July","August",
"September","October","November","December");
var test = <option value={"a@"+month[0]}>dfbsdfbsbgs</option>;
for (var i=0; i < this.state.names.length;++i){
str[i] = <option value={this.state.names[i]+"@d"} label={this.state.names[i]} />; // Storing options in variable
}
var that = this;
var inputAttrs = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use comma(,) to add multiple values",
				style: { width: '30%' }
			}
		};

function autocompleteRenderInput ({addTag,props}) {
      const handleOnChange = (e, {newValue, method}) => {
		  console.log("handleonchange params: "+e+"   "+newValue+"   "+method);
        if (method === 'enter' || method === 'click') {
			that.state.value="";
          e.preventDefault()
        } else {
          that.onChange(e,{newValue})
        }
      }
	  const handleKeyPress = (event) => {
		  console.log('enter press here! '+event.key)
  if(event.key == 'Enter'){	
          event.preventDefault()
		  addTag(that.state.value)
		  that.state.value="";
		  console.log('current tags: '+that.state.tags)		  
  }
}

const renderInputComponent = inputProps => (
    <input {...inputProps} />
);
const theme = {
  container:                'react-autosuggest__container',
  containerOpen:            'react-autosuggest__container--open',
  input:                    'react-autosuggest__input',
  inputOpen:                'react-autosuggest__input--open',
  inputFocused:             'react-autosuggest__input--focused',
  suggestionsContainer:     'react-autosuggest__suggestions-container',
  suggestionsContainerOpen: 'react-autosuggest__suggestions-container--open',
  suggestionsList:          'react-autosuggest__suggestions-list',
  suggestion:               'react-autosuggest__suggestion',
  suggestionFirst:          'react-autosuggest__suggestion--first',
  suggestionHighlighted:    'react-autosuggest__suggestion--highlighted',
  sectionContainer:         'react-autosuggest__section-container',
  sectionContainerFirst:    'react-autosuggest__section-container--first',
  sectionTitle:             'react-autosuggest__section-title'
};
//console.log("bind: "+that.handleOnChange;
      var inputValue = that.state.value
      var inputLength = inputValue.length

      const suggestions = that.state.names.filter((name) => {
		  console.log("FILTER: "+name.toLowerCase().slice(0, inputLength));
        return name.toLowerCase().slice(0, inputLength) === inputValue
      })
	  
	  const value=that.state.value;
	  //const suggestions = that.state.suggestions;
	  console.log("suggestions: "+suggestions);
	  console.log("value: "+value);
	  const inputProps = {
      placeholder: 'Type a contact',
      value,
	  style: { 
		  width: '30%',
		  height:'100%',
		  display: "initial" 
	  },
      onChange: handleOnChange,
	  onKeyPress: handleKeyPress,
	  className:"react-tagsinput-input"
    };
      return (
        <Autosuggest
		
          ref={that.props.ref}
          suggestions={suggestions}
          shouldRenderSuggestions={(value) => value.length > 0}
          getSuggestionValue={(suggestion) => suggestion}
          renderSuggestion={(suggestion) => <span>{suggestion}</span>}
          inputProps={inputProps}
          onSuggestionSelected={(e, {suggestion}) => {
            console.log("SELECTED: "+suggestion)
			addTag(suggestion)
          }}
          onSuggestionsClearRequested={() => {}}
          onSuggestionsFetchRequested={() => {}}
		  renderInputComponent={renderInputComponent}
		  theme={theme}
        />
      )
    }




			
		if (this.state.fileread) cssClass = 'show';
		return (
			<div className="panel panel-default">
				<div className="panel-heading"><strong>Upload Key Store File</strong> <small>JSON(.json) file format only supported</small></div>
				<div className="panel-body">
					{this.state.notify ? <Notify /> : null}
					<h4>Select file from your computer</h4>
					<form action="" method="post" encType="multipart/form-data" id="js-upload-form" onSubmit={this.uploadFile}>
						<div className="form-inline">
							<div className="form-group">
								<input type="file" name="files" id="js-upload-files" />
							</div>
							<button type="submit" className="btn btn-sm btn-primary" id="js-upload-submit">UPLOAD</button>
						</div>
					</form><br />
					<div>
					<TagsInput {...inputAttrs}  maxTags={1} id="theone" renderInput={autocompleteRenderInput} value={this.state.tags} onChange={(e) => { this.onFieldChange("tags", e) }} />
					</div>
					
					<div className="btn-group">
  <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Contacts <span className="caret"></span>
  </button>
					<ul className="dropdown-menu">
                                {(() => {
                                    {/* POPULATE the controlled assets, */ }
                                    if (this.state.names.length > 0) {
                                        return this.state.names.map((ctrl, i) => {
                                            return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleSelectAsset(ctrl)}>{ctrl}</a></li>
                                        })
										
                                    }
                                    else { return <li>None</li> }
                                })(this)}
                            </ul>
							</div>
					<div className={cssClass}>
						<p><b>Public Key : </b> {this.state.pubKey}</p>
					</div>
				</div>
			</div>
		);
		//document.getElementById('browsers').innerHTML = options;
		

	}
}

export default UploadKeyStore;
