@echo off
chcp 65001 > nul
echo ================================================
echo 清空龙凡订单的 asignSerialNo 以便重新测试
echo ================================================
echo.
python "%~dp0clear_asign_v2.py"
echo.
pause

