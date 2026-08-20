@echo off
title Akademia Iluzji Launcher
echo ===================================================
echo 🃏 Akademia Iluzji — Uruchamianie Systemu
echo ===================================================
echo.
echo Uruchamianie serwera Backend w osobnym oknie...
start "Akademia Iluzji - Backend (Flask:5000)" "%~dp0start_backend.bat"

timeout /t 2 /nobreak >nul

echo Uruchamianie serwera Frontend (Vite:5173)...
start "Akademia Iluzji - Frontend (Vite:5173)" "%~dp0start_frontend.bat"

echo.
echo ===================================================
echo Gotowe! Otworz przegladarke na http://localhost:5173
echo ===================================================
timeout /t 4 >nul
