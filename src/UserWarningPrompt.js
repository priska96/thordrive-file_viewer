import React from "react";
import ReactDOM from "react-dom";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

class UserWarningPrompt extends React.Component {

    constructor(props) {
        super(props);
        this.open = props.open
        this.textObj = props.textObj
        this.state = {
            open: this.open,
            textObj: this.textObj
        }
    }
    closeModal(closeIt){
        this.setState({
                open: closeIt,
                textObj: {}
            }
        )
    }
    render() {
        return (
            <div><Dialog
                open={this.state.open}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">{this.state.textObj.messageTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">{this.state.textObj.messageText}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.closeModal(false)} color="primary">
                        {this.state.textObj.cancelText}
                    </Button>
                    <Button onClick={this.closeModal(false)} color="primary" autoFocus>
                        {this.state.textObj.confirmText}
                    </Button>
                </DialogActions>
            </Dialog></div>
        )
    }
}

UserWarningPrompt.defaultProps = {
    open: false,
    textObj: {  open: true,
                cancelText: 'Ok',
                confirmText: 'Ok',
                messageText: 'The comannd you used is unknown. ' +
                    'Please try one of the follwoing: "add, delete, move, link, change"',
                messageTitle: 'Error: Wrong command!'
            }
}

export default UserWarningPrompt;