#!/bin/bash

# $1 Workspace path i.e folder root path

cd /
cd "$1"
Src_Files=$(find src -type f \( -iname \*.cpp -o -iname \*.c \))
Inc_Dirs=$(find include -type d)

echo "set(SRC_FILES
${Src_Files// /\n}
PARENT_SCOPE
)" > src/CMakeLists.txt

echo "set(INC_DIRS
${Inc_Dirs// /\n}
PARENT_SCOPE
)" > include/CMakeLists.txt