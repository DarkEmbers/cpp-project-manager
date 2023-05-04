# C++ Project manager

An extension that simplifies the proccess of creating and managing C++ projects, <br> configures them and deals with the CMake side of things for you.

## Features

### New Project
![NewProject](https://user-images.githubusercontent.com/58950397/236218063-d64cc7c6-9c90-4101-907e-cc149edadd79.gif)

### New Class
![NewClass](https://user-images.githubusercontent.com/58950397/236235360-1f4230a4-70f5-4b8d-8f3d-f9fe4121b089.gif)

### Configure
Rescan and add "c"/"cpp" files with include directories to CMakeLists.txt. <br>
Type "C++: Configure" in the command pallette.

### Run Exe
Right click and select "C++: Run" to launch

## Requirements

- 'code' added to PATH
- vscode 1.62.0+
- Make sure to open a project workspace for the extension to work
- [CMake Tools extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools)

>Code can be added to path by opening the command pallette (Cmd + Shift + P) and typing "Shell Command: Install 'code' command to PATH"

## LICENSE

This extension follows the [MIT](https://github.com/DarkEmbers/cpp-project-manager/blob/master/LICENSE) license

## Known Issues

Please report your issues at: [C++ Project Manager Github Page](https://github.com/DarkEmbers/cpp-project-manager/issues)

## Release Notes

## 1.1.0

- Fixed Windows support and cross compatibility
- Changed Run to use CMakeTools
