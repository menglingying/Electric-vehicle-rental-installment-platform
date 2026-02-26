@echo off
chcp 65001 > nul
echo ========================================
echo 电动车租赁分期平台 - 完整重新构建部署
echo ========================================
echo.

cd /d "E:\电动车租赁分期平台"

echo [1/5] 清理旧构建...
if exist "services\api\target" rmdir /s /q "services\api\target"
if exist "apps\h5\dist" rmdir /s /q "apps\h5\dist"
if exist "apps\admin\dist" rmdir /s /q "apps\admin\dist"
echo 清理完成！
echo.

echo [2/5] 构建后端 API (Maven)...
cd services\api
call mvnw.cmd -DskipTests clean package
if %errorlevel% neq 0 (
    echo 后端构建失败！
    pause
    exit /b 1
)
cd ..\..
echo 后端构建完成！
echo.

echo [3/5] 构建 H5 前端...
call npm run build:h5
if %errorlevel% neq 0 (
    echo H5 构建失败！
    pause
    exit /b 1
)
echo H5 构建完成！
echo.

echo [4/5] 构建 Admin 前端...
call npm run build:admin
if %errorlevel% neq 0 (
    echo Admin 构建失败！
    pause
    exit /b 1
)
echo Admin 构建完成！
echo.

echo [5/5] 部署到服务器...
python deploy\aliyun\deploy.py --ssh-key-file "deploy\aliyun\evlease_deploy_key" --skip-build
if %errorlevel% neq 0 (
    echo 部署失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo 完整重新构建部署完成！
echo 后端、H5、Admin 全部已更新
echo ========================================
pause

