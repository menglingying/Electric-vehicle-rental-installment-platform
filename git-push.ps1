# Git 初始化和推送脚本
$ErrorActionPreference = "Stop"

Write-Host "=== 初始化 Git 仓库 ===" -ForegroundColor Green

# 检查是否已经是 git 仓库
if (Test-Path ".git") {
    Write-Host "Git 仓库已存在" -ForegroundColor Yellow
} else {
    git init
    Write-Host "Git 仓库初始化完成" -ForegroundColor Green
}

# 检查 git 用户配置
$userName = git config user.name 2>$null
$userEmail = git config user.email 2>$null

if (-not $userName) {
    Write-Host "请配置 Git 用户名:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name 'Your Name'"
}

if (-not $userEmail) {
    Write-Host "请配置 Git 邮箱:" -ForegroundColor Yellow
    Write-Host "  git config --global user.email 'your@email.com'"
}

Write-Host "`n=== 添加文件到暂存区 ===" -ForegroundColor Green
git add .

Write-Host "`n=== 创建初始提交 ===" -ForegroundColor Green
git commit -m "Initial commit: 电动车租赁分期平台项目"

Write-Host "`n=== 添加远程仓库 ===" -ForegroundColor Green
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "远程仓库已存在，更新 URL..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/menglingying/Electric-vehicle-rental-installment-platform.git"
} else {
    git remote add origin "https://github.com/menglingying/Electric-vehicle-rental-installment-platform.git"
}

Write-Host "`n=== 重命名分支为 main ===" -ForegroundColor Green
git branch -M main

Write-Host "`n=== 推送到 GitHub ===" -ForegroundColor Green
git push -u origin main

Write-Host "`n=== 完成! ===" -ForegroundColor Green
Write-Host "项目已成功推送到: https://github.com/menglingying/Electric-vehicle-rental-installment-platform.git"
