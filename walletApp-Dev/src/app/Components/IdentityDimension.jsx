import React, { Component } from 'react';


class DimensionEntry extends Component {
    
    deleteDimension(id){
        this.props.onDelete(id);
    }
    
    render(){
        return (
            <li className="Dimension">
            <strong>{this.props.identityDimensions.title}</strong>: {this.props.identityDimensions.ID} <a href="#" onClick={this.deleteDimension.bind(this, this.props.identityDimensions.ID)}>X</a>
            </li>
        )
    }
}



class IdentityDimensions extends Component {

    
    deleteDimension(id){
        
        this.props.onDelete(id)
    }
    
    render(){
        let dimensions;
        console.log(this.props)
        if(this.props.dimensions){
            dimensions = this.props.dimensions.map(dim => {
                console.log(dim)
                return (
                    <DimensionEntry onDelete={this.deleteDimension.bind(this)} key={dim.title} identityDimensions={dim} />
                );
            });
        }
        return (
            <div className="Dimensions">
            <h3> CURRENT DIMENSIONS </h3>
            {dimensions}
            </div>
        )
    }
    
    

}

class AddDimension extends Component {
    
    constructor(){
        super();
        this.state = {
            newDimension: {},
            categories: ['Finance', 'Web', 'Personal']
        }
        //propTypes = {}
    }
    
    handleSubmit(e){
        if(this.refs.title.value === ''){
            alert('title is required')
        } else {
            this.setState({newDimension:{
                ID: '23121',
                title: this.refs.title.value,
                category: this.refs.category.value
            }}, function(){
                this.props.addDimension(this.state.newDimension)
            })
        }
    }

    render(){
        let categoryOptions = this.state.categories.map(category => {
            return <option key={category} value={category}>{category}</option>
        });
        return (
            <div>
            <h3>Add Dimension</h3>
            <form onSubmit={this.handleSubmit.bind(this)}>
            
            <div>
            <label>Title</label><br />
            <input type="text" ref="title" />
            </div>
            <div>
            <label>Category</label><br />
            <select ref="category">
              {categoryOptions}
            </select>
            </div>
            <br />
            <input type="submit" value="Submit" />
            <br />
            </form>
            
            </div>
        );
    }
    
    
}


class Modal extends Component {
    
    constructor(){
        super();
        this.state = {
            iDimensions: []
        }
    }
    
    getDimensions(){
        this.setState({iDimensions: [
            {
                ID: 123124, dimensionType: "financial"
            },
            {
                ID: 342342, dimensionType: "education"
            },
            {
                ID: 212144, dimensionType: "personal"
            }
        ]})
    }
    
    componentWillMount(){
        this.getDimensions();
    }
    
    handleAddDimension(dimension){
        let dimensions = this.state.iDimensions;
        dimensions.push(dimension);
        this.setState({iDimensions: dimensions})
    }
    
    handleDeleteDimension(id){
        let dimensions = this.state.iDimensions;
        let index = iDimensions.findIndex(x => x.id === id);
        dimensions.splice(index, 1);
        this.setState({iDimensions: dimensions})
    }
    
    render(){
        return (
            <div className="dimension-container">
            <AddDimension addDimension={this.handleAddDimension.bind(this)} />
            <IdentityDimensions dimensions={this.state.iDimensions} onDelete={this.handleDeleteDimension.bind(this)} />
            </div>
        );
    }
    
};


export default Modal

