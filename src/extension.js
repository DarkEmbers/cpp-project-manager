// Imports
const vscode = require('vscode');
const exec = require('child_process').exec;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context)
{
	console.log('Congratulations, your extension "cpp-project-manager" is now active!');

	// Bind commands to functions
	context.subscriptions.push(vscode.commands.registerCommand('cpp-project-manager.NewProject', NewProject));
	context.subscriptions.push(vscode.commands.registerCommand('cpp-project-manager.NewClass', NewClass));

}

// this method is called when your extension is deactivated
function deactivate()
{

}

async function NewProject()
{
	// Folder picker options
	const OpenDialogOptions = 
	{
		canSelectMany: false,
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	};

	// Get the full path of new class
	// Use folder picker
	var DirPath;
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => 
	{
		if (fileUri === undefined) { return; }
		DirPath = fileUri[0].fsPath;

	});

	// Cancel if no folder is selected
	if (DirPath === undefined) { return; }

	// Take input
	var ProjectName = await vscode.window.showInputBox(
	{
		placeHolder: "Project Name",
		prompt: "Your new project name",
		value: "MyProject"
	});
	
	if(ProjectName === '')
		vscode.window.showErrorMessage('Cannot leave empty');
	  
	if(ProjectName === undefined) { return; }
	
	// Create command
	var Cmd = "cd /; cd " + __dirname.replace(" ", "\\ ") + "; source BashCmds.sh && NewCppProject \"" + ProjectName + "\" " + DirPath.replace(" ", "\\ ");

	// Exec command
	exec(Cmd,
	function (error, stdout, stderr)
	{
		if (stdout === "Failed\n")
		{
			vscode.window.showErrorMessage('Project with same name already exists');
			return;
		}

		vscode.window.showInformationMessage('C++ project created');
	});

}

async function NewClass()
{
	// Get full path to root folder of project
	
	var WsFolderPath = vscode.workspace.workspaceFolders[0].uri.path;
	if (WsFolderPath === undefined)
	{
		vscode.window.showErrorMessage('No Vscode Workspace is currently open');
		return;
	}

	var ProjectName = ""
	for(var i = (WsFolderPath.lastIndexOf("/") + 1); i < WsFolderPath.length; i++) { ProjectName += WsFolderPath[i]; }

	// Folder picker options
	const OpenDialogOptions = 
	{
		defaultUri: vscode.Uri.file(WsFolderPath + "/Source"),
		canSelectMany: false,
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	};

	// Get the full path of new class
	// Use folder picker
	var DirPath;
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => 
	{
		if (fileUri === undefined) { return; }
		DirPath = fileUri[0].fsPath;

	})

	// Cancel if no folder is selected
	if (DirPath === undefined) { return; }

	// Find the Name of the directory 
	var Index = DirPath.replace(" ", "\\ ").indexOf("Source", -1);
	Index += "Source/".length
	var DirName = ""

	for(var i = Index; i < DirPath.length; i++)
		DirName += DirPath[i];

	// Input new class name
	var ClassName = await vscode.window.showInputBox(
	{
		placeHolder: "Class Name",
		prompt: "Your new class name",
		value: "MyClass"
	});

	if (ClassName === undefined) { return; }

	// Error messages for invalid class names
	if(ClassName === '')
	{
		vscode.window.showErrorMessage('Cannot leave empty');
		return;
	} 
	else if (ClassName.includes(" "))
	{
		vscode.window.showErrorMessage('Class name cannot have spaces');
		return;
	}
	
	// Create class
	var Cmd = 	"cd /; cd " + __dirname.replace(" ", "\\ ") + "; source BashCmds.sh && NewClass " + 
				WsFolderPath.replace(" ", "\\ ") + " " + 
				DirPath.replace(" ", "\\ ") + " \'" + 
				ClassName + "\' \'" + 
				DirName + "\' \'" +
				ProjectName + "\'";

	exec(Cmd,
	function (error, stdout, stderr)
	{
		if (stdout.includes("File exists\n"))
		{
			vscode.window.showErrorMessage('Class name is taken');
			return;
		}

		console.log("stdout: " + stdout)
		console.log("stderr: " + stderr)
		
	});

}

module.exports = 
{
	activate,
	deactivate
}