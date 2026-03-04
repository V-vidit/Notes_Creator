@echo off
echo ========================================
echo   Video Notes Extractor - Starting
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo.
echo [1/4] Starting Ollama...
start /B ollama serve > nul 2>&1
timeout /t 3 /nobreak > nul

echo [2/4] Starting Backend (http://127.0.0.1:8000)...
start "Backend" cmd /k "uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [3/4] Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo   All Started!
echo   - Backend: http://127.0.0.1:8000
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit (services keep running)...
pause > nul
