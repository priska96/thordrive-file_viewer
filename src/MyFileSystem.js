//https://github.com/guotsuan/pyTree
import React from "react";
import PropTypes from "prop-types";
import './App.css';
//import Popup from 'reactjs-popup';
//import 'reactjs-popup/dist/index.css';

function sanitizeID(identifier) {
    return identifier//.toString().trim().replace(" ", "_");
}

/*function executeFunctionByName(functionName, context , args ) {
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
}*/

function nthLastIndexOf(str, searchString, n) {
    if (str === null) {
        return -1;
    }
    if (!n || isNaN(n) || n <= 1) {
        return str.lastIndexOf(searchString);
    }
    n--;
    return str.lastIndexOf(searchString, nthLastIndexOf(str, searchString, n) - 1);
}


/*function dfs(start, target){
  console.log("Visiting Node " + start.name);
    if (start.name === target) {
        // We have found the goal node we we're searching for
        console.log("Found the node we're looking for!");
        return start;
    }

    // Recurse with all children
    for (var i = 0; i < start.children.length; i++) {
        var result = dfs(start.children[i], target);
        if (result != null) {
            // We've found the goal node while going down that child
            return result;
        }
    }

    // We've gone through all children and not found the goal node
    console.log("Went through all children of " + start.value + ", returning to it's parent.");
    return null;
}*/


/*const bfs = function (graph, start) {
    //A Queue to manage the nodes that have yet to be visited
    var queue = [];
    //Adding the node to start from
    queue.push(start);
    //A boolean array indicating whether we have already visited a node
    var visited = [];
    //(The start node is already visited)
    visited[start] = true;
    // Keeping the distances (might not be necessary depending on your use case)
    var distances = []; // No need to set initial values since every node is visted exactly once
    //(the distance to the start node is 0)
    distances[start] = 0;
    //While there are nodes left to visit...
    while (queue.length > 0) {
        console.log("Visited nodes: " + visited);
        console.log("Distances: " + distances);
        var node = queue.shift();
        console.log("Removing node " + node + " from the queue...");
        //...for all neighboring nodes that haven't been visited yet....
        for (var i = 1; i < graph[node].length; i++) {
            if (graph[node][i] && !visited[i]) {
                // Do whatever you want to do with the node here.
                // Visit it, set the distance and add it to the queue
                visited[i] = true;
                distances[i] = distances[node] + 1;
                queue.push(i);
                console.log("Visiting node " + i + ", setting its distance to " + distances[i] + " and adding it to the queue");

            }
        }
    }
    console.log("No more nodes in the queue. Distances: " + distances);
    return distances;
};

module.exports = {bfs};*/
let globalTreeNodes = {};
let globalRemoveNodes = [];

class Node extends React.Component {
    constructor(props) {
        super(props);
        this.tag = props.tag;
        this.identifier = props.identifier;
        if (props.fpointer) this.fpointer = props.fpointer;
        if (props.bpointer) this.bpointer = props.bpointer;
        if (props.type) this.type = props.type;
        if (props.treeNodes) this.treeNodes = props.treeNodes;
        if (props.properties) this.properties = props.properties;
        if (props.link) this.link = props.link;
        if (props.linkTo) this.linkTo = props.linkTo;
        this.updateFPointer = this.updateFPointer.bind(this);
        this.updateLinkTo = this.updateLinkTo.bind(this);
        this.updateIdentifier = this.updateIdentifier.bind(this);
        this.updateSizeProp = this.updateSizeProp.bind(this);
        this.updateProperties = this.updateProperties.bind(this);
    }

    updateFPointer(identifier, mode) {
        if (mode === "add") {
            this.fpointer = this.fpointer.concat(identifier);
        } else if (mode === "delete") {
            this.fpointer = this.fpointer.filter(x => x !== identifier);
        } else if (mode === "move") {
            this.fpointer = identifier;
        }
        this.updateSizeProp()
    }

    updateLinkTo(identifier, mode) {
        if (mode === "add") {
            this.linkTo = this.linkTo.concat(identifier);
        } else if (mode === "delete") {
            this.linkTo = this.linkTo.filter(x => x !== identifier);
        } else if (mode === "insert") {
            this.linkTo = [identifier];
        }
    }

    updateProperties(prop) {
        if (prop === 'hide') {
            this.properties.hide = !(this.properties.hide)
        }
    }

    updateSizeProp() {
        //   this.properties.size = this.fpointer.length > 0 ? this.fpointer.length.toString() + 'KB' : '1KB'
    }


    updateIdentifier(thisNodes, nodeFrom) {
        let node = this;
        node.identifier = nodeFrom.identifier + '/' + node.tag
        if (this.fpointer.length === 0) {
            return true;
        }
        Object.values(thisNodes).filter(key => node.fpointer.includes(key.identifier)).map(function (child) {
            return child.updateIdentifier(thisNodes, node)
        })
    }


    render() {
        let childNodes = null;
        // TreeNode Component calls itself if children exist
        if (this.props.fpointer) {
            //console.log(this.props.treeNodes)
            //console.log('current node: ', this.props.tag, 'children: ', this.props.fpointer)
            childNodes = this.props.treeNodes.filter(key => this.props.fpointer.includes(key.identifier)).map(function (child) {
                return (<Node
                    key={child.identifier}
                    identifier={child.identifier}
                    tag={child.tag}
                    type={child.type}
                    fpointer={child.fpointer}
                    treeNodes={Object.values(globalTreeNodes)}
                    properties={child.properties}
                    link={child.link}
                />)
            })
        }
        let iconClass = 'fa fa-folder-open';
        let fileExtension = '';
        let visibility = '';
        if (this.props.type === 'file') {
            iconClass = 'fa fa-code'
            fileExtension = '.' + this.props.properties.fileExtension
        }
        if (this.props.properties.hide) {
            visibility = '(hidden)';
        }
        //return the current treeNode
        // display children if existent
        return (
            <li id={this.props.identifier} className={this.props.type}>
                <i className={iconClass}></i>{this.props.link ?
                <i className="fas fa-share"></i> : null} {this.props.tag}{fileExtension}<span> - {this.props.properties.size} {visibility}</span>
                {childNodes ? <ul>{childNodes}</ul> : null}
            </li>
        )
    }


}

Node.propTypes = {
    tag: PropTypes.string,
    identifier: PropTypes.string,
    fpointer: PropTypes.array,
    bpointer: PropTypes.string,
    type: PropTypes.string,
    treeNodes: PropTypes.array,
    properties: PropTypes.object,
    link: PropTypes.string,
    linkTo: PropTypes.array,
};

Node.defaultProps = {
    tag: "",
    identifier: "",
    fpointer: [],
    bpointer: '',
    type: 'directory',
    treeNodes: [],
    properties: {size: '1KB', hide: false, fileExtension: 'txt'},
    link: '',
    linkTo: []
};

class Tree extends React.Component {
    constructor(props) {
        super(props);
        this.nodes = props.nodes;
        this.root = props.root;
        this.addNode = this.addNode.bind(this);
        this.updateBPointer = this.updateBPointer.bind(this)
        this.updateFPointer = this.updateFPointer.bind(this);
        this.createNode = this.createNode.bind(this);
        this.createNodeRecursive = this.createNodeRecursive.bind(this)
        this.removeNode = this.removeNode.bind(this);
        this.moveNode = this.moveNode.bind(this);
        this.linkNode = this.linkNode.bind(this);
        this.isAncestor = this.isAncestor.bind(this);
        this.updateIdentifier = this.updateIdentifier.bind(this)
    }

    isAncestor(ancestor, grandChild) {
        /***Check if the @ancestor the preceding nodes of @grandchild.
         :param ancestor: the node identifier
         :param grandchild: the node identifier
         :return: True or False
         ***/
        /*var parent = this.nodes[grandChild].predecessor(this._identifier)
        var child = ancestor
        while(parent !== null)
            if(parent === ancestor) {
                return true
            }
            else {
                child = this.nodes[child].predecessor(this._identifier)
                parent = this.nodes[child].predecessor(this._identifier)
            }*/
        return false
    }

    updateFPointer(nid, identifier, mode) {
        if (nid === null || mode === 'link') {
            return false;
        } else {
            this.nodes[nid].updateFPointer(identifier, mode);
        }
    }

    updateBPointer(nid, identifier) {
        if (nid === '/') return
        this.nodes[nid].bpointer = identifier
    }

    updateIdentifier() {
        var nodes = this.nodes
        globalRemoveNodes.forEach(function (key) {
            nodes[nodes[key].identifier] = nodes[key]
            delete nodes[key]
        })
        this.nodes = nodes
    }

    createNodeRecursive(tag, identifier, type, parent, mode, recLvl) {
        let that = this;
        if (parent === '') parent = '/'
        var node;
        if (this.nodes[parent]) { // stop recursion when parent exists
            node = new Node({
                tag: tag,
                identifier: identifier,
                fpointer: [],
                bpointer: null,
                type: type,
                link: '',
                linkTo: [],
                properties: {}
            });
            this.addNode(node, parent, mode);
            return [true, node];
        }
        that.createNodeRecursive(parent.substring(parent.lastIndexOf('/') + 1), parent, 'directory', parent.substring(0, parent.lastIndexOf('/')), 'add', recLvl + 1)
        node = new Node({
            tag: tag,
            identifier: identifier,
            fpointer: [],
            bpointer: null,
            type: type,
            link: '',
            linkTo: [],
            properties: {}
        });
        this.addNode(node, parent, mode);
        return [true, node];
    }

    createNode(tag, identifier, type, parent, mode) {
        // Exception Handling
        var errorMsg;
        if (mode !== 'link') {
            if (parent) {
                //parent does not exist
                if (!(this.nodes[parent])) {
                    errorMsg = {
                        open: true,
                        messageText: 'The provided parent directory does not exist. Do you wish to create the parent directories?',
                        messageTitle: 'Error: Parent does not exist',
                        icon: 'fas fa-times-circle',
                        proceed: 'Proceed',
                        cancel: 'Close',
                        callback: 'addRecursive'
                    }
                    return [false, errorMsg];
                }
                // parent is file
                if (this.nodes[parent].type === 'file') {
                    errorMsg = {
                        open: true,
                        messageText: `You tried to create the ${type} ${tag} inside a file. That is not possible.`,
                        messageTitle: 'Error: Parent is type of file',
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                    return [false, errorMsg];
                }
            }
            // file/directory exists already in directory
            if (identifier in this.nodes) {
                errorMsg = {
                    open: true,
                    messageText: `The ${type} ${tag} already exists in that directory. Cannot create the ${type} ${tag}`,
                    messageTitle: `Error: ${type} already exists`,
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
                return [false, errorMsg];
            }
        }
        // if no parent check if root already exsits. Otherwise throw error. There can only be one root
        if (parent === null) {
            if (this.root !== null) {
                errorMsg = {
                    open: true,
                    messageText: `There can only be one root directory. Cannot create the ${type} ${tag}.`,
                    messageTitle: 'Error: Multiple Root',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
                return [false, errorMsg];
            }
        }
        var node = new Node({
            tag: tag,
            identifier: identifier,
            fpointer: [],
            bpointer: null,
            type: type,
            link: '',
            linkTo: [],
            properties: {size: '1KB', hide: false, fileExtension: 'txt'},
        });
        this.addNode(node, parent, mode);
        return [true, node];
    }

    addNode(node, parent, mode) {
        if (typeof node === Node) {
            return console.log("First parameter must be object of Class::Node.");
        }
        if (this.root === null) {
            this.root = node.identifier;
        } else {
            parent = sanitizeID(parent);
        }
        this.nodes[node.identifier] = node; //update dict
        this.updateFPointer(parent, node.identifier, mode);
        this.updateBPointer(node.identifier, parent)
    }

    removeNode(identifier) {
        var nodes = this.nodes
        Object.keys(this.nodes).forEach(function (key) {
            if (key.startsWith(identifier)) {
                if (nodes[nodes[key].bpointer]) {
                    nodes[nodes[key].bpointer].updateFPointer(identifier, 'delete') // delete child references from parent
                }
                if (key.includes('_linked')) {
                    nodes[nodes[key].link].updateLinkTo(identifier, 'delete') // delete link references from parent
                }
                if (nodes[key].fpointer) { // check for childNodes
                    //console.log('Not Empty. ChildNodes will be deleted')
                }
                delete nodes[key]; // delete node and all childNodes
            }
        })
        this.nodes = nodes;
        //console.log(nodes);
    }

    moveNode(identifierFrom, identifiertTo, originalFrom) {
        let that = this;
        //console.log("Visiting Node " + identifierFrom);
        var nodeFrom = this.nodes[identifierFrom];
        var newKey = identifiertTo + nodeFrom.identifier.replace(originalFrom, identifiertTo)
        var newBP = newKey.replace('/' + nodeFrom.tag, '')
        if (nodeFrom.fpointer.length === 0) {
            // We have found the goal node we we're searching for
            //console.log("Found the node we're looking for!");
            globalRemoveNodes.push(nodeFrom.identifier);
            this.nodes[identifierFrom].identifier = newKey
            this.updateBPointer(identifierFrom, newBP)
            //this.nodes[identifierFrom].bpointer = newBP
            //console.log('new Key: ', newKey, 'new bpointer: ', newBP)
            return newKey;
        }

        // Recurse with all children
        var newFPointer = []
        nodeFrom.fpointer.forEach(function (child) {
            var result = that.moveNode(child, identifiertTo, originalFrom);
            //console.log('returned newkey ', result)
            newFPointer.push(result)
        })

        // We've gone through all children and not found the goal node
        //console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");

        //var nKey = identifiertTo + nodeFrom.identifier.replace(originalFrom, identifiertTo)// + '/' + nodeFrom.tag
        //var nBP = nKey.replace('/' + nodeFrom.tag, '')
        //console.log('new Key: ', newKey, 'newBP: ', newBP)
        globalRemoveNodes.push(nodeFrom.identifier);
        if (originalFrom === identifierFrom) { // first recursive call
            //this.nodes[identifiertTo].fpointer.push(newKey) // add from node as child node of Tonode
            this.updateFPointer(identifiertTo, newKey, 'add')
            var orgParent = globalTreeNodes[globalTreeNodes[originalFrom].bpointer]
            this.updateFPointer(orgParent.identifier, originalFrom, 'delete') // delete from parent
            this.updateBPointer(identifierFrom, newBP)
            //return  newKey

        }
        this.nodes[identifierFrom].identifier = newKey //update current identifier
        //this.nodes[identifierFrom].fpointer = newFPointer // update its children
        this.updateFPointer(identifierFrom, newFPointer, 'move')
        this.updateBPointer(identifierFrom, newBP)
        //this.nodes[identifierFrom].bpointer = newBP

        return newKey;
    }

    linkNode(identifierFrom, identifierTo, recLvl) {
        let that = this;
        //console.log("Visiting Node " + identifierFrom);
        var nodeFrom = this.nodes[identifierFrom]
        var parentIdx = nthLastIndexOf(identifierFrom, '/', recLvl)
        var nodeIdentifier = identifierTo + identifierFrom.substring(parentIdx) + '_linked'
        var parentIdentifier = identifierTo + identifierFrom.substring(parentIdx, identifierFrom.lastIndexOf('/')) + '_linked'
        var linked;
        if (nodeFrom.fpointer.length === 0 && recLvl !== 1) { // there should be at least one recursion
            //console.log('No children. We are done')
            linked = this.createNode(nodeFrom.tag, nodeIdentifier, nodeFrom.type, parentIdentifier, 'link')
            linked = linked[1]
            linked.link = identifierFrom
            nodeFrom.updateLinkTo(linked.identifier, 'add')
            return linked
        }
        var fPointer = []
        nodeFrom.fpointer.forEach(function (child) {
            //console.log('Children found. Clone this first: ', child)
            linked = that.linkNode(child, identifierTo, recLvl + 1)
            fPointer.push(linked.identifier)
        })

        // We've gone through all children and not found the goal node
        //console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");
        var mode = 'link'
        if (recLvl === 1) {// top level of recursion
            mode = 'add'
            parentIdentifier = identifierTo
        }
        linked = this.createNode(nodeFrom.tag, nodeIdentifier, nodeFrom.type, parentIdentifier, mode)
        linked = linked[1]
        linked.link = identifierFrom
        linked.updateFPointer(fPointer, 'add')
        nodeFrom.updateLinkTo(linked.identifier, 'add')
        return linked
    }

    changeNode(identifier, properties) {
        let that = this;
        var node = this.nodes[identifier]
        if (node.fpointer.length === 0) {
            node.updateProperties(properties)
            return true
        }
        node.fpointer.forEach(function (child) {
            //console.log('Children found. Clone this first: ', child)
            that.changeNode(child, properties)
        })
        node.updateProperties(properties)
        return true

    }

    render() {
        let treeNode = this.props.nodes ? this.props.nodes['/'] : null;
        globalTreeNodes = this.props.nodes;
        //console.log (this.state.tree.nodes)
        //console.log(globalTreeNodes)
        return (
            <div>
                {treeNode ? <div className="tree">
                    <ul id="treeRoot">
                        <Node
                            key={treeNode.identifier}
                            identifier={treeNode.identifier}
                            tag={treeNode.tag}
                            type={treeNode.type}
                            fpointer={treeNode.fpointer}
                            treeNodes={Object.values(this.props.nodes)}
                            properties={treeNode.properties}
                            link={treeNode.link}
                        />
                    </ul>
                </div> : null}
            </div>)
    }
}

Tree.propTypes = {
    nodes: PropTypes.object,
    root: Node
};

Tree.defaultProps = {
    nodes: {},
    root: null
};

export default Tree;
