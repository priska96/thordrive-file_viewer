# Getting Started with ThorDrive File Viewer

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
In every GUI based Operating System, there is GUI based file viewer such as Finder in Mac, Files in
ubuntu, File explorer in Windows. At the beginning, there is only one root directory in the file system.
A user can add, delete or move a file/directory or make symbolic link of it. Changing properties of a
file/directory is also possible, but if a directory’s properties are changed, it is also applied to the
files/directories inside it.
The goal of the program is to make a GUI file viewer using your own GUI tool implementing core
functions mentioned above. The file structure should be displayed in GUI, but user input/command
doesn’t have to be GUI (it is optional).
I/O:
- input: user command (such as add/delete/link/move/change)
- output: graphical representation of the file structure.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

If npm, nodeJS and the required dev-dependency are installed you should be 
able to run the program on localhost by using 'npm start'.

If the local server should not work you can run the program in this CodeSandbox as well:
https://codesandbox.io/s/determined-hawking-of3vj?file=/public/index.html

## Libraries/ external resources that were used for this project
I used Bootstrap and Font Awesome for displaying the layout.
