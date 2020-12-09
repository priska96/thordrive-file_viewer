//https://github.com/guotsuan/pyTree
import React from "react";
import PropTypes from "prop-types";
import ReactDom from "react-dom";

function sanitizeID(identifier) {
    return identifier//.toString().trim().replace(" ", "_");
}
let globalTreeNodes = {};
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
    }

    updateFPointer(identifier, mode) {
        if (mode === "add") {
            this.fpointer = this.fpointer.concat(identifier);
        } else if (mode === "delete") {
            this.fpointer = this.fpointer.list.filter(x=> x.identifier != identifier);
        } else if (mode === "insert") {
            this.fpointer = [identifier];
        }
    }


    render() {
        let childNodes = null;
        // TreeNode Component calls itself if children exist
        if (this.props.fpointer) {
          console.log('current node: ', this.props.tag, 'children: ', this.props.fpointer)
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

            console.log(this.props.identifier)

            console.log(this.props.tag)
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
    bpointer: Node,
    type: PropTypes.string,
    treeNodes: PropTypes.array
};

Node.defaultProps = {
    tag: "",
    identifier: "",
    fpointer: [],
    bpointer: null,
    type: 'directory',
    treeNodes: []
};

class Tree extends React.Component {
    constructor(props) {
        super(props);
        this.nodes = props.nodes;
        this.root = props.root;
        this.addNode = this.addNode.bind(this);
        this.updateFPointer = this.updateFPointer.bind(this);
        this.createNode = this.createNode.bind(this);
        this.removeNode = this.removeNode.bind(this);
    }

    createNode(tag, identifier, type, parent) {
        var node = new Node({
            tag: tag,
            identifier: identifier,
            fpointer: [],
            bpointer: null,
            type:type
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
        }
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
        this.nodes[node.identifier] =node; //update dict
        this.updateFPointer(parent, node.identifier, "add");
        node.bpointer = parent;
    }

    removeNode(identifier) {
      var nodes = this.nodes
      Object.keys(this.nodes).forEach(function (key){
          if (key.startsWith(identifier)) {
              if(nodes[nodes[key].bpointer]){
                  nodes[nodes[key].bpointer].fpointer.pop(identifier) // delete child references from parent
              }
              if(nodes[key].fpointer){ // check for childNodes
                  console.log('Not Empty. ChildNodes will be deleted')
              }
              delete nodes[key]; // delete node an all childNodes
          }
      })
      this.nodes = nodes;
      console.log(nodes);
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
tree.createNode("/", "/", 'directory',null);

class App extends React.Component {
    constructor(props) {
        super(props);
        this.tree = props.tree;
        this.state = {
            nodeType: '',
            nodeTag: '',
            nodeIdentifier: '',
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
        tree.createNode(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType ,this.state.parent)
        this.setState({
          tree: tree
        },() => console.log('ADDED'));
    }


    delete() {
        //const newList = this.state.tree.filter((item) => item.name !== this.state.nodeTag); // remove by filtering
        //this.setState({treeNodeList: newList});
        tree.removeNode(this.state.nodeIdentifier)
        this.setState({
            tree: tree
          },() => console.log('DELETED'));

    }

    move() {
        //return ReactDom.render(<TreeNode/>, document.getElementById('a'))
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

        var nodeTag = command[2].substring(idx+1)
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
                nodeType: command[1],
                nodeTag: command[2]
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
        if(this.state.tree.nodes){
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
          })*/return(
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
                  treeNodes={Object.values(this.state.tree.nodes)}  /></ul>
            </div>
        )
        }
        else{
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
