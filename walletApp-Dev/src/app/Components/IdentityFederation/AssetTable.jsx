import React, { Component } from 'react';
import TagsInput from 'react-tagsinput';
import AssetTags from '../classAndSubClass.js';

class AssetTable extends React.Component {

    constructor(props) {

        super(props);
        this.tags = new AssetTags(this.props.asset.asset_id);
        this.state = {
            asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses"),
        }
    }

    handleClassChange(tags) {
		this.setState({ asset_class: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "classes");
	}

	handleSubClassChange(tags) {
		this.setState({ asset_subclass: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "subclasses");
	}

    renderICA() {
        return (<p>Normal</p>)
    }

    render() {

        console.log("got to the asset table render")
        var prop = this.props.asset.asset_details;
        var style = { fontSize: '12.5px' }

        var classInput = {
			addKeys: [13, 188], // Enter and comma
			value: this.state.asset_class,
			onChange: this.handleClassChange,
			inputProps: { placeholder: "" }
		};
		var subClassInput = {
			addKeys: [13, 188], // Enter and comma
			value: this.state.asset_subclass,
			onChange: this.handleSubClassChange.bind(this),
			inputProps: { placeholder: "" }
		};

        return (
            <div id="AssetTable">
                <table className="table table-striped table-hover" style={style}>
                    <tbody>
                        <tr>
                            <td>Asset Name</td>
                            <td>{this.props.asset.asset_id}</td>
                        </tr>
                        <tr>
                            <td>Asset Class<p className="text-info">Use comma/enter to add class </p></td>
                            <td><TagsInput {...classInput} /></td>
                        </tr>
                        {/* <tr>
                        <td>Asset SubClass<p className="text-info">Use comma/enter to add sub class </p></td>
                        <td><TagsInput {...subClassInput} /></td>
                    </tr>
                    <tr>
                        <td>COID Contract address</td>
                        <td><p><b> {prop.coidAddr} </b></p></td>
                    </tr>
                    <tr>
                        <td>Gatekeeper Contract address</td>
                        <td><p><b> {prop.gatekeeperAddr} </b></p></td>
                    </tr>
                    <tr>
                        <td>Dimension Control address</td>
                        <td><p><b> {prop.dimensionCtrlAddr} </b></p></td>
                    </tr>
                    <tr>
                        <td>BigchainDB Transaction ID</td>
                        <td><p> {prop.bigchainID} </p></td>
                    </tr>
                    <tr>
                        <td>BigchainDB Transaction Hash</td>
                        <td><p> {prop.bigchainHash} </p></td>
                    </tr> */}
                        {/* <tr>
                        <td colSpan="2"><b>Official IDs</b></td>
                    </tr> */}
                        {(() => {
                            var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                            if (!$.isEmptyObject(prop.uniqueIdAttributes)) {
                                return prop.uniqueIdAttributes.map((ids, i) => {
                                    if (ids[2].charAt(0) == "Q") {
                                        return (
                                            <tr key={i}>
                                                <td>{ids[0]}</td>
                                                <td><p>Validation ID: {ids[1]}</p><p>Data Pointer: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
                                            </tr>
                                        )
                                    }
                                    else {
                                        return (
                                            <tr key={i}>
                                                <td>{ids[0]}</td>
                                                <td><p>Validation ID: {ids[1]}</p><p>Data Pointer: <a href="javascript:" onClick={(e) => { this.bigchainGet(ids[2]) }}>{ids[2]}</a></p></td>
                                            </tr>
                                        )
                                    }
                                });
                            } else {
                                return <tr><td colSpan="2">No Ids found</td></tr>
                            }
                        })(this)}
                        <tr>
                            <td>Membership Holding Token Description</td>
                            <td><p>{prop.ownershipTokenAttributes}</p></td>
                        </tr>
                        <tr>
                            <td>Membership Holding ID</td>
                            <td><p> {prop.ownershipId}</p></td>
                        </tr>
                        <tr>
                            <td>Membership Holding ID List</td>
                            <td>{(() => {
                                if (!$.isEmptyObject(prop.ownerIdList)) {
                                    return prop.ownerIdList.map((ids, i) => {
                                        return <p key={i}> {prop.ownerIdList[i]}</p>
                                    })
                                }
                            })(this)}
                            </td>
                        </tr>
                        <tr>
                            <td>Membership Holding Token Quantity</td>
                            <td>{(() => {
                                if (!$.isEmptyObject(prop.ownershipTokenQuantity)) {
                                    return prop.ownershipTokenQuantity.map((ids, i) => {
                                        return <p key={i}> {prop.ownershipTokenQuantity[i]}</p>
                                    })
                                }
                            })(this)}
                            </td>
                        </tr>
                        <tr>
                            <td>Membership Holding Token ID</td>
                            <td><p> {prop.ownershipTokenId}</p></td>
                        </tr>
                        <tr>
                            <td>Delegation Token Description</td>
                            <td><p>{prop.controlTokenAttributes}</p></td>
                        </tr>
                        <tr>
                            <td>Delegation ID</td>
                            <td><p> {prop.controlId}</p></td>
                        </tr>
                        <tr>
                            <td>Delegation ID List</td>
                            <td>{(() => {
                                if (!$.isEmptyObject(prop.controlIdList)) {
                                    return prop.controlIdList.map((ids, i) => {
                                        return <p key={i}> {prop.controlIdList[i]}</p>
                                    })
                                }
                            })(this)}
                            </td>
                        </tr>
                        <tr>
                            <td>Delegation Token Quantity</td>
                            <td>{(() => {
                                if (!$.isEmptyObject(prop.controlTokenQuantity)) {
                                    return prop.controlIdList.map((ids, i) => {
                                        return <p key={i}> {prop.controlTokenQuantity[i]}</p>
                                    })
                                }
                            })(this)}
                            </td>
                        </tr>
                        <tr>
                            <td>Delegation Token ID</td>
                            <td> <p> {prop.controlTokenId}</p></td>
                        </tr>
                        <tr>
                            <td>Recovery IDs</td>
                            <td>{(() => {
                                if (!$.isEmptyObject(prop.identityRecoveryIdList)) {
                                    return prop.identityRecoveryIdList.map((ids, i) => {
                                        return <p key={i}> {prop.identityRecoveryIdList[i]}</p>
                                    })
                                }
                            })(this)}
                            </td>
                        </tr>
                        <tr>
                            <td>Recovery Condition</td>
                            <td> <p> {prop.recoveryCondition}</p></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
} export default AssetTable