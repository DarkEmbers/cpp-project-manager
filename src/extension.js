const vscode = require("vscode");
const fs = require("fs");
const { execSync } = require("child_process"); 

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/**@param {vscode.ExtensionContext} context*/
function activate(context)
{
	// Bind commands to functions
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.NewProject", NewProject));
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.NewClass", () => { NewClass(undefined, undefined); }));
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.RunExe", RunExe));
	context.subscriptions.push(vscode.commands.registerCommand("cpp-project-manager.Configure", Configure));

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
	const QuickPickOptions = {
		title: "Project Type",
		ignoreFocusOut: true,
		canPickMany: false,
	};

	let ProjectType = await vscode.window.showQuickPick(["App", "Library"], QuickPickOptions);
	if (ProjectType === undefined) { return; }

	const OpenDialogOptions = {
		canSelectMany: false,
		openLabel: "Select Folder",
		canSelectFiles: false,
		canSelectFolders: true
	};

	// Get the full path of new Project
	// Use folder picker
	let DirPath = "";
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => { if (fileUri) DirPath = fileUri[0].fsPath; });

	if (DirPath === undefined || DirPath === "0") { return; }

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
				return "Special characters not allowed";

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

	CreateFolder(ProjectPath);
	CreateFolder(`${ProjectPath}/build`);
	CreateFolder(`${ProjectPath}/src`);
	CreateFolder(`${ProjectPath}/include`);
	CreateFolder(`${ProjectPath}/lib`);
	CreateFolder(`${ProjectPath}/cmake`);

	// Create files
	var Workspace = fs.readFileSync(`${__dirname}/templates/project.code-workspace`, "utf8").toString();
	CreateFile(`${ProjectPath}/${ProjectName}.code-workspace`, Workspace);

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
		"add_executable(${PROJECT_NAME}\n    ${PROJECT_SOURCES}\n    ${PROJECT_HEADERS}\n)" :
		"add_library(${PROJECT_NAME} STATIC\n    ${PROJECT_SOURCES}\n    ${PROJECT_HEADERS}\n)");
	CreateFile(`${ProjectPath}/CMakeLists.txt`, CMakeLists);

	var sourcesCmake = fs.readFileSync(`${__dirname}/templates/sources.cmake`, "utf8").toString();
	let initSrc = (ProjectType == "App") ? "    src/main.cpp" : `    src/${ProjectName}.cpp`;
	let initHdr = (ProjectType == "App") ? "" : `    include/${ProjectName}.h`;
	sourcesCmake = sourcesCmake.replace(/%SRC%/g, initSrc);
	sourcesCmake = sourcesCmake.replace(/%HDR%/g, initHdr);
	CreateFile(`${ProjectPath}/cmake/sources.cmake`, sourcesCmake);

	
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
 * @param {string | undefined} Path Path of the project
 * @param {string | undefined} Name Name of the class
 */
async function NewClass(Path, Name)
{
	var Code = "";
	if (Path !== undefined && Name !== undefined)
	{
		Code = fs.readFileSync(`${__dirname}/templates/class.cpp`, "utf8");
		CreateFile(`${Path}/src/${Name}.cpp`, Code.replace(/%NAME%/g, Name).replace(/%INCPATH%/g, `${Name}.h`));
		Code = fs.readFileSync(`${__dirname}/templates/class.h`, "utf8");
		CreateFile(`${Path}/include/${Name}.h`, Code.replace(/%NAME%/g, Name));
		return;
	}

	let WsFolderPath = GetRootPath();

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
	await vscode.window.showOpenDialog(OpenDialogOptions).then(fileUri => { if (fileUri) DirPath = fileUri[0].fsPath; });

	// Return if no folder is selected
	if (DirPath === undefined || DirPath === "0") { return; }

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
				return "Special characters not allowed";

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

	let srcRoot = WsFolderPath.replace(/\\/g, "/") + "/src";
	let relDir = DirPath.replace(/\\/g, "/").replace(srcRoot, "").replace(/^\/+/, "");
	let IncPath = `${WsFolderPath}/include${relDir ? "/" + relDir : ""}`;
	let incRelPath = `${relDir ? relDir + "/" : ""}${ClassName}.h`;

	Code = fs.readFileSync(`${__dirname}/templates/class.cpp`, "utf8");
	CreateFile(`${DirPath}/${ClassName}.cpp`, Code.replace(/%NAME%/g, ClassName).replace(/%INCPATH%/g, incRelPath));
	Code = fs.readFileSync(`${__dirname}/templates/class.h`, "utf8");
	CreateFolder(IncPath);
	CreateFile(`${IncPath}/${ClassName}.h`, Code.replace(/%NAME%/g, ClassName));
	/**
	 * @type {vscode.TextDocumentShowOptions}
	 */
	let Options = {
		preview: false,
		preserveFocus: false
	}

	vscode.window.showTextDocument(vscode.Uri.file(`${IncPath}/${ClassName}.h`), Options);
	vscode.window.showTextDocument(vscode.Uri.file(`${DirPath}/${ClassName}.cpp`), Options);
	Configure();
}

async function RunExe()
{
	vscode.commands.executeCommand("cmake.launchTarget");
}

/**
 * @summary Get all files in a directory recursively
 * @param {string} dir
 * @returns {string[]} Array of file paths
 */
function GetFiles(dir)
{
	/** @type {string[]} */
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

	let src = GetFiles(`${WsFolderPath}/src`)
		.filter(f => f.endsWith(".cpp") || f.endsWith(".c"))
		.map(f => "    " + f.replace(WsFolderPath + "/", "").replace(/\\/g, "/"));

	let hdr = GetFiles(`${WsFolderPath}/include`)
		.filter(f => f.endsWith(".h") || f.endsWith(".hpp"))
		.map(f => "    " + f.replace(WsFolderPath + "/", "").replace(/\\/g, "/"));

	var sourcesCmake = fs.readFileSync(`${__dirname}/templates/sources.cmake`, "utf8").toString();
	sourcesCmake = sourcesCmake.replace(/%SRC%/g, src.join("\n"));
	sourcesCmake = sourcesCmake.replace(/%HDR%/g, hdr.join("\n"));
	fs.writeFileSync(`${WsFolderPath}/cmake/sources.cmake`, sourcesCmake);
}

/**
 * @summary Gets the absolute path of the workspace i.e the root path
 * @returns {string}
 */
function GetRootPath()
{
	try { return vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ""; }
	catch (e) { vscode.window.showErrorMessage("No project workspace is currently open"); return ""; }
}

/**
 * @param {string} Path
 * @param {string} Content
 */
function CreateFile(Path, Content)
{
	fs.writeFileSync(Path, Content);
}

/**
 * @param {string} Path
 */
function CreateFolder(Path)
{
	fs.mkdirSync(Path, { recursive: true });
}

module.exports = {
	activate,
	deactivate
}
