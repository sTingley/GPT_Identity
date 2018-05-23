import React, {Component} from 'react';
import dmConfig from '../dm_config.json';

class MyData extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            userKey: "03790927302cd9ca68c17b6de6005a9ea5a0f00caf289360599938347cc5c8d640"
        }
    }

    componentDidMount(){
      $.getJSON(dmConfig.mongodb_url+"getMyData/"+this.state.userKey,
        function(res){
          this.setState({
            data:res.assets
          })
        }.bind(this))
    }

    changeHandler(e){
      $.post(dmConfig.mongodb_url+"update", {
        "id":this.state.userKey,
        "asset_id":e.target.name,
        "set": (e.target.checked == false) ? "private" : "public"
      }, function(res){
        this.setState({
          data:res.assets
        })
      }.bind(this))
    }

    isPublic(index){
      var checked = "true";
      if(this.state.data[index].visibility == "private"){
        checked = "";
      }
      return checked
    }

    render() {
      var hasDoc = function(dataset){
        if(dataset._hasdoc == "true"){
          return <a href="#'+dataset.value+'">Download File</a>;
        } else return dataset.value;
      }
        return (
            <div id="MydataContainer">
                <h3>My Data</h3>  <br />
                {
                  this.state.data.map(function(data, i){
                    return(
                      <div className="data-group" key={i}>
                        <h4>
                          <input type="checkbox" name={data.id} defaultChecked={this.isPublic(i)} onChange={this.changeHandler.bind(this)} /> &nbsp;
                            {data.category_title}
                            <span className="badge pull-right">{data.visibility}</span>
                        </h4><hr />
                        <div className="col-md-12">
                          {
                            data.data.map(function(asset, j){
                              return(
                                <div className="col-md-4 asset_group" key={i+"_"+j}>
                                  <div className="asset">
                                      <b>{asset.label}</b> : {hasDoc(asset)}
                                  </div>
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    )
                  }.bind(this))
                }
            </div>
        );
    }

}

export default MyData;
