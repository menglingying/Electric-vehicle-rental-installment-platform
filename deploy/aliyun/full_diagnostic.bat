@echo off
chcp 65001 > nul
echo ========================================
echo Full Diagnostic Script
echo ========================================
echo.
cd /d %~dp0
python full_diagnostic.py
echo.
pause

