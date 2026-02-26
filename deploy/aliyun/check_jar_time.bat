@echo off
chcp 65001 >nul
cd /d "%~dp0"
python check_jar_time.py
pause

