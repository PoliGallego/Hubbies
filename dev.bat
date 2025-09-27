@echo off
REM ---- Inicia el servidor en modo desarrollo con nodemon ----
cd /d "%~dp0"
npm run dev
pause