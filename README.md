# C++ Project manager

An extension that simplifies the proccess of creating and managing C++ projects, <br> configures them and deals with the CMake side of things for you.

## Features

### New Project
![NewProject](https://github.com/user-attachments/assets/755168bd-7d2f-43e7-8487-7c02b1f0786b)

### New Class
![NewClass](https://github.com/user-attachments/assets/491eb29a-25ed-4ad9-8a28-1598b04de311)

### Configure
Rescan all `c`/`cpp` source and header files and update `cmake/sources.cmake`. <br>
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

## 1.2.2

- Fixed bug, don't ask class name when cancelling folder selection on create class
