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
	mkdir tests

# Setup workspace folder
echo "{
	\"folders\":
	[
		{
			\"path\": \".\"
		}
	],
	\"settings\": {}
}" > $1.code-workspace

# setup CMakeLists.txt file
echo "cmake_minimum_required(VERSION $(cmake --version | grep version | awk '{print $NF}'))

PROJECT($1)

add_subdirectory(src)
add_subdirectory(include)
add_library(\${PROJECT_NAME} STATIC \${SRC_FILES})

target_include_directories(\${PROJECT_NAME} PRIVATE \${INC_DIRS})" > CMakeLists.txt

echo "set(SRC_FILES
src/$1.cpp
PARENT_SCOPE
)" > src/CMakeLists.txt

echo "set(INC_DIRS
include
PARENT_SCOPE
)" > include/CMakeLists.txt

echo "#include \"$1.h\"

$1::$1()
{
    
}

$1::~$1()
{
    
}" > src/$1.cpp

echo "#pragma once

class $1
{
public:

    $1();
    ~$1();

};" > include/$1.h

	# run CMake
	cmake -S . -B build
	# Open workspace
	code -r $1.code-workspace

else
    echo Failed

fi