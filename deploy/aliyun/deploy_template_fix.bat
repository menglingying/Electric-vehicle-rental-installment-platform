@echo off
chcp 65001 >nul
echo ============================================================
echo 部署模板参数修复 - 添加所有必填模板参数
echo ============================================================
echo.
echo 新增参数:
echo   - usePurpose (使用目的)
echo   - leaseStartDate / leaseEndDate (租赁日期)
echo   - leaseDays (租赁天数)
echo   - productName/productSpec/productQty/productFrameNo/productAmount
echo   - rentDaily / rentPeriodDays
echo   - depositTotal/depositPayType/depositPeriods/depositPeriodDays/depositPerPeriod
echo.
cd /d "%~dp0"
python deploy_template_fix.py
pause

