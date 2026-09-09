@echo off
title Marcador de Futbol - Servidor Local
color 0b
echo ======================================================
echo       INICIANDO MARCADOR DE FUTBOL PROFESIONAL
echo ======================================================
echo.
cd /d "%~dp0"

:: Abrir el navegador en la pantalla del marcador luego de 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Iniciar el servidor de Node.js
node server.js
pause
