@echo off
REM Simple Verdena Server Runner
echo ====================================
echo Starting Verdena Backend Server
echo ====================================
echo.

REM Check if .env file exists
if exist .env (
    echo [OK] API Key loaded
) else (
    echo [WARNING] No .env file - AI summaries disabled
    echo Create a .env file with: ANTHROPIC_API_KEY=your-api-key-here
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

python app.py
