import React from "react";
import PropTypes from "prop-types";
import './App.css';


function sanitizeID(identifier) {
    // possible todo: make use of function if complex file are given by user
    return identifier//.toString().trim().replace(" ", "_");
}

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

class Node extends React.Component {
    constructor(props) {
        super(props);
        this.tag = props.tag;
        this.identifier = props.identifier;
        this.children = props.children;
        this.parent = props.parent;
        this.type = props.type;
        this.treeNodes = props.treeNodes;
        this.properties = props.properties;
        this.link = props.link;
        this.linkTo = props.linkTo;
        this.updateChildren = this.updateChildren.bind(this);
        this.updateLinkTo = this.updateLinkTo.bind(this);
        //this.updateIdentifier = this.updateIdentifier.bind(this);
        this.calculateSize = this.calculateSize.bind(this)
        this.updateSize = this.updateSize.bind(this);
        this.updateProperties = this.updateProperties.bind(this);
    }
    updateChildren(identifier, mode) {
        /**
         * Updates the children list of the node
         * @param {string} identifier The identifier of the node, that shall be added/ deleted
         * @param {string} mode How new node got added to child list
         */
        if (mode === "add") {
            this.children = this.children.concat(identifier);
        } else if (mode === "delete") {
            this.children = this.children.filter(x => x !== identifier);
        } else if (mode === "move") {
            this.children = identifier;
        }
    }

    updateLinkTo(identifier, mode) {
        /**
         * Updates the list of the node that stores all it's symlinks
         * @param {string} identifier The identifier of the node, that shall be added/ deleted
         * @param {string} mode How new node got added to list
         */
        if (mode === "add") {
            this.linkTo = this.linkTo.concat(identifier);
        } else if (mode === "delete") {
            this.linkTo = this.linkTo.filter(x => x !== identifier);
        } else if (mode === "insert") {
            this.linkTo = [identifier];
        }
    }

    updateProperties(prop) {
        /**
         * Updates the properties of the node
         * @param {string} prop The property to be updated
         */
        if (prop === 'hide') {
            this.properties.hide = !(this.properties.hide)
        }
    }

    calculateSize(treeNodes) {
        let count = 1;
        this.children.forEach(function (child){
            count += treeNodes[child].calculateSize(treeNodes);
        })
        return count
    }
    updateSize(treeNodes){
        this.properties.size = this.children.length > 0 ? this.calculateSize(treeNodes).toString() + 'KB' : '1KB'
    }

    /*updateIdentifier(thisNodes, nodeFrom) {
        let node = this;
        node.identifier = nodeFrom.identifier + '/' + node.tag
        if (this.children.length === 0) {
            return true;
        }
        Object.values(thisNodes).filter(key => node.children.includes(key.identifier)).map(function (child) {
            return child.updateIdentifier(thisNodes, node)
        })
    }*/

    render() {
        let childNodes = null;
        let treeNodes = this.props.treeNodes
        // TreeNode Component calls itself if children exist
        if (this.props.children) {
            //console.log(this.props.treeNodes)
            //console.log('current node: ', this.props.tag, 'properties: ', this.props.properties)
            childNodes = treeNodes.filter(key => this.props.children.includes(key.identifier)).map(function (child) {
                //child.updateSize()
                return (<Node
                    key={child.identifier}
                    identifier={child.identifier}
                    tag={child.tag}
                    type={child.type}
                    children={child.children}
                    treeNodes={Object.values(treeNodes)}
                    properties={child.properties}
                    link={child.link}
                />)
            })
        }
        let iconClass = 'fa fa-folder-open';
        let fileExtension = '';
        let visibility = '';
        if (this.props.type === 'file') {
            iconClass = 'fa fa-file'
            fileExtension = '.' + this.props.properties.fileExtension
        }
        if (this.props.properties.hide) {
            visibility = '(hidden)';
        }
        //return the current treeNode
        // display children if existent
        return (
            <li id={this.props.identifier} className={this.props.type}>
                <i className={iconClass}/>{this.props.link ?
                <i className="fas fa-share"/> : null} {this.props.tag}{fileExtension}
                {this.props.properties.hide? <span className="info"> - {visibility}</span> : null}
                {/*<span className="info"> - {this.props.properties.size} {visibility}</span>*/}
                {childNodes ? <ul className="filetree">{childNodes}</ul> : null}
            </li>
        )
    }


}


Node.propTypes = {
    tag: PropTypes.string,
    identifier: PropTypes.string,
    children: PropTypes.array,
    parent: PropTypes.string,
    type: PropTypes.string,
    treeNodes: PropTypes.array,
    properties: PropTypes.object,
    link: PropTypes.string,
    linkTo: PropTypes.array
};

Node.defaultProps = {
    tag: "",
    identifier: "",
    children: [],
    parent: '',
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
        this.updateParent = this.updateParent.bind(this)
        this.updateChildren = this.updateChildren.bind(this);
        this.createNode = this.createNode.bind(this);
        this.createNodeRecursive = this.createNodeRecursive.bind(this)
        this.removeNode = this.removeNode.bind(this);
        this.moveOrLinkNode = this.moveOrLinkNode.bind(this)
        //this.updateIdentifier = this.updateIdentifier.bind(this)
        this.getAllChildNodesTagList = this.getAllChildNodesTagList.bind(this)
        this.getAllChildNodesList = this.getAllChildNodesList.bind(this)
    }

    getAllChildNodesTagList(identifier){
        /**
         * Returns a list containing all successors (tag) of a given node
         * @param {string} identifier The node whose successors shall be found
         */
        let that = this;
        //console.log("Visiting Node " + identifier);
        let nodeFrom = this.nodes[identifier]
        let children = [];
        children.push(nodeFrom.tag);
        if (nodeFrom.children.length === 0) { // there should be at least one recursion
            //console.log('No children. We are done')
            return [nodeFrom.tag]
        }
        let innerChildren = []
        nodeFrom.children.forEach(function (child) {
            //console.log('Children found. Go there first: ', child)
            let inner = that.getAllChildNodesTagList(child)
            innerChildren = [...inner, ...innerChildren]
        })
        // We've gone through all children and not found the goal node
        //console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");
        children = [...children, ...innerChildren]
        return children
    }

     getAllChildNodesList(identifier, symlink) {
        /**
         * Returns a list containing all successors (identifiers) of a given node
         * @param {string} identifier The node whose successors shall be found
         * @param {boolean} symlink Whether to list the identifier of the node that is linked to
         */
        let that = this;
        //console.log("Visiting Node " + identifier);
        let nodeFrom = this.nodes[identifier]
        let children = [];
        if (symlink && nodeFrom.link) children.push(nodeFrom.link)
        else children.push(nodeFrom.identifier)
        if (nodeFrom.children.length === 0) { // there should be at least one recursion
            //console.log('No children. We are done')
            if (symlink && nodeFrom.link) return [nodeFrom.link]
            else return [nodeFrom.identifier]
        }
        let innerChildren = []
        nodeFrom.children.forEach(function (child) {
            //console.log('Children found. Go there first: ', child)
            let inner = that.getAllChildNodesList(child,symlink)
            innerChildren = [...inner, ...innerChildren]
        })
        // We've gone through all children and not found the goal node
        //console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");
        children = [...children, ...innerChildren]
        return children
    }

    updateChildren(nid, identifier, mode) {
        /**
         * Updates the children list of a given node. Skip update when a symlink is performed. This happens elsewhere.
         * @param {string} nid Node whose children list is to be updated
         * @param {string} identifier Node whose children list is to be updated
         * @param {boolean} mode If children update happened by creating symlinks
         */
        if (nid === null || mode === 'link') {
            return false;
        } else {
            this.nodes[nid].updateChildren(identifier, mode);
        }
    }

    updateParent(nid, identifier) {
        /**
         * Updates the parent of a given node.
         * @param {string} nid Node whose parent is to be updated
         * @param {string} identifier Parent that shall be added
         */
        if (nid === '/') return
        this.nodes[nid].parent = identifier
    }

    /*updateIdentifier() {
        let nodes = this.nodes
        globalRemoveNodes.forEach(function (key) {
            nodes[nodes[key].identifier] = nodes[key]
            delete nodes[key]
        })
        this.nodes = nodes
    }*/

    createNodeRecursive(tag, identifier, type, parent, mode, recLvl) {
        /**
         * Basically same as the createNode function. But creates directories recursively when parent directory doesn't exist
         * @param {string} tag Tag of the node
         * @param {string} identifier Identifier of the node
         * @param {string} type Type of the node
         * @param {string} parent Parent of the node
         * @param {string} mode How the node is created
         * @param {number} recLvl Level of recursion
         */
        let that = this;
        if (parent === '') parent = '/'
        let node;
        if (this.nodes[parent]) { // stop recursion when parent exists
            node = new Node({
                tag: tag,
                identifier: identifier,
                children: [],
                parent: null,
                type: type,
                link: '',
                linkTo: [],
                properties: {size: '1KB', hide: false, fileExtension: 'txt'},
            });
            this.addNode(node, parent, mode);
            return [true, node];
        }
        that.createNodeRecursive(parent.substring(parent.lastIndexOf('/') + 1), parent, 'directory', parent.substring(0, parent.lastIndexOf('/')), 'add', recLvl + 1)
        node = new Node({
            tag: tag,
            identifier: identifier,
            children: [],
            parent: null,
            type: type,
            link: '',
            linkTo: [],
            properties: {size: '1KB', hide: false, fileExtension: 'txt'},
        });
        this.addNode(node, parent, mode);
        return [true, node];
    }

    createNode(tag, identifier, type, parent, mode,) {
        /**
         * Creates a new node object with given properties.
         * @param {string} tag Tag of the node
         * @param {string} identifier Identifier of the node
         * @param {string} type Type of the node
         * @param {string} parent Parent of the node
         * @param {string} mode How the node is created
         * @param {number} recLvl Level of recursion
         */
        // Exception Handling
        let errorMsg;
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
        // if no parent check if root already exists. Otherwise throw error. There can only be one root
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
        let node = new Node({
            tag: tag,
            identifier: identifier,
            children: [],
            parent: null,
            type: type,
            link: '',
            linkTo: [],
            properties: {size: '1KB', hide: false, fileExtension: 'txt'},
        });
        this.addNode(node, parent, mode);
        return [true, node];
    }

    addNode(node, parent, mode) {
        /**
         * Adds the node to the tree and updates children and parent.
         * @param {Node} node Node object which is to be added
         * @param {string} parent Parent of the node
         * @param {string} mode How the node is created
         */
        if (typeof node === Node) {
            return console.log("First parameter must be object of Class::Node.");
        }
        if (this.root === null) {
            this.root = node.identifier;
        } else {
            parent = sanitizeID(parent);
        }
        this.nodes[node.identifier] = node; //update dict
        this.updateChildren(parent, node.identifier, mode);
        this.updateParent(node.identifier, parent)
    }

    removeNode(identifier) {
        /**
         * Removes the node from the tree and updates children, parent and the symlink list.
         * @param {string} identifier Node object which is to be removed
         */
        let nodes = this.nodes
        let that = this;
        Object.keys(this.nodes).forEach(function (key) {
            if (key.startsWith(identifier)) {
                if (nodes[nodes[key].parent]) {
                    nodes[nodes[key].parent].updateChildren(identifier, 'delete') // delete child references from parent
                }
                if (key.includes('_linked') && nodes[key].link in nodes) {
                    nodes[nodes[key].link].updateLinkTo(identifier, 'delete') // delete link references from parent
                }
                if (nodes[key].linkTo !== null) { // if the nde was symlinked delete the symlinks
                    nodes[key].linkTo.forEach(function (linked) {
                        that.removeNode(linked)
                    })
                }
                if (nodes[key].children) { // check for childNodes
                    console.log('Not Empty. ChildNodes will be deleted')
                }
                delete nodes[key]; // delete node and all childNodes
            }
        })
        this.nodes = nodes;
    }


    moveOrLinkNode(identifierFrom, identifierTo, recLvl, link) {
        /**
         * Moves the node to another node and marks them as a symlink if link is true.
         * Overwrites existing nodes, when the user confirmed beforehand.
         * @param {string} identifierFrom Identifier from where to move
         * @param {string} identifierTo Identifier to where to move
         * @param {number} recLvl Level of recursion
         * @param {boolean} link: Whether the node shall be linked
         */
        let that = this;
        //console.log("Visiting Node " + identifierFrom);
        let nodeFrom = this.nodes[identifierFrom]
        let parentIdx = nthLastIndexOf(identifierFrom, '/', recLvl)
        let nodeIdentifier = identifierTo !== '/'? identifierTo + identifierFrom.substring(parentIdx) : identifierFrom.substring(parentIdx)
        let parentIdentifier = identifierTo + identifierFrom.substring(parentIdx, identifierFrom.lastIndexOf('/'))
        if(link){
            nodeIdentifier += '_linked'
            parentIdentifier += '_linked'
        }else{
            this.updateChildren([nodeFrom.parent], identifierFrom, 'delete' )
        }
        let newNode;
        if (nodeFrom.children.length === 0 && recLvl !== 1) { // there should be at least one recursion
            //console.log('No children. We are done')

            newNode = this.createNode(nodeFrom.tag, nodeIdentifier, nodeFrom.type, parentIdentifier, 'link')
            newNode = newNode[1]
            if(link){
                newNode.link = identifierFrom
                nodeFrom.updateLinkTo(newNode.identifier, 'add')
            }
            else{
                this.nodes[nodeIdentifier] = newNode // update tree node list
                delete this.nodes[identifierFrom]
            }
            return newNode
        }
        let newChildren = []
        nodeFrom.children.forEach(function (child) {
            //console.log('Children found. Clone this first: ', child)
            newNode = that.moveOrLinkNode(child, identifierTo, recLvl + 1, link)
            newChildren.push(newNode.identifier)
        })

        // We've gone through all children and not found the goal node
        //console.log("Went through all children of " + nodeFrom.identifier + ", returning to it's parent.");
        let mode = 'link'
        if (recLvl === 1) {// top level of recursion
            mode = 'add'
            parentIdentifier = identifierTo
        }
        newNode = this.createNode(nodeFrom.tag, nodeIdentifier, nodeFrom.type, parentIdentifier, mode)
        newNode = newNode[1]
        newNode.updateChildren(newChildren, 'add')
        if(link){
            newNode.link = identifierFrom
            nodeFrom.updateLinkTo(newNode.identifier, 'add')
        }
        else{
            this.nodes[nodeIdentifier] = newNode // update tree node list
            delete this.nodes[identifierFrom]
        }
        return newNode
    }

    changeNode(identifier, properties) {
        /**
         * Changes the properties of a given node.
         * @param {string} identifier Identifier of the node whose properties are to be changed
         * @param {string} properties Property of the node. It is a key in the properties object of a node
         */
        let that = this;
        let node = this.nodes[identifier]
        if (node.children.length === 0) {
            node.updateProperties(properties)
            return true
        }
        node.children.forEach(function (child) {
            that.changeNode(child, properties)
        })
        node.updateProperties(properties)
        return true

    }



    render() {
        let treeNode = this.props.nodes ? this.props.nodes['/'] : null;
        //treeNode.updateSize()
        return (
            <div>
                {treeNode ? <div className="tree">
                    <ul id="treeRoot" className="filetree">
                        <Node
                            key={treeNode.identifier}
                            identifier={treeNode.identifier}
                            tag={treeNode.tag}
                            type={treeNode.type}
                            children={treeNode.children}
                            treeNodes={Object.values(this.props.nodes)}
                            properties={treeNode.properties}
                            link={treeNode.link}
                            onDrag
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
