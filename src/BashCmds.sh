#!/bin/bash

function NewCppProject()
{
	cd /
	cd "$2"
	if mkdir $1; then
        
		mkdir $1
		cd $1
		mkdir Source
		mkdir Includes
		mkdir Libs
		mkdir Build
		touch Source/main.cpp

echo "#include <iostream>

int main()
{
    std::cout << \"Hello World!\" << std::endl;

    return 0;
}" >> Source/main.cpp

		touch $1.code-workspace

echo "{
    \"folders\": [
        {
            \"path\": \".\"
        }
    ],
    \"settings\": {}
}" >> $1.code-workspace

		Src_Files=$(find Source -type f -name "*.cpp")
		Inc_Dirs=$(find Includes -mindepth 1 -type d)

		touch Source/CMakeLists.txt

echo "set(SRC_FILES
${Src_Files// /\n}
PARENT_SCOPE
)" >> Source/CMakeLists.txt

		touch Includes/CMakeLists.txt

echo "set(INC_DIRS
${Inc_Dirs// /\n}
PARENT_SCOPE
)" >> Includes/CMakeLists.txt

        touch CMakeLists.txt

echo "cmake_minimum_required(VERSION 3.20.5)

PROJECT($1)

add_subdirectory(Source)
add_subdirectory(Includes)
add_executable(\${PROJECT_NAME} \${SRC_FILES})

target_include_directories(\${PROJECT_NAME} PRIVATE \${INC_DIRS})" >> CMakeLists.txt
    
        cmake -S . -B Build
        code -r $1.code-workspace

    else
        echo Failed

    fi
    
}

function NewClass()
{
    # $1 Workspace path i.e folder root path
    # $2 New class folder path
    # $3 Class name
    # $4 Directory name
    # $5 Project name

    cd /
    cd "$2"
    
    if find $3.cpp; then
        echo File exists
        return

    fi

    touch $3.cpp

    echo "#include \"$3.h\"

$3::$3()
{

}

$3::~$3()
{

}" >> $3.cpp

    cd /
    cd "$1"
    cd Includes
    mkdir "$4"
    cd "$4"
    touch $3.h

echo "#pragma once

class $3
{
public:

    $3();
    ~$3();

};" >> $3.h

    cd /
    cd "$1"
    Src_Files=$(find Source -type f -name '*.cpp')

    cd /
    cd "$1"
    Inc_Dirs=$(find Includes -type d)

    cd /
    cd "$1"
    rm Source/CMakeLists.txt
	touch Source/CMakeLists.txt

echo "set(SRC_FILES
${Src_Files// /\n}
PARENT_SCOPE
)" >> Source/CMakeLists.txt

	rm Includes/CMakeLists.txt
	touch Includes/CMakeLists.txt

echo "set(INC_DIRS
${Inc_Dirs// /\n}
PARENT_SCOPE
)" >> Includes/CMakeLists.txt

}