//https://github.com/guotsuan/pyTree
import React from "react";
import PropTypes from "prop-types";
import ReactDom from "react-dom";

function sanitizeID(identifier) {
    return identifier//.toString().trim().replace(" ", "_");
}
function executeFunctionByName(functionName, context /*, args */) {
  var args = Array.prototype.slice.call(arguments, 2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(context, args);
}


function dfs(start, target){
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
}

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
        this.updateFPointer = this.updateFPointer.bind(this);
        this.updateIdentifier = this.updateIdentifier.bind(this);
    }

    updateFPointer(identifier, mode) {
        if (mode === "add") {
            this.fpointer = this.fpointer.concat(identifier);
        } else if (mode === "delete") {
            this.fpointer = this.fpointer.filter(x => x.identifier !== identifier);
        } else if (mode === "insert") {
            this.fpointer = [identifier];
        }
    }


    updateSuccessors(nid, mode='add', replace=null, tree_id=null) {
        /***
         Update the children list with different modes: addition (Node.ADD or
         Node.INSERT) and deletion (Node.DELETE).
         ***/
        if (nid === null) return

        var manipulatorAppend = function () {
            this.successors(tree_id).append(nid)
        }

        var manipulatorDelete = function () {
            if (this.fpointer.includes(nid)) {
                this.successors(tree_id).remove(nid)
            } else {
                console.log('Nid %s wasn\'t present in fpointer' % nid)
            }
        }

        var manipulatorInsert = function () {
            console.log("WARNING: INSERT is deprecated to ADD mode")
            this.updateSuccessors(nid, tree_id)
        }

        var manipulatorReplace = function () {
            if (replace === null) {
                console.log('Argument "repalce" should be provided when mode is {}'.format(mode))
            }
            var ind = this.successors(tree_id).index(nid)
            this.successors(tree_id)[ind] = replace
        }

        var manipulatorLookup = {
            'add': 'manipulatorAppend',
            'delete': 'manipulatorDelete',
            'insert': 'manipulatorInsert',
            'replace': 'manipulatorReplace'
        }

        if (!(mode in manipulatorLookup)) {
            console.log('Unsupported node updating mode ', mode)
        }

        var f_name = manipulatorLookup[mode]
        return executeFunctionByName(f_name,this.updateSuccessors, null)
    }



    updateIdentifier(thisNodes, nodeFrom) {

        let node = this;
        node.identifier = nodeFrom.identifier + '/' + node.tag
        if (this.fpointer.length === 0) {
            return true;
        }
        Object.values(thisNodes).filter(key => node.fpointer.includes(key.identifier)).map(function (child) {
            console.log(child)
            //child.identifier = node.identifier + '/' + child.tag
            return child.updateIdentifier(thisNodes, node)
        })
    }


    render() {
        let childNodes = null;
        // TreeNode Component calls itself if children exist
        if (this.props.fpointer) {
            //console.log('current node: ', this.props.tag, 'children: ', this.props.fpointer)
            childNodes = this.props.treeNodes.filter(key => this.props.fpointer.includes(key.identifier)).map(function (child) {
                return (<Node
                    key={child.identifier}
                    identifier={child.identifier}
                    tag={child.tag}
                    fpointer={child.fpointer}
                    treeNodes={Object.values(globalTreeNodes)}
                />)
            })
        }
        //return the current treeNode
        // display children if existent
        return (
            <li id={this.props.identifier}>{this.props.tag}
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
    treeNodes: PropTypes.array
};

Node.defaultProps = {
    tag: "",
    identifier: "",
    fpointer: [],
    bpointer: '',
    type: 'directory',
    treeNodes: []
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
        this.removeNode = this.removeNode.bind(this);
        this.moveNode = this.moveNode.bind(this);
        this.isAncestor = this.isAncestor.bind(this);
        this.updateIdentifier = this.updateIdentifier.bind(this)
    }

    isAncestor(ancestor, grandChild){
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

    createNode(tag, identifier, type, parent) {

        if (parent) {
            // todo: check if parent exists -> create parent (?)
            if (this.nodes[parent].type === 'file') {
                console.log('ParentNode is file. Cannot create')
                return false;
            }
            if (!(this.nodes[parent])) {
                console.log('ParentNode does not exist. Cannot create')
                return false;
            }
        }
        var node = new Node({
            tag: tag,
            identifier: identifier,
            fpointer: [],
            bpointer: null,
            type: type
        });
        this.addNode(node, parent);

        console.log(node);
        return node;
    }

    updateFPointer(nid, identifier, mode) {
        if (nid === null) {
            return;
        } else {
            //var elem = this.nodes.filter((item) => item.identifier === nid)
            //this.nodes.filter(item => item.identifier === nid)[0].updateFPointer(identifier, mode);
            this.nodes[nid].updateFPointer(identifier, mode);
            //this.nodes[nid].updateSuccessors(identifier, mode, null,this.root.identifier);
        }
    }
    updateBPointer(nid, identifier) {
        this.nodes[nid].bpointer = identifier
    }
    updateIdentifier(){
        var nodes = this.nodes
        globalRemoveNodes.forEach(function (key){
            nodes[nodes[key].identifier] = nodes[key]
            delete nodes[key]
        })
        this.nodes = nodes
    }
    addNode(node, parent) {
        if (typeof node === Node) {
            return console.log("First parameter must be object of Class::Node.");
        }
        if (node.identifier in this.nodes) {
            return console.log("Can't create node with ID '%s'" % node.identifier);
        }
        if (parent === null) {
            if (this.root !== null) {
                return console.log("MultipleRootError");
            } else {
                this.root = node.identifier;
            }
        } else {
            parent = sanitizeID(parent);
        }
        console.log(typeof this.nodes)
        this.nodes[node.identifier] = node; //update dict
        this.updateFPointer(parent, node.identifier, "add");
        node.bpointer = parent;
    }

    removeNode(identifier) {
        var nodes = this.nodes
        Object.keys(this.nodes).forEach(function (key) {
            if (key.startsWith(identifier)) {
                if (nodes[nodes[key].bpointer]) {
                    nodes[nodes[key].bpointer].fpointer.pop(identifier) // delete child references from parent
                }
                if (nodes[key].fpointer) { // check for childNodes
                    console.log('Not Empty. ChildNodes will be deleted')
                }
                delete nodes[key]; // delete node an all childNodes
            }
        })
        this.nodes = nodes;
        console.log(nodes);
    }

    moveNode(identifierFrom, identifiertTo, originalFrom){
        console.log("Visiting Node " + identifierFrom);
        var nodeFrom = this.nodes[identifierFrom];
        var nodeTo = this.nodes[identifiertTo]
        if (nodeFrom.fpointer.length === 0) {
            // We have found the goal node we we're searching for
            console.log("Found the node we're looking for!");
            globalRemoveNodes.push(nodeFrom.identifier);
            var newKey = identifiertTo + nodeFrom.identifier.replace(originalFrom, identifiertTo)
            var newBP = newKey.replace('/'+nodeFrom.tag,'')
            this.nodes[identifierFrom].identifier = newKey
            this.nodes[identifierFrom].bpointer = newBP
            console.log('new Key: ', newKey, 'new bpointer: ', this.nodes[identifierFrom].bpointer)
            return newKey;
        }

        // Recurse with all children
        var newFPointer = []
        for (var i = 0; i < nodeFrom.fpointer.length; i++) {
            var result = tree.moveNode(nodeFrom.fpointer[i], identifiertTo,originalFrom);
            console.log('returned newkey ',result)
            newFPointer.push(result)
        }

        // We've gone through all children and not found the goal node
        console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");

        var nKey = identifiertTo + nodeFrom.identifier.replace(originalFrom, identifiertTo)// + '/' + nodeFrom.tag
        var nBP = nKey.replace('/'+nodeFrom.tag,'')
        console.log('new Key: ', nKey)
        globalRemoveNodes.push(nodeFrom.identifier);
        if(originalFrom === identifierFrom){ // first recursive call
            this.nodes[identifiertTo].fpointer.push(nKey) // add from node as child node of Tonode
            var orgParent = globalTreeNodes[globalTreeNodes[originalFrom].bpointer]
            // todo: remove element from parent
            console.log(this.nodes[orgParent.identifier].fpointer)
            var idx = this.nodes[orgParent.identifier].fpointer.indexOf(identifierFrom)
            this.nodes[orgParent.identifier].fpointer = this.nodes[orgParent.identifier].fpointer.splice(idx,1)
            console.log(this.nodes[orgParent.identifier].fpointer)
        }
        this.nodes[identifierFrom].identifier = nKey //update current identifier
        this.nodes[identifierFrom].fpointer = newFPointer // update its children
        this.nodes[identifierFrom].bpointer = nBP

        return nKey;

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

var tree = new Tree({nodes: {}, root: null});
tree.createNode("/", "/", 'directory', null);

tree.createNode("a", "/a", 'directory', '/');

tree.createNode("b", "/b", 'directory', '/');
tree.createNode("a", "/b/a", 'directory', '/b');
tree.createNode("c", "/b/a/c", 'directory', '/b/a');
tree.createNode("d", "/b/a/c/d", 'directory', '/b/a/c');

tree.createNode("e", "/b/a/c/d/e", 'file', '/b/a/c/d');
tree.createNode("f", "/b/a/c/f", 'directory', '/b/a/c');


class App extends React.Component {
    constructor(props) {
        super(props);
        this.tree = props.tree;
        this.state = {
            nodeType: '',
            nodeTag: '',
            nodeIdentifier: '',
            nodeIdentifierTo: '',
            parent: '',
            counter: 0,
            tree: tree,
        };
        this.add = this.add.bind(this);
        this.delete = this.delete.bind(this);
        this.move = this.move.bind(this);
        this.link = this.link.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleCommand = this.handleCommand.bind(this);
    }

    add() {
        console.log(tree);
        //var node = new Node();
        /*tree.createNode("Harry", "harry", null); // root
        tree.createNode("Max", "max", "harry");
        tree.createNode("Lisa", "lisa", "max");
        tree.createNode("Tom", "tom", "harry");*/
        tree.createNode(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType, this.state.parent)
        this.setState({
            tree: tree
        }, () => console.log('ADDED'));
    }


    delete() {
        //const newList = this.state.tree.filter((item) => item.name !== this.state.nodeTag); // remove by filtering
        //this.setState({treeNodeList: newList});
        tree.removeNode(this.state.nodeIdentifier)
        this.setState({
            tree: tree
        }, () => console.log('DELETED'));

    }

    move() {
        tree.moveNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo,this.state.nodeIdentifier)
        tree.updateIdentifier()
        this.setState({
            tree: tree
        }, () => console.log('MOVED'));
    }

    link() {
        //ReactDom.unmountComponentAtNode(document.getElementById('a'))
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleCommand() {
        var command = this.state.command.split(' ');
        //console.log(command)// split the user's command
        var idx = command[2].lastIndexOf('/')
        var parentName = command[2].substring(0, idx)
        var nodeTag = command[2].substring(idx + 1)
        if (idx === 0) parentName = command[2].substring(0, idx + 1)// + '/' // root
        if ('add' === command[0]) {
            //var par = this.findParent(command[2]);
            //console.log('current node: ', command[2], 'parent node: ', par)
            this.setState({
                nodeType: command[1],
                nodeTag: nodeTag,
                nodeIdentifier: command[2],
                parent: parentName,
                counter: this.state.counter + 1,
                //parent: par
            }, () => {
                this.add()
            })
        } else if ('delete' === command[0]) {
            this.setState({
                nodeType: command[1],
                nodeTag: nodeTag,
                nodeIdentifier: command[2],
                parent: parentName,
                counter: this.state.counter + 1,
                //parent: par
            }, () => {
                this.delete()
            });
        } else if ('move' === command[0]) {
            this.setState({
                nodeTag: nodeTag,
                nodeIdentifier: command[1],
                nodeIdentifierTo: command[2],
                parent: parentName,
                counter: this.state.counter + 1,
            }, () => {
                this.move()
            });
        } else if ('link' === command[0]) {
            this.setState({
                nodeType: command[1],
                nodeTag: command[2]
            }, () => {
                this.link()
            });
        } else {
            console.log('else')
        }

    }

    render() {
        //console.log('render methods treeNodeList: ', this.state.tree)
        if (this.state.tree.nodes) {
            //var treenodes = Object.entries(this.state.tree.nodes).filter((item) => item.idenfitier = this.state.tree.root);
            var treeNode = this.state.tree.nodes['/']
            globalTreeNodes = this.state.tree.nodes;
            /*let treeNodes = [this.state.tree.nodes['harry']].map(function (treeNode) {
                return (<Node
                    key={treeNode.identifier}
                    identifier={treeNode.identifier}
                    tag={treeNode.tag}
                    fpointer={treeNode.fpointer}
                />)
            })*/
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
                    <ul id="treeRoot"><Node key={treeNode.identifier}
                                            identifier={treeNode.identifier}
                                            tag={treeNode.tag}
                                            fpointer={treeNode.fpointer}
                                            treeNodes={Object.values(this.state.tree.nodes)}/></ul>
                </div>
            )
        } else {
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
                </div>
            )
        }
    }
}

export default App;
