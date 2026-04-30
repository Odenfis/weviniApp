@echo off
title Wevini App Updater
echo ==========================================
echo    Updating Wevini App to Latest Version
echo ==========================================
echo.

echo [1/2] Fetching latest updates from GitHub...
git pull

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Failed to pull updates from GitHub.
    echo Please check your internet connection and git configuration.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Rebuilding and restarting containers...
docker-compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Docker failed to rebuild the containers.
    echo Please ensure Docker Desktop is running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo    Update Completed Successfully!
echo ==========================================
echo.
echo You can now access the app at http://localhost
echo.
pause
