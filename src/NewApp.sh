#!/bin/bash

cd /
cd "$2"

# If folder with same name exists return Failed
if mkdir $1; then
	
	# Make directories and files
	mkdir $1
	cd $1
	mkdir build
 	mkdir src
	mkdir include
	mkdir lib

	touch $1.code-workspace
	touch CMakeLists.txt
	touch src/CMakeLists.txt
	touch include/CMakeLists.txt
	touch src/main.cpp

# Setup workspace folder
echo "{
	\"folders\":
	[
		{
			\"path\": \".\"
		}
	],
	\"settings\": {}
}" >> $1.code-workspace

# setup CMakeLists.txt file
echo "cmake_minimum_required(VERSION $(cmake --version | grep version | awk '{print $NF}'))


PROJECT($1)

add_subdirectory(src)
add_subdirectory(include)
add_executable(\${PROJECT_NAME} \${SRC_FILES})

target_include_directories(\${PROJECT_NAME} PRIVATE \${INC_DIRS})" >> CMakeLists.txt

# List src file paths in CMakeLists.txt in src directory
echo "set(SRC_FILES
src/main.cpp
PARENT_SCOPE
)" >> src/CMakeLists.txt

# List include paths in CMakeLists.txt in include directory
echo "set(INC_DIRS
include
PARENT_SCOPE
)" >> include/CMakeLists.txt

# Create boiler-plate code in main.cpp
echo "#include <iostream>

int main()
{
    std::cout << \"Hello World!\" << std::endl;

    return 0;
}" >> src/main.cpp

	# run CMake
	cmake -S . -B build
	# Open workspace
	code -r $1.code-workspace

else
    echo Failed

fi