@echo off
echo ===================================================
echo [1/2] Uruchamianie Backend (Flask + SQLite)...
echo ===================================================
cd /d "%~dp0backend"
if not exist "venv\Scripts\python.exe" (
    echo Tworzenie srodowiska Python venv...
    python -m venv venv
    call venv\Scripts\pip install -r requirements.txt
)
venv\Scripts\python app.py
pause
