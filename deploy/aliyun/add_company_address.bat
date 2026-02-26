@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 添加公司地址并重新部署
echo ============================================================
echo.
echo 注意: 请先修改 add_company_address.py 中的 COMPANY_ADDRESS 变量
echo 修改为实际的公司地址后再运行此脚本
echo.
pause
python add_company_address.py
echo.
pause

