@echo off
chcp 65001 > nul
python "%~dp0check_order.py"
pause

