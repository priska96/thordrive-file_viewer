import React from "react";
import Tree from "./MyFileSystem"
import {Button, Modal} from "react-bootstrap";

class App extends React.Component {
    constructor(props) {
        super(props);
        //this.tree = props.tree;
        var tree = new Tree({nodes: {}, root: null});
        tree.createNode("/", "/", 'directory', null, 'add');

        tree.createNode("a", "/a", 'directory', '/', 'add');

        tree.createNode("b", "/b", 'directory', '/', 'add');
        tree.createNode("a", "/b/a", 'directory', '/b', 'add');
        tree.createNode("c", "/b/a/c", 'directory', '/b/a', 'add');
        tree.createNode("d", "/b/a/c/d", 'directory', '/b/a/c', 'add');

        tree.createNode("e", "/b/a/c/d/e", 'file', '/b/a/c/d', 'add');
        tree.createNode("f", "/b/a/c/f", 'directory', '/b/a/c', 'add');
        tree.linkNode("/b/a/c/d", "/a", 1);
        tree.createNode("sdf", "/a/sdf", 'file', '/a', 'add');
        this.state = {
            userCommand: '',
            nodeType: '',
            nodeTag: '',
            nodeIdentifier: '',
            nodeIdentifierTo: '',
            nodeProperties: '',
            parent: '',
            counter: 0,
            tree: tree,
            error: false,
            errorMsg: {},
            proceedCancel: false,
            callback: ''
        };
        this.add = this.add.bind(this);
        this.addRecursive = this.addRecursive.bind(this);
        this.preDelete = this.preDelete.bind(this);
        this.delete = this.delete.bind(this);
        this.move = this.move.bind(this);
        this.link = this.link.bind(this);
        this.change = this.change.bind(this)
        this.handleChange = this.handleChange.bind(this);
        this.handleCommand = this.handleCommand.bind(this);

    }

    closeModal() {
        this.setState({
            error: false,
            errorMsg: {}
        })
    }

    closeModalProceed(proceed) {
        this.setState({
            error: false,
            errorMsg: {},
            //proceedCancel: proceed
        }, () => {
            this[this.state.callback]();
        })

    }

    addRecursive() {
        var response = this.tree.createNodeRecursive(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType, this.state.parent, 'add', 1)
        var success = response[0]
        var errorMsg = response[1]
        if (!(success)) {
            this.setState({
                error: true,
                errorMsg: errorMsg,
                callback: errorMsg.callback
            })
        } else {
            this.setState({
                tree: this.tree
            }, () => console.log('ADDED'));
        }
    }

    add() {
        console.log(this.tree);
        var response = this.tree.createNode(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType, this.state.parent, 'add')
        var success = response[0]
        var errorMsg = response[1]
        if (!(success)) {
            this.setState({
                error: true,
                errorMsg: errorMsg,
                callback: errorMsg.callback
            })
        } else {
            this.setState({
                tree: this.tree
            }, () => console.log('ADDED'));
        }
    }

    delete() {
        this.tree.removeNode(this.state.nodeIdentifier)
        this.setState({
            tree: this.tree
        }, () => console.log('DELETED'));
        return true;
    }

    preDelete() {
        // Exception Handling
        if (this.state.nodeIdentifier.includes('_linked')) { // check if it's a symlink
            var possible = this.tree.nodes[this.state.nodeIdentifier].type === 'directory' ? 'Possible including files will be deleted as well. ' : ''
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The ${this.tree.nodes[this.state.nodeIdentifier].type} 
                    ${this.tree.nodes[this.state.nodeIdentifier].tag} you are trying to delete is just a symbolic link. 
                    The actual ${this.tree.nodes[this.state.nodeIdentifier].type} 
                    ${this.tree.nodes[this.tree.nodes[this.state.nodeIdentifier].link].tag} will not be deleted. ${possible}Would you like to proceed?`,
                    messageTitle: `Warning: The ${this.tree.nodes[this.state.nodeIdentifier].type} is a symbolic link`,
                    icon: 'fas fa-exclamation-triangle',
                    proceed: 'Prcoeed',
                    cancel: 'Cancel'
                },
                callback: 'delete'
            })
            return false;
        } else {
            // directory/ file has a symlink notice user these will delete as well
            if (this.tree.nodes[this.state.nodeIdentifier].linkTo) { // check if has a symlink
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The ${this.tree.nodes[this.state.nodeIdentifier].type} 
                        ${this.tree.nodes[this.state.nodeIdentifier].tag} has a symbolic link. 
                        Would you like to delete ${this.tree.nodes[this.state.nodeIdentifier].tag} and all its symbolic links?.`,
                        messageTitle: `Warning: The ${this.tree.nodes[this.state.nodeIdentifier].type} has a symbolic link`,
                        icon: 'fas fa-exclamation-triangle',
                        proceed: 'Proceed',
                        cancel: 'Cancel'
                    },
                    callback: 'delete'
                })
                return false;
            }
        }
        //
        // // either directory is empty/it's a file or user decided to delete anyways
        // if(tree.nodes[this.state.nodeIdentifier].fpointer.length === 0 ||
        //     (this.state.proceedCancel && !(this.state.error) && Object.keys(this.state.errorMsg).length === 0)){
        //     tree.removeNode(this.state.nodeIdentifier)
        //         this.setState({
        //             tree: tree
        //         }, () => console.log('DELETED'));
        //     return true;
        // }
        // Excepytion Handling
        // check if directory is empty
        if (this.tree.nodes[this.state.nodeIdentifier].fpointer) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The directory ${this.tree.nodes[this.state.nodeIdentifier].tag} you are trying to delete is not empty. 
                Everything in it will be delete as well. Would you like to proceed?`,
                    messageTitle: 'Warning: The directory is not empty',
                    icon: 'fas fa-exclamation-triangle',
                    proceed: 'Proceed',
                    cancel: 'Cancel'
                },
                callback: 'delete'
            })
            return false;
        }
        return this.delete();
    }

    move() {
        this.tree.moveNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo, this.state.nodeIdentifier)
        this.tree.updateIdentifier()
        this.setState({
            tree: this.tree
        }, () => console.log('MOVED'));
    }

    link() {
        this.tree.linkNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo, 1)
        this.setState({
            tree: this.tree
        }, () => console.log('LINKED'));
    }

    change() {
        this.tree.changeNode(this.state.nodeIdentifier, this.state.nodeProperties)
        this.setState({
            tree: this.tree
        }, () => console.log('CHANGED'));
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleCommand() {
        var command = this.state.userCommand.split(' ');// split the user's command

        // Exception Handling: wrong user command
        if (!(command[0].match(/\b(\w*add|delete|move|link|change\w*)\b/g)) || command.length === 0) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: 'The comannd you used is unknown. ' +
                        'Please try one of the following: "add, delete, move, link, change"',
                    messageTitle: 'Error: Wrong command!',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
            })
            return;
        }
        if (command[0] === 'add' && command.length !== 3) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The comannd you used is unknown. Please try the following: "${command[0]} type fullpath"`,
                    messageTitle: 'Error: Wrong command!',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
            })
            return;
        }

        if ('add' === command[0]) {
            var idx = command[2].lastIndexOf('/')
            var nodeTag = command[2].substring(idx + 1)
            var parentName = command[2].substring(0, idx)
            if (idx === 0) parentName = command[2].substring(0, idx + 1)
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
            if (!(command[1] in this.state.tree.nodes) && !(command[1] + '_linked' in this.state.tree.nodes)) { // check if directory/ file or its link exists
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The directory or file does not exist. Cannot delete ${command[1]}.`,
                        messageTitle: `Error: Directory or file does not exist!`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            this.setState({
                nodeIdentifier: (command[1] + '_linked' in this.state.tree.nodes ? command[1] + '_linked' : command[1]),
            }, () => {
                this.preDelete()
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
                nodeProperties: command[2]
            }, () => {
                this.change()
            });
        } else {
            console.log('else')
        }

    }

    render() {
        //console.log('render methods treeNodeList: ', this.state.tree)
        //var treenodes = Object.entries(this.state.tree.nodes).filter((item) => item.idenfitier = this.state.tree.root);

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
                <Modal show={this.state.error}>
                    <Modal.Header>
                        <Modal.Title>{this.state.errorMsg.messageTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{this.state.errorMsg.messageText}</Modal.Body>
                    <Modal.Footer>
                        {this.state.errorMsg.cancel ?
                            <Button variant="secondary" onClick={this.closeModal()}>
                                {this.state.errorMsg.cancel}
                            </Button> : null}
                        {this.state.errorMsg.proceed ?
                            <Button variant="primary" onClick={this.closeModalProceed(true)}>
                                {this.state.errorMsg.proceed}
                            </Button> : null}

                    </Modal.Footer>
                </Modal>
                {/*<Popup open={this.state.error} modal position="right center" closeOnDocumentClick={false}*/}
                {/*       closeOnEscape={false}>*/}
                {/*    {close => (*/}
                {/*        <div className="modal">*/}
                {/*            <div className="header"><i className={this.state.errorMsg.icon}></i>{this.state.errorMsg.messageTitle}</div>*/}
                {/*            <div className="content">{this.state.errorMsg.messageText}</div>*/}
                {/*            <div className="actions">*/}
                {/*                {this.state.errorMsg.cancel ? <button className="button" onClick={() => {*/}
                {/*                    this.closeModal();*/}
                {/*                }}>{this.state.errorMsg.cancel}</button> : null}*/}

                {/*                {this.state.errorMsg.proceed ? <button className="button" onClick={() => {*/}
                {/*                    this.closeModalProceed(true);*/}
                {/*                }}>{this.state.errorMsg.proceed}</button> : null}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</Popup>*/}
                <label>User Command
                    <input
                        type="text"
                        name="userCommand"
                        value={this.state.userCommand}
                        onChange={this.handleChange}
                        placeholder="e.g add directory /b"
                    />
                </label>
                <button onClick={this.handleCommand}>Go</button>
                {/*<button onClick={this.delete}>Delete</button>*/}
                {/*<button onClick={this.move}>Move</button>*/}
                {/*<button onClick={this.link}>Link</button>*/}
                <h2>Your current file tree looks as follows</h2>
                <Tree root={this.state.tree.root} nodes={this.state.tree.nodes}/>
            </div>
        )
    }
}

export default App;