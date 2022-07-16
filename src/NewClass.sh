#!/bin/bash

# $1 Workspace path i.e folder root path
# $2 New class folder path
# $3 Class name
# $4 Directory name
# $5 Project name

shell_path=$(pwd)

cd /
cd "$1"
cd include
mkdir -p "$4"
touch "$4"/$3.h

echo "#pragma once

class $3
{
public:

    $3();
    ~$3();

};" >> "$4"/$3.h

code "$4"/$3.h

cd /
cd "$2"
touch $3.cpp

echo "#include \"$3.h\"

$3::$3()
{
    
}

$3::~$3()
{
    
}" >> $3.cpp

code $3.cpp

cd "$shell_path"
sh Configure.sh "$1"