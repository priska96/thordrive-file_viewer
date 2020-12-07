import React from 'react';
import PropTypes from 'prop-types';
import ReactDom from 'react-dom';
import './App.css';

class Rectangle extends React.Component{
  render(){
      let name = this.props.name
      return (
            <div className="Rectangle" style={{width: 300+'px', height: 50+'px', border: 1+'px solid black'}}>
                {name}
            </div>
      );
  }
  static defaultProps = {
      name: '/',
      type: 'directory'
  }
  static propTypes = {
      name: PropTypes.string.isRequired,
      visible: PropTypes.bool,
      type: PropTypes.string.isRequired,
  }
}

class Methods extends React.Component{
    add(){
        return ReactDom.render(<Rectangle/>, document.getElementById('a'))
    }
    delete(){
        ReactDom.unmountComponentAtNode(document.getElementById('a'))
    }
    move(){
        return ReactDom.render(<Rectangle/>, document.getElementById('a'))
    }
    link(){
        ReactDom.unmountComponentAtNode(document.getElementById('a'))
    }
    render(){
        return (
            <div>
                <button onClick={this.add.bind(this)}>Add</button>
                <button onClick={this.delete.bind(this)}>Delete</button>
                <button onClick={this.move.bind(this)}>Move</button>
                <button onClick={this.link.bind(this)}>Link</button>
                <div id="a"></div>
            </div>
            )
    }
}
export default Methods;