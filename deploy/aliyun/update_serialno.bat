@echo off
chcp 65001 > nul
echo ========================================
echo Update ASIGN_COMPANY_SERIAL_NO
echo ========================================
echo.
cd /d %~dp0
python update_serialno.py
echo.
pause

