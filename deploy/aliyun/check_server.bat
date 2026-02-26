@echo off
chcp 65001 > nul
python "%~dp0check_server.py"
pause

