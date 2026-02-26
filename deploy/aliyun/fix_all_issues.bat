@echo off
chcp 65001 > nul
echo ========================================
echo Fix All Issues - One Time Solution
echo ========================================
echo.
echo This will:
echo   1. Upload latest docker-compose.yml
echo   2. Update JAR to latest version
echo   3. Restart Docker containers
echo   4. Verify all configurations
echo.
cd /d %~dp0
python fix_all_issues.py
echo.
pause

