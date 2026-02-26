@echo off
chcp 65001 > nul
echo ========================================
echo 电动车租赁分期平台 - 构建并部署
echo ========================================
echo.

cd /d "E:\电动车租赁分期平台"

echo [1/4] 构建 H5 前端...
call npm run build:h5
if %errorlevel% neq 0 (
    echo H5 构建失败！
    pause
    exit /b 1
)
echo H5 构建完成！
echo.

echo [2/4] 构建 Admin 前端...
call npm run build:admin
if %errorlevel% neq 0 (
    echo Admin 构建失败！
    pause
    exit /b 1
)
echo Admin 构建完成！
echo.

echo [3/4] 执行部署...
python deploy\aliyun\deploy.py --ssh-key-file "deploy\aliyun\evlease_deploy_key"
if %errorlevel% neq 0 (
    echo 部署失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo 构建和部署完成！
echo ========================================
pause

