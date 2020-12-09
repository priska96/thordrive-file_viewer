import React from 'react';
import PropTypes from 'prop-types';
import ReactDom from 'react-dom';
import './App.css';


class TreeNode extends React.Component {
    render() {
        let childNodes = null;
        // TreeNode Component calls itself if children exist
        if (this.props.children) {
            childNodes = this.props.children.map(function (child) {
                return (<TreeNode
                    key={child.key}
                    id={child.id}
                    name={child.name}
                    type={child.type}
                    children={child.children}
                />)
            })
        }
        //return the current treeNode
        // display children if existent
        return (
            <li id={this.props.id}>{this.props.name}
                {childNodes ? <ul>{childNodes}</ul> : null}
            </li>
        )
    }
}

TreeNode.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    visible: PropTypes.bool,
    type: PropTypes.string.isRequired,
    children: [TreeNode],
    leafs: [TreeNode]
}
TreeNode.defaultProps = {
    name: '//',
    id: '0',
    type: 'directory',
    children: [],
}

class Methods extends React.Component {
    constructor() {
        super();
        this.state = {
            command: '',
            nodeName: '//',
            nodeType: 'directory',
            parent: null,
            treeNodeList: [TreeNode],
            counter: 0,
        };
        this.add = this.add.bind(this);
        this.delete = this.delete.bind(this);
        this.move = this.move.bind(this);
        this.link = this.link.bind(this);
        this.handleCommand = this.handleCommand.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.findParent = this.findParent.bind(this);
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    add() {

        var current = TreeNode({key: this.state.counter, id: this.state.counter.toString(), name: this.state.nodeName, type: this.state.nodeType, children: []})
        var currentList = [...this.state.treeNodeList];
        var newList = [...this.state.treeNodeList];
        var parent_elem = newList[newList.findIndex(item => item.key === this.state.parent.key)]
        parent_elem.children = parent_elem.children.concat(current)
        newList[this.state.parent.key] = parent_elem
        /*newList = newList.concat({
            key: this.state.counter,
            id: this.state.counter.toString(),
            name: this.state.nodeName,
            type: this.state.nodeType,
            children: []
        })*/
       this.setState({
            treeNodeList: newList,
            nodeList: newList.concat(current)
        })
    }

    delete() {
        const newList = this.state.treeNodeList.filter((item) => item.name !== this.state.nodeName); // remove by filtering
        this.setState({treeNodeList: newList});
    }

    move() {
        return ReactDom.render(<TreeNode/>, document.getElementById('a'))
    }

    link() {
        ReactDom.unmountComponentAtNode(document.getElementById('a'))
    }

    findParent(nodeName) {
        var idx = nodeName.lastIndexOf('/')
        var parentName = nodeName.substring(0, idx)
        if (idx === 0) parentName = nodeName.substring(0, idx + 1) + '/' // root
        return this.state.nodeList.filter((item) => item.name === parentName)[0];
    }

    handleCommand() {
        var command = this.state.command.split(' ');
        console.log(command)// split the user's command
        if ('add' === command[0]) {
            var par = this.findParent(command[2]);
            console.log('current node: ', command[2], 'parent node: ', par)
            this.setState({
                nodeType: command[1],
                nodeName: command[2],
                counter: this.state.counter + 1,
                parent: par
            }, () => {
                this.add()
            })
        } else if ('delete' === command[0]) {
            this.setState({
                nodeType: command[1],
                nodeName: command[2]
            }, () => {
                this.delete()
            });
        } else if ('move' === command[0]) {
            this.setState({
                nodeType: command[1],
                nodeName: command[2]
            }, () => {
                this.move()
            });
        } else if ('link' === command[0]) {
            this.setState({
                nodeType: command[1],
                nodeName: command[2]
            }, () => {
                this.link()
            });
        } else {
            console.log('else')
        }

    }

    render() {
        console.log('render methods treeNodeList: ', this.state.treeNodeList)
        let treeNodes = this.state.treeNodeList.map(function (treeNode) {
            return (<TreeNode
                key={treeNode.key}
                id={treeNode.id}
                name={treeNode.name.split('/')[-1]}
                type={treeNode.type}
                children={treeNode.children}
            />)
        })
        return (
            <div>
                <button onClick={this.handleCommand}>Go</button>
                <label>User Command
                    <input
                        type="text"
                        name="command"
                        value={this.state.command}
                        onChange={this.handleChange}
                    />
                </label>
                <button onClick={this.delete}>Delete</button>
                <button onClick={this.move}>Move</button>
                <button onClick={this.link}>Link</button>
                <ul id="treeRoot">{treeNodes}</ul>
            </div>
        )
    }
}

export default Methods;