import React from 'react';
import PropTypes from 'prop-types';
import ReactDom from 'react-dom';
import './App.css';
import Tree from './Tree.js';



class TreeNode extends React.Component {
    constructor(props) {
        super(props);
        this.name = props.name;
        this.parent = props.parent;
        if(props.children){
            this.children = props.children;
        }
        this.addChild = this.addChild.bind(this)
    }
    addChild(child){
        child.parent = this;
        this.children.concat(child)
    }
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
    id: PropTypes.string,
    parent: TreeNode,
    children: PropTypes.array,
    type: PropTypes.string
}
TreeNode.defaultProps = {
    name: '//',
}

class Tree extends React.Component{
    constructor(props) {
        super(props);

    }

}

class Methods extends React.Component{
    constructor(props) {
        super();
        this.root = new TreeNode({key:0, name: '//', parent:null, children:[]})
        this.state = {
            command: '',
            nodeName: '//',
            nodeType: 'directory',
            counter: 0,
            treeNodeList: this.root.children
        }
        this.traverseDF = this.traverseDF.bind(this);
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.findIndex = this.findIndex.bind(this)
        this.contains = this.contains.bind(this)
        this.handleCommand = this.handleCommand.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.addChild = this.addChild.bind(this)

        this.dfs = this.dfs.bind(this)
    }
    traverseDF(callback) {
    // this is a recurse and immediately-invoking function
    (function recurse(currentNode) {
        // step 2
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            // step 3
            recurse(currentNode.children[i]);
        }

        // step 4
        callback(currentNode);

        // step 1
    })(this._root);
    };
    contains(callback, traversal) {
        traversal.call(this, callback);
    };

    add(data, toData, traversal) {
        var child = new TreeNode(data),
            parent = null,
            callback = function(node) {
                if (node.data === toData) {
                    parent = node;
                }
            };

        this.contains(callback, traversal);

        if (parent) {
            parent.children.push(child);
            child.parent = parent;
        } else {
            throw new Error('Cannot add node to a non-existent parent.');
        }
    };

    remove(data, fromData, traversal) {
        var tree = this,
            parent = null,
            childToRemove = null,
            index;

        var callback = function(node) {
            if (node.data === fromData) {
                parent = node;
            }
        };

        this.contains(callback, traversal);

        if (parent) {
            index = this.findIndex(parent.children, data);

            if (index === undefined) {
                throw new Error('Node to remove does not exist.');
            } else {
                childToRemove = parent.children.splice(index, 1);
            }
        } else {
            throw new Error('Parent does not exist.');
        }

        return childToRemove;
    };

    findIndex(arr, data) {
        var index;

        for (var i = 0; i < arr.length; i++) {
            if (arr[i].data === data) {
                index = i;
            }
        }

        return index;
    }

    dfs(start, target){
      console.log("Visiting Node " + start.name);
        if (start.name === target) {
            // We have found the goal node we we're searching for
            console.log("Found the node we're looking for!");
            return start;
        }

        // Recurse with all children
        for (var i = 0; i < start.children.length; i++) {
            var result = this.dfs(start.children[i], target);
            if (result != null) {
                // We've found the goal node while going down that child
                return result;
            }
        }

        // We've gone through all children and not found the goal node
        console.log("Went through all children of " + start.value + ", returning to it's parent.");
        return null;
    };

    addChild(child){
        var currentTreeList = [];

        var targetName = child.name.substr(0, child.name.lastIndexOf('/'))
        if(child.name.lastIndexOf('/') === 0){
            targetName = '//' //child.name.substr(0, child.name.lastIndexOf('/'))
        }
        var parent = this.dfs(this.root,targetName)
        parent.addChild(child)
        currentTreeList = currentTreeList.concat(this.root)
        console.log('new list ', currentTreeList)
    }
    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }
    handleCommand() {
        var command = this.state.command.split(' ');
        console.log(command)// split the user's command
        if ('add' === command[0]) {
            //var par = this.findParent(command[2]);
            this.setState({
                nodeType: command[1],
                nodeName: command[2],
                counter: this.state.counter + 1,
            }, () => {
                var current = new TreeNode({key: this.state.counter, id: this.state.counter.toString(), name: this.state.nodeName, type: this.state.nodeType, children: []})
                console.log('current node: ', current)
                this.addChild(current)
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

Tree.propTypes = {
    root: TreeNode
}

export default Tree;