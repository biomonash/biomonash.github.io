@echo off
title BiOM Website Preview

cd /d "%~dp0"

echo Syncing the latest content from Notion...
call npm start

if errorlevel 1 (
    echo.
    echo The Notion sync failed.
    echo Check that Node.js is installed and NOTION_TOKEN is configured.
    pause
    exit /b 1
)

echo.
echo Starting the local website preview...
echo Close this window when you are finished.

start "" "http://localhost:1313/"
hugo server --buildDrafts

pause