const vscode = require('vscode');
const exec = require('child_process').exec;
const fs = require('fs');

/**
 * @var terminal
 * @type {vscode.Terminal}
 */
var terminal;

/**
 * @var SpecialChars
 * @type {RegExp}
 */
const SpecialChars = /[`!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~±§]/;

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
	// QuickPick options
	const QuickPickOptions = {
		title: "Project Type",
		ignoreFocusOut: true,
		canPickMany: false,
	};

	let ProjectType = await vscode.window.showQuickPick(["App", "Library"], QuickPickOptions);
	if (ProjectType === undefined) { return; }

	// Folder picker options
	const OpenDialogOptions = {
		canSelectMany: false,
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	};

	// Get the full path of new Project
	// Use folder picker
	let DirPath = "";
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => DirPath = fileUri[0].fsPath );

	// Return if no folder is selected
	if (DirPath === undefined || DirPath === '0') { return; }

	// Take input
	let ProjectName = await vscode.window.showInputBox({
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

			if (SpecialChars.test(text) == true)
				return "Special characters not allowed"

			let FilenameOutput = undefined;
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

	if (ProjectName === undefined) { return; }

	switch (ProjectType)
	{
		case "App":
		ExecCmd("NewApp.sh", [ProjectName, DirPath]);
		break;

		case "Library":
		ExecCmd("NewLib.sh", [ProjectName, DirPath]);
		break;
	}
	
	vscode.window.showInformationMessage('C++ project created');
}

async function NewClass()
{
	let WsFolderPath = GetRootPath()
	let ProjectName = GetProjectName();

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
	let DirPath = "";
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => DirPath = fileUri[0].fsPath );

	// Return if no folder is selected
	if (DirPath === undefined || DirPath === '0') { return; }

	let DirName = DirPath.replace(WsFolderPath + "/src", "");
	if (DirName == "") { DirName = "."; }
	else { DirName = DirName.replace("/", ""); }

	console.log(DirName);

	// Input new class name
	let ClassName = await vscode.window.showInputBox({
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

			if (SpecialChars.test(text) == true)
				return "Special characters not allowed"

			let FilenameOutput = undefined;
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

	console.log(ExecCmd("NewClass.sh", [WsFolderPath, DirPath, ClassName, DirName, ProjectName]));
}

async function RunExe()
{
	// Create/re-create terminal
	if (terminal) { terminal.dispose(); }

	terminal = vscode.window.createTerminal("Code");
	terminal.show(false);

	let WsFolderPath = GetRootPath();
	let ProjectName = GetProjectName();

	// run exe
	terminal.sendText("cd \"" + WsFolderPath + "/build\"" + " && ./" + ProjectName);
}

async function Configure()
{
	let WsFolderPath = GetRootPath()
	console.log(ExecCmd("Configure.sh", [WsFolderPath]));
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
	let WsFolderPath = GetRootPath();
	let ProjectName = "";

	for (let i = (WsFolderPath.lastIndexOf("/") + 1); i < WsFolderPath.length; i++)
		ProjectName += WsFolderPath[i];

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
	let Cmd = "cd /; cd " + __dirname.replace(" ", "\\ ") + "; sh " + BashFile + " ";
	BashParams.forEach(value =>
	{
		Cmd += "\"" + value + "\" ";
	});

	let Output;
	exec(Cmd, (error, stdout) => Output = stdout);
	return Output;
}

module.exports = {
	activate,
	deactivate
}