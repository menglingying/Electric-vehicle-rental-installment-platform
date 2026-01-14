#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整的 Git 安装、配置和部署脚本
"""

import urllib.request
import os
import subprocess
import sys
import time

# Git 安装路径
GIT_INSTALL_DIR = r"C:\Program Files\Git"
GIT_CMD = os.path.join(GIT_INSTALL_DIR, "cmd", "git.exe")
GIT_BIN = os.path.join(GIT_INSTALL_DIR, "bin", "git.exe")

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def check_git_installed():
    """检查 Git 是否已安装"""
    if os.path.exists(GIT_CMD):
        return GIT_CMD
    if os.path.exists(GIT_BIN):
        return GIT_BIN
    return None

def download_git():
    """下载 Git 安装包"""
    url = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    dest = os.path.join(os.environ.get('TEMP', r'C:\Users\daying\Downloads'), "Git-2.43.0-64-bit.exe")
    
    if os.path.exists(dest) and os.path.getsize(dest) > 50000000:
        log(f"安装包已存在: {dest}")
        return dest
    
    log(f"正在下载 Git...")
    log(f"URL: {url}")
    
    try:
        urllib.request.urlretrieve(url, dest)
        size_mb = os.path.getsize(dest) / 1024 / 1024
        log(f"下载完成: {dest} ({size_mb:.1f} MB)")
        return dest
    except Exception as e:
        log(f"下载失败: {e}")
        return None

def install_git(installer_path):
    """静默安装 Git"""
    log("正在安装 Git (静默模式)...")
    
    cmd = [
        installer_path,
        "/VERYSILENT",
        "/NORESTART",
        "/NOCANCEL",
        "/SP-",
        "/CLOSEAPPLICATIONS",
        f"/DIR={GIT_INSTALL_DIR}"
    ]
    
    try:
        subprocess.run(cmd, timeout=300, check=False)
        log("安装命令已执行")
        
        # 等待安装完成
        for i in range(30):
            if os.path.exists(GIT_CMD):
                log(f"Git 安装成功: {GIT_CMD}")
                return True
            time.sleep(2)
        
        log("安装超时，Git 未找到")
        return False
    except Exception as e:
        log(f"安装失败: {e}")
        return False

def run_git(args, cwd=None):
    """执行 Git 命令"""
    git_exe = check_git_installed()
    if not git_exe:
        log("Git 未安装")
        return False, None
    
    cmd = [git_exe] + args
    log(f"执行: git {' '.join(args)}")
    
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            encoding='utf-8', 
            errors='replace',
            cwd=cwd
        )
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        return result.returncode == 0, result
    except Exception as e:
        log(f"执行失败: {e}")
        return False, None

def deploy_to_github():
    """部署项目到 GitHub"""
    project_dir = r"E:\电动车租赁分期平台"
    remote_url = "https://github.com/menglingying/Electric-vehicle-rental-installment-platform.git"
    
    os.chdir(project_dir)
    log(f"项目目录: {project_dir}")
    
    # 1. 初始化仓库
    log("\n=== 1. 初始化 Git 仓库 ===")
    if os.path.exists(os.path.join(project_dir, ".git")):
        log("Git 仓库已存在")
    else:
        run_git(["init"], cwd=project_dir)
    
    # 2. 配置用户
    log("\n=== 2. 配置 Git 用户 ===")
    run_git(["config", "user.name", "menglingying"], cwd=project_dir)
    run_git(["config", "user.email", "menglingying@users.noreply.github.com"], cwd=project_dir)
    
    # 3. 添加文件
    log("\n=== 3. 添加文件 ===")
    run_git(["add", "."], cwd=project_dir)
    
    # 4. 提交
    log("\n=== 4. 创建提交 ===")
    run_git(["commit", "-m", "Initial commit: 电动车租赁分期平台项目"], cwd=project_dir)
    
    # 5. 配置远程仓库
    log("\n=== 5. 配置远程仓库 ===")
    success, result = run_git(["remote", "get-url", "origin"], cwd=project_dir)
    if success:
        run_git(["remote", "set-url", "origin", remote_url], cwd=project_dir)
    else:
        run_git(["remote", "add", "origin", remote_url], cwd=project_dir)
    
    # 6. 重命名分支
    log("\n=== 6. 重命名分支为 main ===")
    run_git(["branch", "-M", "main"], cwd=project_dir)
    
    # 7. 推送
    log("\n=== 7. 推送到 GitHub ===")
    success, _ = run_git(["push", "-u", "origin", "main"], cwd=project_dir)
    
    return success

def main():
    print("=" * 60)
    print("Git 安装配置和项目部署脚本")
    print("=" * 60)
    
    # 检查 Git
    git_exe = check_git_installed()
    
    if git_exe:
        log(f"Git 已安装: {git_exe}")
        # 验证版本
        run_git(["--version"])
    else:
        log("Git 未安装，开始下载安装...")
        
        # 下载
        installer = download_git()
        if not installer:
            log("下载失败，请手动安装 Git")
            return
        
        # 安装
        if not install_git(installer):
            log("安装失败，请手动安装 Git")
            return
    
    # 部署到 GitHub
    log("\n" + "=" * 60)
    log("开始部署到 GitHub")
    log("=" * 60)
    
    success = deploy_to_github()
    
    print("\n" + "=" * 60)
    if success:
        print("部署成功！")
        print("仓库地址: https://github.com/menglingying/Electric-vehicle-rental-installment-platform")
    else:
        print("部署可能需要认证，请在弹出的窗口中登录 GitHub")
        print("或手动执行: git push -u origin main")
    print("=" * 60)

if __name__ == "__main__":
    main()
