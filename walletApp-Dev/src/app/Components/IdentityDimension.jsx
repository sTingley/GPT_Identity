import React, { Component } from 'react';




//Dimension Category will be chosen when user is creating a dimension,
//then the categories will later be populated with a request
class DimensionCategoryRow extends React.Component {

    render() {
        return <tr><th colSpan="4">{this.props.dimension}</th></tr>
    }
}

/*
    DIMENSION ROW is renders in DIMENSION TABLE
    
    TODO:
    -- POPULATE DIMENSIONS WITH REQUEST RESULT
    -- add OnCLICK logic for 'UPDATE'
    
*/
class DimensionRow extends React.Component {
    

    deleteDimension(id){
        alert("Are you sure?")
        this.props.onDelete(id)
    }

    render() {
        console.log("DIMENSION ROW PROPS: " + JSON.stringify(this.props))

        var name = this.props.dimension.owned ? this.props.dimension.name :
            <span style={{ color: 'red' }}>
                {this.props.dimension.name}
            </span>;
        return (
            <tr>
                <td>{name}</td>
                <td>{this.props.dimension.ID}</td>
                <td>
                <button className="btn btn-warning">Update</button>
                </td>
                <td>
                <button className="btn btn-danger" onClick={this.deleteDimension.bind(this, this.props.dimension.ID)}>Delete</button>
                </td>
            </tr>
            
        );
    }

}


/*
    DIMENSION TABLE RENDERS BOTH DIMENSON ROW and DIMENSIONCATEGORY ROW
*/
class DimensionTable extends React.Component {


    deleteDimension(id) {

        this.props.onDelete(id)
    }

    render() {
        var rows = []
        //used to check last index in dimensions array
        var lastType = null

        this.props.dimensions.forEach((dimension) => {
            if (dimension.name.indexOf(this.props.filterText) === -1 ||
            (!dimension.owned && this.props.owned_Only)) {

                return
            }
            if (dimension.dimensionType !== lastType) {
                rows.push(
                    <DimensionCategoryRow
                        dimensionType={dimension.dimensionType}
                        key={dimension.dimensionType}
                        />
                );
            }
            rows.push(
                <DimensionRow
                    dimension={dimension}
                    key={dimension.name}
                    onDelete={this.deleteDimension.bind(this) }/>
            );

            lastType = dimension.dimensionType;

        });

        return (
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>NAME</th>
                        <th>Reference</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        )

    }
} //end DimensionTable


class SearchBar extends React.Component {

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this)
    }

    handleChange() {
        this.props.onUserInput(
            this.filterTextInput.value,
            this.owned_onlyInput.checked
        );
    }

    render() {
        console.log("search bar props: " + JSON.stringify(this.props))
        return (
            <form>
                <input
                    type="text"
                    placeholder="Search..."
                    value={this.props.filterText}
                    ref={(input) => this.filterTextInput = input}
                    onChange={this.handleChange}
                    />
                <p>
                    <input
                        type="checkbox"
                        checked={this.props.owned_Only}
                        ref={(input) => this.owned_onlyInput = input}
                        onChange={this.handleChange}
                        />
                    {' '}
                    show OWNED dimensions
                </p>
                <h3></h3>
            </form>
        );
    }
}


class FilterableDimensionTable extends React.Component {

    constructor() {
        super();
        this.state = {
            filterText: '',
            owned_only: false
        }

        this.handleUserInput = this.handleUserInput.bind(this);
    }
    
    handleAddDimension(dimension) {
        let dimensions = this.props.dimensions;
        dimensions.push(dimension);
    }

    handleUserInput(filterText, owned_only) {
        this.setState({
            filterText: filterText,
            owned_only: owned_only
        });
    }

    render() {
        console.log("DIMENSION TABLE PROPS: " + JSON.stringify(this.props))
        console.log("STATE OF TABLE" + this.state)
        return (
            <div>
                
                <SearchBar
                    filterText={this.state.filterText}
                    owned_only={this.state.owned_only}
                    onUserInput={this.handleUserInput}
                    />
                <DimensionTable
                    dimensions={this.props.dimensions}
                    filterText={this.state.filterText}
                    owned_Only={this.state.owned_only}
                    onDelete={this.props.onDelete}
                    key={this.props.dimensions.dimensionType}
                    />
            </div>
        );
    }
}

class AddDimension extends React.Component {

    constructor() {
        super();
        this.state = {
            newDimension: {},
            files: ['FinanceReport.xls', 'Contacts.json', 'My_DOC.pdf']

        }
    }
    
    handleSubmit(e){
        if(this.refs.dimensionType.value === ''){
            alert('descriptor is required')
        } else {
            console.log("**************************")
            this.setState({newDimension:{
                ID: '23121',
                dimensionType: this.refs.descriptor.value,
                owned: true
            }}, function(){
                this.props.addDimension(this.state.newDimension)
            })
        }
    }

    render() {

        let files = this.state.files.map(option => {
            return <option key={option} value={option}>{option}</option>
        });
        return (
            <div>
                <h3> Add Dimension </h3>
                <form onSubmit={this.handleSubmit.bind(this) }>
                    <div>
                        <label>Descriptor:</label><br />
                        <input type="text" ref="descriptor" />

                    </div>
                    <div>
                        <label>Select File: </label><br />
                        <select ref="category"> {files} </select>

                    </div>
                    <br />
                    <input type="submit" value="Submit" />
                    <br />
                </form>
            </div>
        )
    }

}


class Modal extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            
            dimensions: []
        }
    }
    
    getDimensions(){
        this.setState({dimensions: [
            { dimensionType: 'Sporting Goods', ID: '12234', owned: true, name: 'Football' },
            { dimensionType: 'PERSONAL', ID: '34334', owned: true, name: 'iPod Touch' },
            { dimensionType: 'Electronics', ID: '56676', owned: false, name: 'iPhone 5' }
        ]})
    }
    
    handleAddDimension(dimension){
        let dimensions = this.state.dimensions;
        dimensions.push(dimension);
        this.setState({dimensions: dimensions})
    }
    
    handleDeleteDimension(id){
        let dimensions = this.state.dimensions;
        let index = dimensions.findIndex(x => x.ID === id);
        dimensions.splice(index, 1);
        this.setState({dimensions: dimensions})
    }
    
    componentWillMount(){
        this.getDimensions();
    }

    render() {
        console.log("MODAL props" + JSON.stringify(this.props))
        return (
            <div className="dimension-container">
                <h3> Identity Dimensions </h3>
                <FilterableDimensionTable dimensions={this.state.dimensions} onDelete={this.handleDeleteDimension.bind(this)} />
                <AddDimension addDimension={this.handleAddDimension.bind(this)} />
            </div>
        )
    }

}


export default Modal
