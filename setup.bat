@echo off
echo ========================================
echo   Video Notes Extractor - Setup
echo ========================================
echo.

REM Create virtual environment
if not exist "venv" (
    echo [1/3] Creating virtual environment...
    python -m venv venv
) else (
    echo [1/3] Virtual environment exists, skipping...
)

REM Activate and install Python deps
call venv\Scripts\activate.bat
echo [2/3] Installing Python dependencies...
pip install -r requirements.txt

REM Install frontend deps
if not exist "frontend\node_modules" (
    echo [3/3] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo [3/3] Frontend deps exist, skipping...
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Now run: run.bat
echo.
pause
