import React, { Component } from 'react';
import DayPicker from "react-day-picker";
import TagsInput from 'react-tagsinput';

//(for adding control tokens thru delegations)
class DimensionDelegationForm extends React.Component {

    constructor(props) {
        super(props)
        //{"max":"10","labelref":"input1-1"}
        this.state = {

            selectedDay: new Date(),
            showCalendar: false
        };

        this.maxDelegations = this.props.max;
        this.changeExpiration = this.changeExpiration.bind(this);
        this.selectDay = this.selectDay.bind(this);

        // MOVE THIS TO THE PART WHERE WE GET THE VALUES !!!!! !!!!! !!!!! !!!!! !!!!!
        //let day = this.state.selectedDay;
        //let sigExpire = day.getTime() / 1000;
    }

    changeExpiration() {
        let expirations = document.getElementById("expireSelect-" + this.props.labelref);
        if (expirations.selectedIndex == 1) {
            this.setState({ showCalendar: true });
        }
        else { this.setState({ showCalendar: false }) }
    }

    //this function writes the expirations in local storage...
    //remember to remove them when creating a dimension/adding a delegation!!!
    selectDay(day) {
        this.state.selectedDay = day;
        day = day.getTime() / 1000;
        localStorage.setItem("expiration-" + this.props.labelref, day);
    }

    render() {
        var style = { fontSize: '12.5px' }
        var basicAttrs = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "Control Token Quantity",
                style: { width: '50%' }
            }
        };

        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <table className="table table-striped table-hover" style={style}>
                        <tbody>
                            <tr>
                                <th><b>Delegatee</b></th>
                                <th><b># of Tokens</b></th>
                            </tr>
                            <tr>
                                <td><TagsInput {...this.props.attr} maxTags={1} className="form-control col-md-4" type="text" renderInput={this.props.autocompleteRenderInput} value={this.props.deleValue} onChange={this.props.passedFunction} /></td>
                                <td><TagsInput {...basicAttrs} maxTags={1} name={'delegatee-' + this.props.labelref} className="form-control col-md-4" type="text" value={this.props.deleToken} onChange={this.props.passedFunction2} /></td>
                            </tr>
                            <tr>
                                <td><b>Will the sharing expire?</b></td>
                                <td>
                                    <select id={'expireSelect-' + this.props.labelref} onChange={this.changeExpiration}>
                                        <option value="selectOption">--- Please select ---</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {(() => {
                                        if (this.state.showCalendar == true) {
                                            return (
                                                <DayPicker
                                                    ref={'expiration-' + this.props.labelref}
                                                    name={'expiration-' + this.props.labelref}
                                                    disabledDays={{ daysOfWeek: [0] }}
                                                    onDayClick={day => this.selectDay(day)}
                                                />
                                            )
                                        }
                                    })(this)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
};

export default DimensionDelegationForm