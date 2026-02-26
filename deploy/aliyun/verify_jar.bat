@echo off
chcp 65001 > nul
python "%~dp0verify_jar.py"
pause

