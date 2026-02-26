@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 修复公司地址配置 (partyAAddress)
echo ============================================================
echo.
echo 重要: 请先确认 fix_company_address.py 中的 COMPANY_ADDRESS
echo 是否为正确的公司地址（合同模板中甲方的地址）
echo.
echo 当前默认: 四川省成都市成华区
echo.
pause
python fix_company_address.py
echo.
pause

