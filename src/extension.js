const vscode = require('vscode');
const exec = require('child_process').exec;
const fs = require('fs');

/**
 * @var terminal
 * @type {vscode.Terminal}
 */
var terminal;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/**@param {vscode.ExtensionContext} context*/
function activate(context)
{
	// Bind commands to functions
	context.subscriptions.push(vscode.commands.registerCommand('cpp-project-manager.NewProject', NewProject));
	context.subscriptions.push(vscode.commands.registerCommand('cpp-project-manager.NewClass', NewClass));
	context.subscriptions.push(vscode.commands.registerCommand('cpp-project-manager.RunExe', RunExe));
	context.subscriptions.push(vscode.commands.registerCommand('cpp-project-manager.Configure', Configure));
}

// this method is called when your extension is deactivated
function deactivate()
{

}

async function NewProject()
{
	// Folder picker options
	const OpenDialogOptions = {
		canSelectMany: false,
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	};

	// Get the full path of new Project
	// Use folder picker
	var DirPath = "";
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri =>
	{
		DirPath = fileUri[0].fsPath;
	});

	// Return if no folder is selected
	if (DirPath === undefined)
		return;

	// Take input
	var ProjectName = await vscode.window.showInputBox({
		placeHolder: "MyProject",
		prompt: "Your new C++ project name",
		value: "MyProject",
		title: "Project Name",
		ignoreFocusOut: true,
		validateInput: text =>
		{
			if (text === "")
				return "Cannot leave empty";

			else if (text.includes(" "))
				return "Project name cannot have spaces";

			var FilenameOutput = undefined;
			fs.readdirSync(DirPath).forEach(file =>
			{
				if (file.trim().toLowerCase() == text.toLowerCase())
				{
					FilenameOutput = "File with same name already exists";
					return;
				}

			});

			if (FilenameOutput !== undefined)
				return FilenameOutput;

		}

	});

	if (ProjectName === undefined)
		return;

	ExecCmd("NewProject.sh", [ProjectName, DirPath.replace(" ", "\\ ")]);
	vscode.window.showInformationMessage('C++ project created');
}

async function NewClass()
{
	var WsFolderPath = GetRootPath()
	var ProjectName = GetProjectName();

	// Folder picker options
	const OpenDialogOptions = {
		defaultUri: vscode.Uri.file(WsFolderPath + "/src"),
		canSelectMany: false,
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	};

	// Get the full path of new class
	// Use folder picker
	var DirPath = "";
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri =>
	{
		DirPath = fileUri[0].fsPath;
	})

	// Return if no folder is selected
	if (DirPath === undefined)
		return;

	var DirName = DirPath.replace(WsFolderPath + "/src", "");

	if (DirName == "")
		DirName = ".";

	else
		DirName = DirName.replace("/", "");

	// Input new class name
	var ClassName = await vscode.window.showInputBox({
		placeHolder: "MyClass",
		prompt: "Your new class name",
		value: "MyClass",
		title: "Class Name",
		ignoreFocusOut: true,
		validateInput: text =>
		{
			if (text === "")
				return "Cannot leave empty";

			else if (text.includes(" "))
				return "Class name cannot have spaces";

			var FilenameOutput = undefined;
			fs.readdirSync(DirPath).forEach(file =>
			{
				if (file.trim().toLowerCase() == text.toLowerCase() + ".cpp")
				{
					FilenameOutput = "File with same name already exists";
					return;
				}

			});

			if (FilenameOutput !== undefined)
				return FilenameOutput;

		}
	});

	if (ClassName === undefined) { return; }

	ExecCmd("NewClass.sh", [WsFolderPath.replace(" ", "\\ "), DirPath.replace(" ", "\\ "), ClassName, DirName, ProjectName]);
}

async function RunExe()
{
	// Create/re-create terminal
	if (terminal)
		terminal.dispose();

	terminal = vscode.window.createTerminal("Code");
	terminal.show(false);

	var WsFolderPath = GetRootPath();
	var ProjectName = GetProjectName();

	// run exe
	terminal.sendText("cd " + WsFolderPath + "/build" + " && ./" + ProjectName);
}

async function Configure()
{
	var WsFolderPath = GetRootPath()
	ExecCmd("Configure.sh", [WsFolderPath.replace(" ", "\\ ")]);
}

/**
 * @summary Gets the absolute path of the workspace i.e the root path
 * @returns {string}
 */
function GetRootPath()
{
	try { return vscode.workspace.workspaceFolders[0].uri.path; }
	catch (error) { vscode.window.showErrorMessage('No project workspace is currently open'); }

}

/**
 * @summary Returns Project Name
 * @returns {string} string
 */
function GetProjectName()
{
	var WsFolderPath = GetRootPath();
	var ProjectName = ""

	for (var i = (WsFolderPath.lastIndexOf("/") + 1); i < WsFolderPath.length; i++)
	{
		ProjectName += WsFolderPath[i];
	}

	return ProjectName;
}

/**
 * @summary Executes a command from bash file
 * @param {string} BashFile Name of Bash file to run
 * @param {string[]} BashParams List of params to run with bash file
 * @returns {string} string
 */
function ExecCmd(BashFile, BashParams)
{
	var Cmd = "cd /; cd " + __dirname.replace(" ", "\\ ") + "; sh " + BashFile + " ";
	BashParams.forEach(value =>
	{
		Cmd += "\"" + value + "\" ";
	});

	var Output;
	exec(Cmd,
		function (error, stdout)
		{
			Output = stdout;
		});

	return Output;
}

module.exports = {
	activate,
	deactivate
}