@echo off
echo ====================================
echo Cleaning up old virtual environment
echo ====================================

if exist venv (
    echo Removing old venv folder...
    rmdir /s /q venv
    echo Done!
) else (
    echo No venv folder found.
)

echo.
echo Now run: start-server.bat
echo.
pause
