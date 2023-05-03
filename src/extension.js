const vscode = require("vscode");
const exec = require("child_process").exec;
const fs = require("fs");
const os = require('os');
const { execSync } = require("child_process"); 

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
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.NewProject", NewProject));
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.NewClass", NewClass));
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.RunExe", RunExe));
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.Configure", Configure));

	vscode.window.onDidCloseTerminal((EventTerminal) =>
	{
		if (EventTerminal == terminal) { terminal = undefined; }
	});

	vscode.workspace.onDidOpenTextDocument(() => 
	{
		// Check if CMakeLists.txt exists in workspace folder
		let CMakeListsPath = GetRootPath() + "/CMakeLists.txt";
		// Set context
		if (fs.existsSync(CMakeListsPath))
			vscode.commands.executeCommand("setContext", "cpp-proj.hasCMake", true);

		else
			vscode.commands.executeCommand("setContext", "cpp-proj.hasCMake", false);
	});

}

// this method is called when your extension is deactivated
function deactivate()
{

}

/**
 * @summary Setup new project with CMake
 */
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
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => DirPath = fileUri[0].fsPath);

	if (DirPath === undefined || DirPath === "0") { return; } // Return if no folder is selected

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

			if (text.match(/^[0-9A-Za-z-_]+$/) === null)
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
	var ProjectPath = DirPath + "/" + ProjectName;

	// Create folders
	CreateFolder(ProjectPath);
	CreateFolder(`${ProjectPath}/build`);
	CreateFolder(`${ProjectPath}/src`);
	CreateFolder(`${ProjectPath}/include`);
	CreateFolder(`${ProjectPath}/lib`);

	// Create files
	var Workspace = fs.readFileSync(`${__dirname}/templates/project.code-workspace`, "utf8").toString();
	CreateFile(`${ProjectPath}/${ProjectName}.code-workspace`, Workspace);

	// Get Cmake version
	var match = execSync("cmake --version").toString().match(/cmake version (\d+\.\d+\.\d+)/);
	if (!match) 
	{
		vscode.window.showErrorMessage("CMake not found");
		return;
	}
	var version = match[1];
	// Use template and fill details
	var CMakeLists = fs.readFileSync(`${__dirname}/templates/rootCMakeLists.txt`, "utf8").toString();
	CMakeLists = CMakeLists.replace(/%VER%/g, version);
	CMakeLists = CMakeLists.replace(/%NAME%/g, ProjectName);
	CMakeLists = CMakeLists.replace(/%TYPE%/g, (ProjectType == "App") ?
	"add_executable(${PROJECT_NAME} ${SRC_FILES})" : "add_library(${PROJECT_NAME} STATIC ${SRC_FILES})");
	CreateFile(`${ProjectPath}/CMakeLists.txt`, CMakeLists);

	CMakeLists = fs.readFileSync(`${__dirname}/templates/includeCMakeLists.txt`, "utf8").toString();
	CMakeLists = CMakeLists.replace(/%INC%/g, "include");
	CreateFile(`${ProjectPath}/include/CMakeLists.txt`, CMakeLists);

	CMakeLists = fs.readFileSync(`${__dirname}/templates/srcCMakeLists.txt`, "utf8").toString();
	CMakeLists = CMakeLists.replace(/%SRC%/g, (ProjectType == "App") ?
	"src/main.cpp" : `src/${ProjectName}.cpp`);
	CreateFile(`${ProjectPath}/src/CMakeLists.txt`, CMakeLists);

	// Main files
	if (ProjectType == "App")
	{
		var Main = fs.readFileSync(`${__dirname}/templates/main.cpp`, "utf8").toString();
		CreateFile(`${ProjectPath}/src/main.cpp`, Main);
	}
	else
		NewClass(ProjectPath, ProjectName);

	// Open workspace in current window
	let uri = vscode.Uri.file(`${ProjectPath}/${ProjectName}.code-workspace`);
	vscode.window.showInformationMessage("C++ project created");
	await vscode.commands.executeCommand('vscode.openFolder', uri);
}

/**
 * @summary Create new class, params are optional
 * @param {string} Path Path of the project
 * @param {string} Name Name of the class
 */
async function NewClass(Path, Name)
{
	var Code = "";
	if (Path !== undefined && Path !== undefined)
	{
		Code = fs.readFileSync(`${__dirname}/templates/class.cpp`, "utf8");
		CreateFile(`${Path}/src/${Name}.cpp`, Code.replace(/%NAME%/g, Name));
		Code = fs.readFileSync(`${__dirname}/templates/class.h`, "utf8");
		CreateFile(`${Path}/include/${Name}.h`, Code.replace(/%NAME%/g, Name));
		return;
	}

	let WsFolderPath = GetRootPath()

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
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => DirPath = fileUri[0].fsPath);

	// Return if no folder is selected
	if (DirPath === undefined || DirPath === "0") { return; }

	let DirName = DirPath.replace(WsFolderPath + "/src", "");
	if (DirName == "") { DirName = "."; }
	else { DirName = DirName.replace("/", ""); }

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

			if (text.match(/^[0-9A-Za-z-_]+$/) === null)
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

	Code = fs.readFileSync(`${__dirname}/templates/class.cpp`, "utf8");
	CreateFile(`${DirPath}/${ClassName}.cpp`, Code.replace(/%NAME%/g, ClassName));
	Code = fs.readFileSync(`${__dirname}/templates/class.h`, "utf8");
	let IncPath = DirPath.replace("src", "include");
	CreateFolder(IncPath);
	CreateFile(`${IncPath}/${ClassName}.h`, Code.replace(/%NAME%/g, ClassName));

	Configure();
}

async function RunExe()
{
	if (!terminal) { terminal = vscode.window.createTerminal("Code"); } // Create new terminal if it doesn't exist

	terminal.sendText("clear");
	terminal.show(true);

	let WsFolderPath = GetRootPath();
	let ProjectName = GetProjectName();

	// run exe
	terminal.sendText("cd \"" + WsFolderPath + "/build\"" + " && ./" + ProjectName);
}

/**
 * @summary Get all files in a directory recursively
 * @param {string} dir
 * @returns {string[]} Array of file paths
 */
function GetFiles(dir)
{
	let Files = [];
	const Items = fs.readdirSync(dir, { withFileTypes: true });

	for (const item of Items)
	{
		if (item.isDirectory())
			Files = [...Files, ...GetFiles(`${dir}/${item.name}`)];
		else
			Files.push(`${dir}/${item.name}`);
	}

	return Files;
}

/**
 * @summary Add source and configure CMakeLists.txt
 */
async function Configure()
{
	let WsFolderPath = GetRootPath();
	var CMakeLists = fs.readFileSync(`${__dirname}/templates/srcCMakeLists.txt`, "utf8").toString();
	let src = GetFiles(`${WsFolderPath}/src`);
	for (let i = 0; i < src.length; i++)
	{
		// Remove files not .c or .cpp
		if (!src[i].endsWith(".c") && !src[i].endsWith(".cpp")) 
		{
			src.splice(i, 1); 
			i--;  // Account removed element
			continue;
		}
		// Remove prefix path
		src[i] = src[i].replace(WsFolderPath + "/", "");
	}
	CMakeLists = CMakeLists.replace(/%SRC%/g, src.join("\r\n"));
	fs.writeFileSync(`${WsFolderPath}/src/CmakeLists.txt`, CMakeLists);
	
	// Get all files in include folder recursively
	// Remove the prefix path
	// Remove file from path
	// Add path to set include directories
	CMakeLists = fs.readFileSync(`${__dirname}/templates/includeCMakeLists.txt`, "utf8").toString();
	/** @type {any} */
	let inc = GetFiles(`${WsFolderPath}/include`);
	for (let i = 0; i < inc.length; i++)
	{
		inc[i] = inc[i].replace(WsFolderPath + "/", "");
		inc[i] = inc[i].split("/")
		inc[i].pop();
		inc[i] = inc[i].join("/");
	}

	inc.unshift("include");
	inc = [...new Set(inc)];
	CMakeLists = CMakeLists.replace(/%INC%/g, inc.join("\r\n"));
	fs.writeFileSync(`${WsFolderPath}/include/CmakeLists.txt`, CMakeLists);
}

/**
 * @summary Gets the absolute path of the workspace i.e the root path
 * @returns {string}
 */
function GetRootPath() 
{
	try { return vscode.workspace.workspaceFolders[0].uri.fsPath; }
	catch (error) { vscode.window.showErrorMessage("No project workspace is currently open"); }
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

function CreateFile(Path, Content)
{
	fs.writeFileSync(Path, Content);
}

function CreateFolder(Path)
{
	fs.mkdir(Path, { recursive: true }, (err) =>
	{
		if (err) { return "Error";; }
	});
}

module.exports = {
	activate,
	deactivate
}