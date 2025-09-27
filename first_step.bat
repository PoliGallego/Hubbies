@echo off
REM ==== Paso 1: Ir a la carpeta raíz del proyecto ====
cd /d "%~dp0"

echo ==================================================
echo Instalando dependencias de Node (esto puede tardar)...
echo ==================================================
npm install

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error al instalar las dependencias.
    pause
    exit /b
)

echo.
echo ✅ Instalación completada con éxito.
echo.
echo Puedes iniciar el servidor con:
echo    dev.bat   (modo desarrollo con nodemon)
echo    start.bat (modo producción)
pause