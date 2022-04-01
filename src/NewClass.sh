#!/bin/bash

# $1 Workspace path i.e folder root path
# $2 New class folder path
# $3 Class name
# $4 Directory name
# $5 Project name

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

cd /
cd $1
cd include
mkdir "$4"
touch "$4"/$3.h

echo "#pragma once

class $3
{
public:

    $3();
    ~$3();

};" >> "$4"/$3.h

cd /
cd $1
Src_Files=$(find src -type f -name '*.cpp')

cd /
cd $1
Inc_Dirs=$(find include -type d)

cd /
cd $1
rm src/CMakeLists.txt
touch src/CMakeLists.txt

echo "set(SRC_FILES
${Src_Files// /\n}
PARENT_SCOPE
)" >> src/CMakeLists.txt

rm include/CMakeLists.txt
touch include/CMakeLists.txt

echo "set(INC_DIRS
${Inc_Dirs// /\n}
PARENT_SCOPE
)" >> include/CMakeLists.txt