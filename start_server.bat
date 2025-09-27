@echo off
REM ---- Inicia el servidor en modo producción ----
cd /d "%~dp0"
node backend/server.js
pause