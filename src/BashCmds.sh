#!/bin/bash

function NewCppProject()
{
    cd /
    cd /Users/hariharthachapully/Desktop/C++\ Projects/
    if mkdir $1; then
        
        mkdir $1
        cd $1
        mkdir Source
        mkdir Includes
        mkdir Libs
        mkdir Build

        cd Source
        touch main.cpp

echo "#include <iostream>

int main()
{
    std::cout << \"Hello World!\" << std::endl;

    return 0;
}" >> main.cpp

        cd ../
        touch $1.code-workspace

echo "{
    \"folders\": [
        {
            \"path\": \".\"
        }
    ],
    \"settings\": {}
}" >> $1.code-workspace

        touch CMakeLists.txt

echo "cmake_minimum_required(VERSION 3.20.5)

PROJECT($1)

set(SRC_FILES
Source/main.cpp
)

add_executable(\${PROJECT_NAME} \${SRC_FILES})

target_include_directories(\${PROJECT_NAME} PRIVATE Includes)" >> CMakeLists.txt
    
        cmake -S ./ -B Build
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
    # $5 Src files
    # $6 Project name

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

}

function SetupCmake()
{
    # $1 Workspace path i.e folder root path
    # $2 Src files
    # $3 Project name
    cd /
    cd "$1"
    rm CMakeLists.txt
    touch CMakeLists.txt

echo "cmake_minimum_required(VERSION 3.20.5)

PROJECT($3)

set(SRC_FILES
$2
)

set(INC_DIRS
$4
)

add_executable(\${PROJECT_NAME} \${SRC_FILES})

target_include_directories(\${PROJECT_NAME} PRIVATE \${INC_DIRS})" >> CMakeLists.txt

}

function GetSrcFiles()
{
    cd /
    cd "$1"
    find Source -type f -name '*.cpp'
}

function GetIncDirs()
{
    cd /
    cd "$1"
    find Includes -type d
}