<div className="tabpanel" role="tabpanel" className="tab-pane" id="addDimension"><br />
    <div className="container-fluid">
        <div className="well">
            <div className="row">
                <div className="col-xs-5" >
                    <h5><b>Select asset:</b></h5>
                </div>
                <div className="col-xs-7">
                    <select id="assetSelect" className="selectpicker show-tick select-width">
                        <optgroup label="Owned">
                            {(() => {
                                if (this.state.owned_assets_label.length > 0) {
                                    return this.state.owned_assets_label.map((label, i) => {
                                        //let val = label.split(',') //get rid of the .json
                                        return <option key={i} value={label}>{label}</option>
                                    })
                                }
                                else { return <option>None</option> }
                            })(this)}
                        </optgroup>
                        <optgroup label="Controlled">
                            {(() => {
                                if (this.state.controlled_assets_label.length > 0) {
                                    return this.state.controlled_assets_label.map((label, i) => {
                                        //let val = label.split(',') //get rid of the .json
                                        return <option key={i} value={label}>{label}</option>
                                    })
                                }
                                else { return <option>None</option> }
                            })(this)}
                        </optgroup>
                    </select>
                </div>
            </div>
            <br></br>

            <div id="SubmitContainer">
                <form method="POST" id="register" role="form">
                    <div className="row">
                        <div className="col-xs-5">
                            <label htmlFor="dimensionName">Persona name</label>
                        </div>
                        <div className="col-xs-7">
                            <input name="dimensionName" className="form-control col-md-4" type="text" placeholder="Dimension Name" />
                        </div>
                    </div>
                    <br></br>
                    <div className="row">
                        <div className="col-xs-5">
                            <label htmlFor="unique_id">Enter descriptor(s) and attribute(s)</label>
                        </div>
                        <div className="col-xs-7">
                            {this.state.inputs.map(input => <DimensionAttributeForm handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-offset-6 col-md-6 ">
                            <button type="button" className="btn btn-info pull-right button-style" onClick={this.appendAttribute.bind(this)}>
                                <span className="glyphicon glyphicon-plus"></span>Add More
                                            </button>
                        </div>
                    </div>
                    <br></br>     {/* //   create persona start // */}
                    <div className="row">
                        <div className="col-xs-5">
                            <label htmlFor="control_dist">Enter Delegations and their delegated token(s).</label>
                        </div>
                        <div className="col-xs-7">
                            {this.state.delegations.map(input => <DimensionDelegationForm max="10" key={input} labelref={input} />)}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-xs-12">     {/* //   create persona start // */}
                            <button type="button" className="btn btn-info pull-right button-add-1" onClick={this.appendDelegation.bind(this)}>
                                <span className="glyphicon glyphicon-plus"></span>Add More
                                            </button>
                        </div>
                    </div>
                    <br></br>
                    <div className="row">
                        <div className="col-xs-5">
                            <label htmlFor="control_dist">Enter Persona Controller     {/* //   create persona start // */}s</label>
                        </div>
                        <div className="col-xs-7">
                            <TagsInput {...inputAttrs} value={this.state.control_list} onChange={(e) => { this.onFieldChange("control_list", e) }} />
                        </div>
                    </div>
                    <br></br>
                    <div className="row">
                        <div className="col-sm-12">
                            <button className="btn btn-primary pull-right submit-button" data-loading-text="Submit" name="submit-form" type="button" onClick={this.createDimension.bind(this)}>Create Persona</button>
                        </div>
                    </div>
                    <br></br>
                </form>
                {this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
            </div>{/*CreateDimensionContainer*/}

        </div>{/*tabpanel addDimension*/}

    </div>{/*tab-content*/}

</div>{/*modal-body*/ }

