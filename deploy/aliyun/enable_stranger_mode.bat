@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo Enable Asign Stranger Mode
echo ========================================
echo.
python enable_stranger_mode.py
echo.
pause

