// class PanelGroup extends React.Component {

//     constructor(props) {
//         super(props);

//     }

//     //we need,

//         // the label passed
//         // dynamic data inside each "row" div

//     render() {
//         return (
//             <div>
//                 <div className="panel-group" id="accordion">
//                     <div className="panel panel-default">
//                         <div className="panel-heading">
//                             <div className="row">
//                                 <div className="col-xs-11">
//                                     <label>Membership Attributes</label>
//                                 </div>
//                                 <div className="col-xs-1">
//                                     <a data-toggle="collapse" data-parent="#accordion" href="#collapse1">
//                                         <span className="glyphicon glyphicon-chevron-down"></span>
//                                     </a>
//                                 </div>
//                             </div>
//                         </div>
//                         <div id="collapse1" className="panel-collapse collapse out">
//                             <div className="panel-body">
//                                 <div className="row">
//                                     {/* <table className="table table-striped table-hover" > */}
//                                     {/* <tbody>
//                                         <tr>
//                                             <td colSpan="2"><b>Official IDs</b></td>
//                                         </tr> */}
//                                     {/* {(() => {
//                                             var ipfs_url = "http://10.101.114.231:8080/ipfs/";
//                                             if (!$.isEmptyObject(prop.uniqueIdAttributes)) {
//                                                 return prop.uniqueIdAttributes.map((ids, i) => {
//                                                     return (
//                                                         <tr key={i}>
//                                                             <td>{ids[0]}</td>
//                                                             <td><p>File hash: {ids[1]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
//                                                         </tr>
//                                                     )
//                                                 });
//                                             } else {
//                                                 return <tr><td colSpan="2">No Ids found</td></tr>
//                                             }
//                                         })(this)} */}
//                                     {/* </tbody> */}
//                                     {/* </table> */}
//                                     <div className="form-group">
//                                         <label htmlFor="unique_id">Unique ID Attributes:</label>
//                                         {this.state.inputs.map(input => <UniqueIDAttributeForm type={"MyCOID"} handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
//                                     </div>
//                                     <div className="form-group">
//                                         <button type="button" className="btn-sm btn-info pull-right" style={marginRight15} onClick={this.appendInput.bind(this)}>
//                                             <span className="glyphicon glyphicon-plus"></span>Add More
// 																</button>
//                                     </div>
//                                     <div className="form-group">
//                                         <button style={style} type="button" className="btn-sm btn-primary" onClick={this.requestUpdateOfficalIDs.bind(this)}>
//                                             <span className="glyphicon glyphicon-plus"></span>Update Official IDs
//                                                             </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>{/*panel-group*/}

//                 <div className="panel-group" id="accordion">
//                     <div className="panel panel-default">
//                         <div className="panel-heading">
//                             <div className="row">
//                                 <div className="col-xs-11">
//                                     <label>Membership Holding</label>
//                                 </div>
//                                 <div className="col-xs-1">
//                                     <a data-toggle="collapse" data-parent="#accordion" href="#collapse2">
//                                         <span className="glyphicon glyphicon-chevron-down"></span>
//                                     </a>
//                                 </div>
//                             </div>
//                         </div> {/* panel-heading */}

//                         <div id="collapse2" className="panel-collapse collapse out">
//                             <div className="panel-body">
//                                 <div className="row">
//                                     <table className="table table-striped table-hover" style={style}>
//                                         <tbody>
//                                             <tr>
//                                                 <td><b>Membership Holding ID List</b></td>
//                                                 <td>
//                                                     {(() => {
//                                                         if (!$.isEmptyObject(prop.ownerIdList)) {
//                                                             return prop.ownerIdList.map((ids, i) => {
//                                                                 return <p key={i}> {prop.ownerIdList[i]}</p>
//                                                             })
//                                                         }
//                                                     })(this)}
//                                                 </td>
//                                             </tr>
//                                         </tbody>
//                                     </table>
//                                     <div id="OWNERSHIP">
//                                         {/*  style={this.state.removeIfMyCOID}> */}
//                                         <div className="form-group">
//                                             <label htmlFor="control_dist">Enter holders and their membership token(s).</label>
//                                             {this.state.inputs_owners.map(input => <TokenDistributionForm min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
//                                         </div>
//                                         <div className="col-md-offset-6 col-md-6 ">
//                                             <button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendOwners.bind(this)}>
//                                                 <span className="glyphicon glyphicon-plus"></span>Add More
// 							    								</button>
//                                         </div>
//                                         <div className="form-group">
//                                             <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateOwners.bind(this)}>
//                                                 <span className="glyphicon glyphicon-plus"></span>Update Membership Holdings
//                                 								</button>
//                                         </div>
//                                     </div>{/*OWNERSHIP*/}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>{/*panel-group*/}

//                 <div className="panel-group" id="accordion">
//                     <div className="panel panel-default">
//                         <div className="panel-heading">
//                             <div className="row">
//                                 <div className="col-xs-11">
//                                     <label>Delegation</label>
//                                 </div>
//                                 <div className="col-xs-1">
//                                     <a data-toggle="collapse" data-parent="#accordion" href="#collapse3">
//                                         <span className="glyphicon glyphicon-chevron-down"></span>
//                                     </a>
//                                 </div>
//                             </div>
//                         </div>
//                         <div id="collapse3" className="panel-collapse collapse out">
//                             <div className="panel-body">
//                                 <div className="row">
//                                     <table className="table table-striped table-hover" style={style}>
//                                         <tbody>
//                                             <tr>
//                                                 <td><b>Delegation ID List</b></td>
//                                                 <td>
//                                                     {(() => {
//                                                         if (!$.isEmptyObject(prop.controlIdList)) {
//                                                             return prop.controlIdList.map((ids, i) => {
//                                                                 return <p key={i}> {prop.controlIdList[i]}</p>
//                                                             })
//                                                         }
//                                                     })(this)}
//                                                 </td>
//                                             </tr>
//                                         </tbody>
//                                     </table>

//                                     <div className="form-group">
//                                         <label htmlFor="control_dist">Enter Delegatees and their delegated token(s).</label>
//                                         {this.state.inputs_controllers.map(input => <TokenDistributionForm min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
//                                     </div>
//                                     <div className="col-md-offset-6 col-md-6 ">
//                                         {/* onClick={this.appendControllers.bind(this)} */}
//                                         <button type="button" className="btn-sm btn-info pull-right" style={style}>
//                                             <span className="glyphicon glyphicon-plus"></span>Add More
// 														</button>
//                                     </div>
//                                     <div className="form-group">
//                                         {/* onClick={this.requestUpdateController.bind(this)} */}
//                                         <button style={style} type="button" className="btn-sm btn-primary">
//                                             <span className="glyphicon glyphicon-plus"></span>Update Control
// 														</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>{/*panel-group*/}

//                 <div className="panel-group" id="accordion">
//                     <div className="panel panel-default">
//                         <div className="panel-heading">
//                             <div className="row">
//                                 <div className="col-xs-11">
//                                     <label>Recovery</label>
//                                 </div>
//                                 <div className="col-xs-1">
//                                     <a data-toggle="collapse" data-parent="#accordion" href="#collapse4">
//                                         <span className="glyphicon glyphicon-chevron-down"></span>
//                                     </a>
//                                 </div>
//                             </div>
//                         </div>
//                         <div id="collapse4" className="panel-collapse collapse out">
//                             <div className="panel-body">
//                                 <div className="row">
//                                     <table className="table table-striped table-hover" style={style}>
//                                         <tbody>
//                                             <tr>
//                                                 <td>Recovery IDs</td>
//                                                 <td>{(() => {
//                                                     if (!$.isEmptyObject(prop.identityRecoveryIdList)) {
//                                                         return prop.identityRecoveryIdList.map((ids, i) => {
//                                                             return <p key={i}> {prop.identityRecoveryIdList[i]}</p>
//                                                         })
//                                                     }
//                                                 })(this)}
//                                                 </td>
//                                             </tr>
//                                             <tr>
//                                                 <td>Recovery Condition</td>
//                                                 <td><p>{prop.recoveryCondition}</p></td>
//                                             </tr>
//                                             <tr>
//                                                 <td>Change recovery condition:</td>
//                                                 <td><input name="recoveryCondition" className="form-control col-md-4" type="text" placeholder="# of signatures required." /></td>
//                                             </tr>
//                                         </tbody>
//                                     </table>
//                                     <div className="form-group">
//                                         <label style={style} htmlFor="control_dist">Enter Recovery ID(s).</label>
//                                         <TagsInput {...inputAttrs} value={this.state.recovery_list} onChange={(e) => { this.onFieldChange("recovery_list", e) }} />
//                                     </div><br />

//                                     <div className="form-group">
//                                         {/* onClick={this.requestUpdateRecovery.bind(this)} */}
//                                         <button style={style} type="button" className="btn btn-primary">
//                                             <span className="glyphicon glyphicon-plus"></span>Update Recovery
// 																</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>{/*panel-group*/}

//                 <div className="panel-group" id="accordion">
//                     <div className="panel panel-default">
//                         <div className="panel-heading">
//                             <div className="row">
//                                 <div className="col-xs-11">
//                                     <label>One-Time or Temporary Delegation</label>
//                                 </div>
//                                 <div className="col-xs-1">
//                                     <a data-toggle="collapse" data-parent="#accordion" href="#collapse5">
//                                         <span className="glyphicon glyphicon-chevron-down"></span>
//                                     </a>
//                                 </div>
//                             </div>
//                         </div>
//                         <div id="collapse5" className="panel-collapse collapse out">
//                             <div className="panel-body">
//                                 <div className="row">
//                                     <table className="table table-striped table-hover" style={style}>
//                                         <tbody>
//                                             <tr>
//                                                 <td><b>Temporary Delegations List</b></td>
//                                                 <td>
//                                                     {(() => {
//                                                         if (!$.isEmptyObject(prop.delegateeIdList)) {
//                                                             return prop.delegateeIdList.map((ids, i) => {
//                                                                 return <p key={i}> {prop.delegateeIdList[i]}</p>
//                                                             })
//                                                         }
//                                                     })(this)}
//                                                 </td>
//                                             </tr>
//                                         </tbody>
//                                     </table>
//                                     <div className="form-group">
//                                         <label htmlFor="delegatee_dist">Enter Delegatees and their delegated token(s).</label>
//                                         {this.state.inputs_delegatees.map(input => <TokenDistributionForm min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
//                                     </div>
//                                     <div className="col-md-offset-6 col-md-6 ">
//                                         <button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendDelegatees.bind(this)}>
//                                             <span className="glyphicon glyphicon-plus"></span>Add More
// 							    								</button>
//                                     </div>
//                                     <div className="form-group">
//                                         <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateDelegatees.bind(this)}>
//                                             <span className="glyphicon glyphicon-plus"></span>Update Delegations
//                                 								</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>{/*panel-group*/}
//             </div>
//         )
//     }
// }

// export default PanelGroup;