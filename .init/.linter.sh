#!/bin/bash
cd /home/kavia/workspace/code-generation/resident-management-system-199871-199882/resident_directory_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

