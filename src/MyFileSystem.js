//https://github.com/guotsuan/pyTree
import React from "react";
import PropTypes from "prop-types";
import "./styles.css";

function sanitizeID(identifier) {
  return identifier.toString().trim().replace(" ", "_");
}
class Node extends React.Component {
  constructor(props) {
    super(props);
    this.tag = props.tag;
    this.identifier = props.identifier;
    if (props.fpointer) this.fpointer = props.fpointer;
    if (props.bpointer) this.bpointer = props.bpointer;
    this.updateFPointer = this.updateFPointer.bind(this);
  }
  updateFPointer(identifier, mode) {
    if (mode === "add") {
      this.fpointer.concat(identifier);
    } else if (mode === "delete") {
      this.fpointer.pop(identifier);
    } else if (mode === "insert") {
      this.fpointer = [identifier];
    }
  }
}

Node.propTypes = {
  tag: PropTypes.string,
  identifier: PropTypes.string,
  fpointer: PropTypes.array,
  bpointer: Node
};

Node.defaultProps = {
  tag: "",
  identifier: "",
  fpointer: [],
  bpointer: null
};

class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.nodes = props.nodes;
    this.root = props.root;
    this.addNode = this.addNode.bind(this);
    this.updateFPointer = this.updateFPointer.bind(this);
    this.createNode = this.createNode.bind(this);
  }
  createNode(tag, identifier, parent) {
    var node = new Node({
      tag: tag,
      identifier: identifier,
      fpointer: [],
      bpointer: null
    });
    this.addNode(node, parent);

    console.log(node);
    return node;
  }

  updateFPointer(nid, identifier, mode) {
    if (nid === null) {
      return;
    } else {
      this.nodes[nid].updateFPointer(identifier, mode);
    }
  }
  addNode(node, parent) {
    console.log("node: ", node);
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
    console.log("node: ", node);
    this.nodes[node.identifier] = node; //update dict
    this.updateFPointer(parent, node.identifier, "add");
    node.bpointer = parent;
  }
}

Tree.propTypes = {
  nodes: PropTypes.object,
  root: Node
};

Tree.defaultProps = {
  nodes: {},
  root: Node
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.tree = props.tree;
    this.state = {
      tree: {}
    };
    this.add = this.add.bind(this);
  }
  add() {
    var tree = new Tree({ nodes: {}, root: null });
    console.log(tree);
    //var node = new Node();
    tree.createNode("Harry", "harry", null); // root
    tree.createNode("Max", "max", "harry");
    tree.createNode("Lisa", "lisa", "max");
    tree.createNode("Tom", "tom", "harry");

    console.log(tree);
  }
  render() {
    return (
      <div>
        <button onClick={this.add}>Add</button>
        <button>Delete</button>
        <button>Move</button>
        <button>Link</button>
        <div id="a"></div>
      </div>
    );
  }
}

export default App;
