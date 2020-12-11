//https://github.com/guotsuan/pyTree
import React from "react";
import PropTypes from "prop-types";
import './App.css';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import cloneDeep from 'lodash/cloneDeep';


function sanitizeID(identifier) {
    return identifier//.toString().trim().replace(" ", "_");
}

function executeFunctionByName(functionName, context /*, args */) {
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
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
        this.updateFPointer = this.updateFPointer.bind(this);
        this.updateIdentifier = this.updateIdentifier.bind(this);
        this.updateSizeProp = this.updateSizeProp.bind(this);
    }

    updateFPointer(identifier, mode) {
        if (mode === "add") {
            this.fpointer = this.fpointer.concat(identifier);
        } else if (mode === "delete") {
            this.fpointer = this.fpointer.filter(x => x !== identifier);
        } else if (mode === "insert") {
            this.fpointer = [identifier];
        }
        this.updateSizeProp()
    }

    updateSizeProp() {
        //   this.properties.size = this.fpointer.length > 0 ? this.fpointer.length.toString() + 'KB' : '1KB'
    }


    updateSuccessors(nid, mode = 'add', replace = null, tree_id = null) {
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
        return executeFunctionByName(f_name, this.updateSuccessors, null)
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
        if (!(this.props.properties.visible)) {
            visibility = '(hidden)';
        }
        //return the current treeNode
        // display children if existent
        return (
            <li id={this.props.identifier} className={this.props.type}>
                <i className={iconClass}></i>{this.props.link ?<i className="fas fa-share"></i> : null} {this.props.tag}{fileExtension}<span> - {this.props.properties.size} {visibility}</span>
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
    link: PropTypes.string
};

Node.defaultProps = {
    tag: "",
    identifier: "",
    fpointer: [],
    bpointer: '',
    type: 'directory',
    treeNodes: [],
    properties: {size: '1KB', visible: true, fileExtension: 'txt'},
    link: ''
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
        if (nid === null) {
            return false;
        } else {
            this.nodes[nid].updateFPointer(identifier, mode);
        }
    }

    updateBPointer(nid, identifier) {
        if(nid === '/') return
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

    createNode(tag, identifier, type, parent) {
        // Exception Handling
        if (parent) {
            // todo: check if parent exists -> create parent (?)
            // parent is file
            if (this.nodes[parent].type === 'file') {
                var errorMsg = {
                        open: true,
                        messageText: `You tried to create the ${type} ${tag} inside a file. That is not possible.`,
                        messageTitle: 'Error: Parent is type of file',
                        proceed: null,
                        cancel: null,
                        close: 'Close'
                    }
                return [false, errorMsg];
            }
            //parent does not exist
            if (!(this.nodes[parent])) {
                var errorMsg = {
                        open: true,
                        messageText: `The provided parent directory does not exist. Cannot create the ${type} ${tag}.`,
                        messageTitle: 'Error: Parent does not exist',
                        proceed: null,
                        cancel: null,
                        close: 'Close'
                    }
                return [false, errorMsg];
            }
        }
        // file/directory exists already in directory
        if (identifier in this.nodes) {
            var errorMsg = {
                        open: true,
                        messageText: `The ${type} ${tag} already exists in that directory. Cannot create the ${type} ${tag}`,
                        messageTitle: `Error: ${type} already exists`,
                        proceed: null,
                        cancel: null,
                        close: 'Close'
                    }
                return [false, errorMsg];
        }
        // if no parent check if root already exsits. Otherwise throw error. There can only be one root
        if (parent === null) {
            if (this.root !== null) {
                var errorMsg = {
                        open: true,
                        messageText: `There can only be one root directory. Cannot create the ${type} ${tag}.`,
                        messageTitle: 'Error: Multiple Root',
                        proceed: null,
                        cancel: null,
                        close: 'Close'
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
        });
        this.addNode(node, parent);
        return [true, node];
    }

    addNode(node, parent) {
        if (typeof node === Node) {
            return console.log("First parameter must be object of Class::Node.");
        }
        if (this.root === null) {
            this.root = node.identifier;
        } else {
            parent = sanitizeID(parent);
        }
        this.nodes[node.identifier] = node; //update dict
        this.updateFPointer(parent, node.identifier, "add");

        this.updateBPointer(node.identifier, parent)
    }

    removeNode(identifier) {
        var nodes = this.nodes
        Object.keys(this.nodes).forEach(function (key) {
            if (key.startsWith(identifier)) {
                if (nodes[nodes[key].bpointer]) {
                    nodes[nodes[key].bpointer].updateFPointer(identifier, 'delete') // delete child references from parent
                }
                if (nodes[key].fpointer) { // check for childNodes
                    console.log('Not Empty. ChildNodes will be deleted')
                }
                delete nodes[key]; // delete node and all childNodes
            }
        })
        this.nodes = nodes;
        console.log(nodes);
    }

    moveNode(identifierFrom, identifiertTo, originalFrom) {
        console.log("Visiting Node " + identifierFrom);
        var nodeFrom = this.nodes[identifierFrom];
        var nodeTo = this.nodes[identifiertTo]
        if (nodeFrom.fpointer.length === 0) {
            // We have found the goal node we we're searching for
            console.log("Found the node we're looking for!");
            globalRemoveNodes.push(nodeFrom.identifier);
            var newKey = identifiertTo + nodeFrom.identifier.replace(originalFrom, identifiertTo)
            var newBP = newKey.replace('/' + nodeFrom.tag, '')
            this.nodes[identifierFrom].identifier = newKey
            this.nodes[identifierFrom].bpointer = newBP
            console.log('new Key: ', newKey, 'new bpointer: ', this.nodes[identifierFrom].bpointer)
            return newKey;
        }

        // Recurse with all children
        var newFPointer = []
        for (var i = 0; i < nodeFrom.fpointer.length; i++) {
            var result = tree.moveNode(nodeFrom.fpointer[i], identifiertTo, originalFrom);
            console.log('returned newkey ', result)
            newFPointer.push(result)
        }

        // We've gone through all children and not found the goal node
        console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");

        var nKey = identifiertTo + nodeFrom.identifier.replace(originalFrom, identifiertTo)// + '/' + nodeFrom.tag
        var nBP = nKey.replace('/' + nodeFrom.tag, '')
        console.log('new Key: ', nKey)
        globalRemoveNodes.push(nodeFrom.identifier);
        if (originalFrom === identifierFrom) { // first recursive call
            this.nodes[identifiertTo].fpointer.push(nKey) // add from node as child node of Tonode
            var orgParent = globalTreeNodes[globalTreeNodes[originalFrom].bpointer]
            this.updateFPointer(orgParent.identifier, originalFrom, 'delete') // delete from parent

        }
        this.nodes[identifierFrom].identifier = nKey //update current identifier
        this.nodes[identifierFrom].fpointer = newFPointer // update its children
        this.nodes[identifierFrom].bpointer = nBP

        return nKey;
    }

    linkNode(identifierFrom, identifierTo){
        var nodeFrom = this.nodes[identifierFrom]
        var nodeTo = this.nodes[identifierTo]
        var linked = cloneDeep(nodeFrom);
        linked.link = identifierFrom;
        linked.identifier = identifierTo+identifierFrom
        this.addNode(linked,identifierTo, true)
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
        //this.tree = props.tree;
        this.state = {
            command: '',
            nodeType: '',
            nodeTag: '',
            nodeIdentifier: '',
            nodeIdentifierTo: '',
            parent: '',
            counter: 0,
            tree: tree,
            error: false,
            errorMsg: {},
            proceedCancel: false,
            callback: ''
        };
        this.add = this.add.bind(this);
        this.delete = this.delete.bind(this);
        this.move = this.move.bind(this);
        this.link = this.link.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleCommand = this.handleCommand.bind(this);

    }

    closeModal() {
        this.setState({
            error: false,
            errorMsg: {}
        })
    }
    closeModalProceedCancel() {
        this.setState({
            error: false,
            errorMsg: {},
            proceedCancel: true
        }, () => { this[this.state.callback]();})

    }

    add() {
        console.log(tree);
        var response = tree.createNode(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType, this.state.parent)
        var success = response[0]
        var errorMsg = response[1]
        if(!(success)){
            this.setState({
                    error: true,
                    errorMsg: errorMsg
                })
        }
        else{
        this.setState({
            tree: tree
        }, () => console.log('ADDED'));
        }
    }


    delete() {
        // either directory is empty/it's a file or user decided to delete anyways
        if(tree.nodes[this.state.nodeIdentifier].fpointer.length === 0 ||
            (this.state.proceedCancel && !(this.state.error) && Object.keys(this.state.errorMsg).length === 0)){
            tree.removeNode(this.state.nodeIdentifier)
                this.setState({
                    tree: tree
                }, () => console.log('DELETED'));
            return true;
        }
        // Excepytion Handling
        // check if directory is empty
        if (tree.nodes[this.state.nodeIdentifier].fpointer) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The directory ${tree.nodes[this.state.nodeIdentifier].tag} you are trying to delete is not empty. 
                Everything in it will be delete as well. Would you like to proceed?`,
                    messageTitle: 'Warning: The directory is not empty',
                    proceed: 'Proceed',
                    cancel: 'Cancel',
                    close: null,
                },
                callback: 'delete'
            })
        }
    }

    move() {

        tree.moveNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo, this.state.nodeIdentifier)
        //tree.updateFPointer(tree.nodes[this.state.nodeIdentifier].bpointer,this.state.nodeIdentifier,'delete')
        tree.updateIdentifier()
        this.setState({
            tree: tree
        }, () => console.log('MOVED'));
    }

    link() {
        // todo: mark all child nodes as link
        tree.linkNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo)
        this.setState({
            tree: tree
        }, () => console.log('LINKED'));
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleCommand() {
        var command = this.state.command.split(' ');// split the user's command

        // Exception Handling: wrong user command
        if (!(command[0].match(/\b(\w*add|delete|move|link|change\w*)\b/g)) || command.length === 0) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: 'The comannd you used is unknown. ' +
                        'Please try one of the follwoing: "add, delete, move, link, change"',
                    messageTitle: 'Error: Wrong command!',
                    proceed: null,
                    cancel: null,
                    close: 'Close'
                }
            })
            return;
        }
        if (command[0] === 'add' && command.length !== 3) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The comannd you used is unknown. Please try the follwoing: "${command[0]} type fullpath"`,
                    messageTitle: 'Error: Wrong command!',
                    proceed: null,
                    cancel: null,
                    close: 'Close'
                }
            })
            return;
        }

        if ('add' === command[0]) {

            var nodeTag = command[2].substring(idx + 1)
            var idx = command[2].lastIndexOf('/')
            var parentName = command[2].substring(0, idx)
            if (idx === 0) parentName = command[2].substring(0, idx + 1)// + '/' // root
            //var par = this.findParent(command[2]);
            //console.log('current node: ', command[2], 'parent node: ', par)
            this.setState({
                nodeType: command[1],
                nodeTag: nodeTag,
                nodeIdentifier: command[2],
                parent: parentName,
            }, () => {
                this.add()
            })
        } else if ('delete' === command[0]) {
            this.setState({
                nodeIdentifier: command[1],
            }, () => {
                this.delete()
            });
        } else if ('move' === command[0]) {
            this.setState({
                nodeIdentifier: command[1],
                nodeIdentifierTo: command[2],
            }, () => {
                this.move()
            });
        } else if ('link' === command[0]) {
            this.setState({
                nodeIdentifier: command[1],
                nodeIdentifierTo: command[2]
            }, () => {
                this.link()
            });
        } else if ('change' === command[0]) {
            this.setState({
                nodeTag: nodeTag,
                nodeIdentifier: command[1],
                properties: command[2]
            }, () => {
                this.move()
            });
        } else {
            console.log('else')
        }

    }

    render() {
        //console.log('render methods treeNodeList: ', this.state.tree)
        //var treenodes = Object.entries(this.state.tree.nodes).filter((item) => item.idenfitier = this.state.tree.root);
        var treeNode = this.state.tree.nodes ? this.state.tree.nodes['/'] : null;
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
                <h1>ThorDrive's File Viewer</h1>
                <Popup open={this.state.error} modal position="right center" closeOnDocumentClick={false}
                       closeOnEscape={false}>
                    {close => (
                        <div className="modal">
                            <div className="header">{this.state.errorMsg.messageTitle}</div>
                            <div className="content">{this.state.errorMsg.messageText}</div>
                            <div className="actions">
                                {this.state.errorMsg.proceed ? <button className="button" onClick={() => {
                                    this.closeModalProceedCancel(true);
                                }}>Proceed</button> : null}

                                {this.state.errorMsg.cancel ? <button className="button" onClick={() => {
                                    this.closeModalProceedCancel(false);
                                }}>Cancel</button> : null}

                                {this.state.errorMsg.close ? <button className="button" onClick={() => {
                                    this.closeModal();
                                }}>Close</button> : null}
                            </div>
                        </div>
                    )}
                </Popup>
                <label>User Command
                    <input
                        type="text"
                        name="command"
                        value={this.state.command}
                        onChange={this.handleChange}
                        placeholder="e.g add directory /b"
                    />
                </label>
                <button onClick={this.handleCommand}>Go</button>
                {/*<button onClick={this.delete}>Delete</button>*/}
                {/*<button onClick={this.move}>Move</button>*/}
                {/*<button onClick={this.link}>Link</button>*/}
                <h2>Your current file tree looks as follows</h2>
                {treeNode ? <div className="tree">
                    <ul id="treeRoot">
                        <Node
                            key={treeNode.identifier}
                            identifier={treeNode.identifier}
                            tag={treeNode.tag}
                            type={treeNode.type}
                            fpointer={treeNode.fpointer}
                            treeNodes={Object.values(this.state.tree.nodes)}
                            properties={treeNode.properties}
                            link={treeNode.link}
                        />
                    </ul>
                </div> : null}
            </div>
        )
    }
}

export default App;
