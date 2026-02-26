@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 检查并部署最新代码（添加partyAAddress支持）
echo ============================================================
echo.
echo 注意: 脚本中默认公司地址为"四川省成都市成华区"
echo 如需修改，请编辑 check_and_deploy.py 中的 COMPANY_ADDRESS
echo.
python check_and_deploy.py
echo.
pause

