import React from "react";
import Tree from "./MyFileSystem"
import {Accordion, Button, Card, Col, Container, FormControl, InputGroup, Jumbotron, Modal, Row} from "react-bootstrap";


class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            userCommand: '',
            nodeType: '',
            nodeTag: '',
            nodeIdentifier: '',
            nodeIdentifierTo: '',
            nodeProperties: '',
            parent: '',
            counter: 0,
            tree: {},
            error: false,
            errorMsg: {},
            callback: '',
            proceedAction: '',
            reName: false,
            renameMsg: {},
            renameCommand: '',
            overWrite: false,
            meRge: false
        };
        this.add = this.add.bind(this);
        this.addRecursive = this.addRecursive.bind(this);
        this.preDelete = this.preDelete.bind(this);
        this.delete = this.delete.bind(this);
        this.preMove = this.preMove.bind(this);
        this.move = this.move.bind(this);
        this.link = this.link.bind(this);
        this.change = this.change.bind(this)
        this.handleChange = this.handleChange.bind(this);
        this.handleCommand = this.handleCommand.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.closeModalProceed = this.closeModalProceed.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleRenameCommand = this.handleRenameCommand.bind(this);
        this.reName = this.reName.bind(this);
        this.overWrite = this.overWrite.bind(this);
        this.meRge = this.meRge.bind(this); // possible todo
    }

    closeModal() {
        this.setState({
            error: false,
            errorMsg: {}
        })
    }

    closeModalProceed(proceedAction) {
        this.setState({
            error: false,
            errorMsg: {},
            proceedAction: proceedAction,
            reName: false,
            renameMsg: {},
        }, () => {
            if (proceedAction) {
                return this[proceedAction]();
            }
            this[this.state.callback]();
        })

    }

    handleRenameCommand() {
        let tree = this.state.tree;
        let node = tree.nodes[this.state.nodeIdentifier];
        tree.nodes[node.parent].updateChildren(node.identifier, 'delete');
        node.identifier = node.identifier.replace(node.tag, this.state.renameCommand);
        tree.nodes[node.parent].updateChildren(node.identifier, 'add');
        node.tag = this.state.renameCommand
        tree.nodes[node.identifier] = node;
        delete tree.nodes[this.state.nodeIdentifier];
        this.setState({
            tree: tree,
            proceedAction: '',
            nodeIdentifier: node.identifier
        }, () => {
            this.closeModalProceed()
        })
    }

    reName() {
        this.setState({
            reName: true,
            renameMsg: {
                open: true,
                messageText: `Please rename the file ${this.state.tree.nodes[this.state.nodeIdentifier].tag} with a unique name.`,
                messageTitle: `Notify: Rename ${this.state.tree.nodes[this.state.nodeIdentifier].tag}`,
                icon: 'fas fa-exclamation-triangle',
                proceed: 'Rename',
                cancel: 'Cancel'
            },
        })
    }

    overWrite() {
        this.setState({overWrite: true});
        this.closeModalProceed();
    }

    meRge() {
        this.setState({meRge: true});
        this.closeModalProceed();
    }

    addRecursive() {
        let response = this.state.tree.createNodeRecursive(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType, this.state.parent, 'add', 1)
        let success = response[0]
        let errorMsg = response[1]
        if (!(success)) {
            this.setState({
                error: true,
                errorMsg: errorMsg,
                callback: errorMsg.callback
            })
        } else {
            this.setState({
                tree: this.state.tree
            }, () => {
                /*let tree = this.state.tree
                Object.values(tree.nodes).forEach(function (node) {
                    node.updateSize(tree.nodes);
                })
                this.setState({
                    tree: tree
                })*/
                console.log('ADDED')
            });
        }
    }

    add() {
        let response = this.state.tree.createNode(this.state.nodeTag, this.state.nodeIdentifier, this.state.nodeType, this.state.parent, 'add')
        let success = response[0]
        let errorMsg = response[1]
        if (!(success)) {
            this.setState({
                error: true,
                errorMsg: errorMsg,
                callback: errorMsg.callback
            })
        } else {
            this.setState({
                tree: this.state.tree
            }, () => {
                /*let tree = this.state.tree
                Object.values(tree.nodes).forEach(function (node) {
                    node.updateSize(tree.nodes);
                })
                this.setState({
                    tree: tree
                })*/
                console.log('ADDED')
            });
        }
    }

    delete() {
        this.state.tree.removeNode(this.state.nodeIdentifier)
        this.setState({
            tree: this.state.tree
        }, () => {
            /*let tree = this.state.tree
            Object.values(tree.nodes).forEach(function (node) {
                node.updateSize(tree.nodes);
            })
            this.setState({
                tree: tree
            })*/
            console.log('DELETED')});
        return true;
    }

    preDelete() {
        // Exception Handling
        if (this.state.nodeIdentifier.includes('_linked')) { // check if it's a symlink
            let possible = this.state.tree.nodes[this.state.nodeIdentifier].type === 'directory' ? 'Possible including files will be deleted as well. ' : ''
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The ${this.state.tree.nodes[this.state.nodeIdentifier].type} 
                    ${this.state.tree.nodes[this.state.nodeIdentifier].tag} you are trying to delete is just a symbolic link. 
                    The actual ${this.state.tree.nodes[this.state.nodeIdentifier].type} 
                    ${this.state.tree.nodes[this.state.tree.nodes[this.state.nodeIdentifier].link].tag} will not 
                    be deleted. ${possible}Would you like to proceed?`,
                    messageTitle: `Warning: The ${this.state.tree.nodes[this.state.nodeIdentifier].type} is a symbolic link`,
                    icon: 'fas fa-exclamation-triangle',
                    proceed: 'Proceed',
                    cancel: 'Cancel'
                },
                callback: 'delete'
            })
            return false;
        } else {
            // directory/ file has a symlink notice user these will delete as well
            if (this.state.tree.nodes[this.state.nodeIdentifier].linkTo) { // check if has a symlink
            let possible = this.state.tree.nodes[this.state.nodeIdentifier].type === 'directory' ?
                `The directory ${this.state.tree.nodes[this.state.nodeIdentifier].tag} you are trying to delete is not empty. ` : ''
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `${possible}The ${this.state.tree.nodes[this.state.nodeIdentifier].type} 
                        ${this.state.tree.nodes[this.state.nodeIdentifier].tag} has a symbolic link. 
                        Would you like to delete ${this.state.tree.nodes[this.state.nodeIdentifier].tag} and all its symbolic links?.`,
                        messageTitle: `Warning: The ${this.state.tree.nodes[this.state.nodeIdentifier].type} has a symbolic link`,
                        icon: 'fas fa-exclamation-triangle',
                        proceed: 'Proceed',
                        cancel: 'Cancel'
                    },
                    callback: 'delete'
                })
                return false;
            }
        }
        // Exception Handling
        // check if directory is empty
        if (this.state.tree.nodes[this.state.nodeIdentifier].children) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The directory ${this.state.tree.nodes[this.state.nodeIdentifier].tag} you are trying 
                    to delete is not empty. Everything in it will be delete as well. Would you like to proceed?`,
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

    preMove() {
        //Exception Handling
        // first case: same location -> do nothing
        // second case: directory/file already exists -> overwrite directories/ overwrite or rename files
        // check if directory exists
        if(this.state.nodeIdentifier === this.state.nodeIdentifierTo){
            this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The provided path is the same. Nothing is being moving.`,
                        messageTitle: `Warning: The path is the same`,
                        icon: 'fas fa-exclamation-triangle',
                        cancel: 'Cancel'
                    },
                })
                return false;
        }
        let nodeTo = this.state.tree.nodes[this.state.nodeIdentifierTo]
        if (nodeTo.children.includes(this.state.nodeIdentifierTo+this.state.nodeIdentifier)) {
            if (this.state.tree.nodes[this.state.nodeIdentifier].type === 'directory') { //overwrite directories possible todo: merge  or rename directories
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The directory ${this.state.tree.nodes[this.state.nodeIdentifierTo].tag} already
                        contains a directory named ${this.state.tree.nodes[this.state.nodeIdentifier].tag}. 
                        Do you wish to overwrite the existing directories and folders?`,
                        messageTitle: `Warning: The directory already exists in ${this.state.tree.nodes[this.state.nodeIdentifierTo].tag}`,
                        icon: 'fas fa-exclamation-triangle',
                        //merge: 'Merge the directories',
                        //rename: 'Rename the folder',
                        overwrite: 'Overwrite all existing files and directories',
                        cancel: 'Cancel'
                    },
                    callback: 'move'
                })
                return false;
            } else { //overwrite or rename files
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The directory ${this.state.tree.nodes[this.state.nodeIdentifierTo].tag} already 
                        contains a file named ${this.state.tree.nodes[this.state.nodeIdentifier].tag}. Do you wish to 
                        overwrite or rename the file?`,
                        messageTitle: `Warning: The file already exists in ${this.state.tree.nodes[this.state.nodeIdentifierTo].tag}`,
                        icon: 'fas fa-exclamation-triangle',
                        rename: 'Rename the file',
                        overwrite: 'Overwrite the existing file',
                        cancel: 'Cancel'
                    },
                    callback: 'move'
                })
                return false;
            }
        }
        return this.move();
    }

    move() {
        //Exception Handling
        // user decided to overwrite existing directories/files
        if (this.state.overWrite) {
            let existingIdentifier = this.state.nodeIdentifierTo + this.state.nodeIdentifier//.substring(this.state.nodeIdentifier.lastIndexOf('/') + 1)
            this.state.tree.removeNode(existingIdentifier)
        }
        this.state.tree.moveOrLinkNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo, 1, false)
        this.setState({
            tree: this.state.tree,
            overWrite: false
        }, () => {
                /*let tree = this.state.tree
                Object.values(tree.nodes).forEach(function (node) {
                    node.updateSize(tree.nodes);
                })
                this.setState({
                    tree: tree
                })*/
                console.log('MOVED')
            });
    }

    link() {
        let nodeFrom = this.state.tree.nodes[this.state.nodeIdentifier]
        let nodeTo = this.state.tree.nodes[this.state.nodeIdentifierTo]
        // Exception Handling loops
        // first case: links to itself
        // second case: nodeTo(path_to_link) links back to some parent folder
        // third case: nodeFrom contains a symlink that links to a sub folder of nodeTo(path_to_link)
        if( nodeFrom === nodeTo){
            this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The creation of the symbolic link in this directory would lead to a symbolic 
                        link loop. Cannot create symbolic link.`,
                        messageTitle: `Error: Symbolic link loop`,
                        icon: 'fas fa-times-circle',
                        cancel: 'Cancel'
                    },
                })
            return false;
        }
        if (nodeFrom.type === 'directory') { // only loops when it's a directory
            let children = this.state.tree.getAllChildNodesList(this.state.nodeIdentifier) // get all child nodes of from node
            let childrenSymlinks = this.state.tree.getAllChildNodesList(this.state.nodeIdentifier, true) // get all child nodes of from node
            let childrenTo = this.state.tree.getAllChildNodesList(this.state.nodeIdentifierTo) // get all child nodes of from node
            childrenTo = childrenTo.concat(nodeTo.identifier) // add itself as well

            let loop = false;
            childrenTo.forEach(function (iden) {
                if (childrenSymlinks.includes(iden)) {
                    loop = true;
                }
            })

            let iden = this.state.nodeIdentifierTo.substring(0, this.state.nodeIdentifierTo.lastIndexOf('/'))
            if (iden in children || loop) { //check for loops
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The creation of the symbolic link in this directory would lead to a symbolic 
                    link loop. Cannot create symbolic link.`,
                        messageTitle: `Error: Symbolic link loop`,
                        icon: 'fas fa-times-circle',
                        cancel: 'Cancel'
                    },
                })
                return false;
            }
        }
        this.state.tree.moveOrLinkNode(this.state.nodeIdentifier, this.state.nodeIdentifierTo, 1, true)
        this.setState({
            tree: this.state.tree
        }, () => {
                /*let tree = this.state.tree
                Object.values(tree.nodes).forEach(function (node) {
                    node.updateSize(tree.nodes);
                })
                this.setState({
                    tree: tree
                })*/
                console.log('LINKED')
            });
    }

    change() {
        this.state.tree.changeNode(this.state.nodeIdentifier, this.state.nodeProperties)
        this.setState({
            tree: this.state.tree
        }, () => console.log('CHANGED'));
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleCommand() {
        let command = this.state.userCommand.trim().split(' ');// split the user's command

        // Exception Handling: wrong user command
        if (!(command[0].match(/\b(\w*add|delete|move|link|change\w*)\b/g)) || command.length === 0) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: 'The command you used is unknown. ' +
                        'Please try one of the following: "add, delete, move, link, change"',
                    messageTitle: 'Error: Wrong command!',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
            },)
            return;
        }
        if ((command[0] === 'add' && command.length !== 3) || (command[0] === 'move' && command.length !== 3) ||
            (command[0] === 'link' && command.length !== 3) || (command[0] === 'change' && command.length !== 3)) {
            let c;
            if(command[0] === 'add') c = command[0] + ' type full_path'
            if(command[0] === 'move') c = command[0] + ' full_path_from full_path_to'
            if(command[0] === 'link') c = command[0] + ' full_path_from full_path_to'
            if(command[0] === 'change') c = command[0] + ' full_path property'
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The command you used is unknown. Please try the following: "${c}"`,
                    messageTitle: 'Error: Wrong command!',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
            })
            return;
        }
        if (command[0] === 'add' && !(command[1].match(/\b(\w*directory|file\w*)\b/g))) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The command you used is unknown. Please try the following: "${command[0]} type full_path"`,
                    messageTitle: 'Error: Wrong command!',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
            })
            return;
        }
        if (command[0] === 'delete' && command.length !== 2) {
            this.setState({
                error: true,
                errorMsg: {
                    open: true,
                    messageText: `The command you used is unknown. Please try the following: "${command[0]} full_path"`,
                    messageTitle: 'Error: Wrong command!',
                    icon: 'fas fa-times-circle',
                    proceed: null,
                    cancel: 'Close'
                }
            })
            return;
        }

        if ('add' === command[0]) {
            let idx = command[2].lastIndexOf('/')
            let nodeTag = command[2].substring(idx + 1)
            let parentName = command[2].substring(0, idx)
            if (idx === 0) parentName = command[2].substring(0, idx + 1)
            this.setState({
                nodeType: command[1],
                nodeTag: nodeTag,
                nodeIdentifier: command[2],
                parent: parentName,
            }, () => {
                this.add()
            })
        }
        else if ('delete' === command[0]) {
            // do not delete root
            if (command[1] === '/') {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `You cannot delete the root directory!`,
                        messageTitle: `Error: Root directory`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            // check if directory/ file or its link exists
            if (!(command[1] in this.state.tree.nodes) && !(command[1] + '_linked' in this.state.tree.nodes)) {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The directory or file does not exist. Cannot delete ${command[1]}.`,
                        messageTitle: `Error: Directory or file does not exist`,
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
        }
        else if ('move' === command[0]) {
            if (!( command[1] in this.state.tree.nodes)) {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The Directory or file ${command[1]} does not exist. Cannot move.`,
                        messageTitle: `Error: Directory or file does not exist`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            if (!( command[2] in this.state.tree.nodes)) {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The Directory ${command[2]} does not exist. Cannot move.`,
                        messageTitle: `Error: Directory does not exist`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            this.setState({
                nodeIdentifier: command[1],
                nodeIdentifierTo: command[2],
            }, () => {
                this.preMove()
            });
        }
        else if ('link' === command[0]) {
            if (!( command[1] in this.state.tree.nodes)) {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The Directory or file ${command[1]} does not exist. Cannot link.`,
                        messageTitle: `Error: Directory or file does not exist`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            if (!( command[2] in this.state.tree.nodes)) {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The Directory ${command[2]} does not exist. Cannot link.`,
                        messageTitle: `Error: Directory does not exist`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            this.setState({
                nodeIdentifier: command[1],
                nodeIdentifierTo: command[2]
            }, () => {
                this.link()
            });
        }
        else if ('change' === command[0]) {
            if (!(command[2] in this.state.tree.nodes[command[1]].properties)) {
                this.setState({
                    error: true,
                    errorMsg: {
                        open: true,
                        messageText: `The property ${command[2]} does not exist. Cannot change ${this.state.tree.nodes[command[1]].tag}.`,
                        messageTitle: `Error: Unknown property`,
                        icon: 'fas fa-times-circle',
                        proceed: null,
                        cancel: 'Close'
                    }
                })
                return;
            }
            this.setState({
                nodeIdentifier: command[1],
                nodeProperties: command[2]
            }, () => {
                this.change()
            });
        }
    }
    componentDidMount() {
        console.log('Init tree')
        let tree = new Tree({nodes: {}, root: null});
        tree.createNode("/", "/", 'directory', null, 'add');

        tree.createNode("a", "/a", 'directory', '/', 'add');

        tree.createNode("b", "/b", 'directory', '/', 'add');
        tree.createNode("a", "/b/a", 'directory', '/b', 'add');
        tree.createNode("c", "/b/a/c", 'directory', '/b/a', 'add');
        tree.createNode("d", "/b/a/c/d", 'directory', '/b/a/c', 'add');

        tree.createNode("e", "/b/a/c/d/e", 'file', '/b/a/c/d', 'add');
        tree.createNode("f", "/b/a/c/f", 'directory', '/b/a/c', 'add');
        tree.moveOrLinkNode("/b/a/c/d", "/a", 1, true);
        tree.createNode("sdf", "/a/sdf", 'file', '/a', 'add');
        tree.createNode("sdf", "/b/sdf", 'file', '/b', 'add');
        /*Object.values(tree.nodes).forEach(function (node) {
            node.updateSize(tree.nodes);
        })*/
        this.setState({
            tree: tree
        })

    }

    render() {
        return (
            <div>
                <Jumbotron>
                    <h1><span className="orange-text">ThorDrive</span>'s File Viewer</h1>
                  <p>
                    This is a GUI based file tree viewer. A user can add, delete or move a file/directory or make
                      symbolic link of it. Changing properties of a file/directory is also possible, but if a
                      directory’s properties are changed, it is also applied to the files/directories inside it.
                  </p>
                <Container fluid>
                    <Row>
                        <Col>
                            <InputGroup className="mb-3 col-lg-6 col-md-8">
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="inputGroup-sizing-default">User Command</InputGroup.Text>
                                </InputGroup.Prepend>
                                <FormControl
                                    aria-label="Default"
                                    aria-describedby="inputGroup-sizing-default"
                                    type="text"
                                    name="userCommand"
                                    value={this.state.userCommand}
                                    onChange={this.handleChange}
                                    placeholder="e.g add directory /b"
                                />
                                <Button variant="primary" onClick={this.handleCommand}>Go</Button>
                            </InputGroup>

                        </Col></Row>
                    <Row><Col>
                        <Accordion className="mb-3 col-lg-3 col-md-5">
                            <Card>
                                <Accordion.Toggle eventKey="0">
                                    Usage instructions
                                </Accordion.Toggle>
                                <Accordion.Collapse eventKey="0">
                                    <Card.Body>
                                        <ul>
                                            <li>add directory|file fullpath</li>
                                            <li>delete fullpath</li>
                                            <li>move fullpath_from fullpath_to</li>
                                            <li>link fullpath_from fullpath_to</li>
                                            <li>change fullpath property*</li>
                                        </ul>
                                        <span className="info">* so far only the hide property is supported</span>
                                    </Card.Body>
                                </Accordion.Collapse>
                            </Card>
                        </Accordion>
                    </Col>
                    </Row>
                    <Row>
                        <Col>
                            <h2>Your current file tree looks as follows</h2>
                        </Col>
                </Row>
                </Container>

                </Jumbotron>
                <Modal show={this.state.error} backdrop='static' centered>
                    <Modal.Header>
                        <Modal.Title><i className={this.state.errorMsg.icon}/> {this.state.errorMsg.messageTitle}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{this.state.errorMsg.messageText}</Modal.Body>
                    <Modal.Footer>
                        {this.state.errorMsg.cancel ?
                            <Button variant="secondary" onClick={this.closeModal}>
                                {this.state.errorMsg.cancel}
                            </Button> : null}
                        {this.state.errorMsg.proceed ?
                            <Button variant="primary" onClick={() => this.closeModalProceed(false)}>
                                {this.state.errorMsg.proceed}
                            </Button> : null}
                        {/*{this.state.errorMsg.merge ?*/}
                        {/*<Button variant="primary" onClick={() => this.closeModalProceed('meRge')}>*/}
                        {/*    {this.state.errorMsg.merge}*/}
                        {/*</Button> : null}*/}
                        {this.state.errorMsg.rename ?
                            <Button variant="primary" onClick={() => this.closeModalProceed('reName')}>
                                {this.state.errorMsg.rename}
                            </Button> : null}
                        {this.state.errorMsg.overwrite ?
                            <Button variant="primary" onClick={() => this.closeModalProceed('overWrite')}>
                                {this.state.errorMsg.overwrite}
                            </Button> : null}
                    </Modal.Footer>
                </Modal>
                <Modal show={this.state.reName} backdrop='static' centered>
                    <Modal.Header>
                        <Modal.Title><i className={this.state.renameMsg.icon}/> {this.state.renameMsg.messageTitle}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{this.state.renameMsg.messageText}</Modal.Body>
                    <InputGroup className="mb-3 col-lg-6 col-md-8">
                        <InputGroup.Prepend>
                            <InputGroup.Text id="inputGroup-sizing-default">New Name</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                            aria-label="Default"
                            aria-describedby="inputGroup-sizing-default"
                            type="text"
                            name="renameCommand"
                            value={this.state.renameCommand}
                            onChange={this.handleChange}
                            placeholder="e.g add directory /b"
                        />
                    </InputGroup>
                    <Modal.Footer>
                        {this.state.renameMsg.cancel ?
                            <Button variant="secondary" onClick={this.closeModal}>
                                {this.state.renameMsg.cancel}
                            </Button> : null}
                        {this.state.renameMsg.proceed ?
                            <Button variant="primary" onClick={this.handleRenameCommand}>
                                {this.state.renameMsg.proceed}
                            </Button> : null}
                    </Modal.Footer>
                </Modal>

                <Tree root={this.state.tree.root} nodes={this.state.tree.nodes}/>
            </div>
        )
    }
}

export default App;