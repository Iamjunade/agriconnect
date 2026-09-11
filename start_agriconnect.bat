@echo off
title AgriConnect Prototype Launcher (SIH26132)
echo ===================================================
echo   AgriConnect - Smart India Hackathon Prototype
echo   Govt. of Maharashtra - PS SIH26132
echo ===================================================
echo.
echo Launching Backend (FastAPI on http://127.0.0.1:8000)...
start "AgriConnect Backend" cmd /c "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo Launching Frontend (React + Vite on http://localhost:5173)...
start "AgriConnect Frontend" cmd /c "%~dp0run_frontend.bat"

timeout /t 2 /nobreak >nul

echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo ===================================================
echo Services running in background windows.
echo Press any key to exit this launcher window.
echo ===================================================
pause
