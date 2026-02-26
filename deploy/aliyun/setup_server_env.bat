@echo off
chcp 65001 > nul
echo ========================================
echo Setup Server Environment and Build
echo ========================================
echo This will:
echo   1. Check for Asign JAR files
echo   2. Install Maven on server
echo   3. Build the JAR
echo   4. Deploy to Docker
echo ========================================
echo.
cd /d %~dp0
python setup_server_env.py
echo.
pause

