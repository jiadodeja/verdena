@echo off
REM Verdena Backend Server Starter for Windows
echo ====================================
echo Starting Verdena Backend Server
echo ====================================

REM Check if .env file exists and read API key
if exist .env (
    echo Loading API key from .env file...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="ANTHROPIC_API_KEY" set ANTHROPIC_API_KEY=%%b
    )
) else (
    echo WARNING: No .env file found. AI summaries will not work.
    echo Create a .env file with: ANTHROPIC_API_KEY=your-api-key-here
)

REM Check if virtual environment exists
if exist venv (
    echo Found existing virtual environment...
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    
    REM Check Python version in venv
    echo Using Python:
    python --version
    echo.
    
    REM Check if packages are installed
    python -c "import fastapi" 2>nul
    if errorlevel 1 (
        echo Installing dependencies...
        python -m pip install -r requirements.txt
    ) else (
        echo Dependencies already installed.
    )
) else (
    echo ERROR: Virtual environment not found!
    echo Please delete the venv folder and run this script again.
    pause
    exit /b 1
)

REM Display status
echo.
if defined ANTHROPIC_API_KEY (
    echo [OK] API Key loaded
) else (
    echo [WARNING] No API Key - AI summaries disabled
)

echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

REM Start the server
python app.py
