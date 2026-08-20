@echo off
echo ===================================================
echo [2/2] Uruchamianie Frontend (React + Vite + Tailwind)...
echo ===================================================
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Instalowanie modulow npm...
    call npm install
)
npm run dev
pause
