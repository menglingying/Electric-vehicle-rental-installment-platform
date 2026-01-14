#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git 部署脚本 - 将项目推送到 GitHub
自动从系统 PATH 和注册表查找 Git
"""

import subprocess
import os
import sys
import winreg

def get_system_path():
    """从注册表获取系统 PATH"""
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                            r'SYSTEM\CurrentControlSet\Control\Session Manager\Environment')
        system_path = winreg.QueryValueEx(key, 'Path')[0]
        winreg.CloseKey(key)
        return system_path
    except:
        return ""

def get_user_path():
    """从注册表获取用户 PATH"""
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment')
        user_path = winreg.QueryValueEx(key, 'Path')[0]
        winreg.CloseKey(key)
        return user_path
    except:
        return ""

def find_git():
    """查找 Git 可执行文件"""
    # 获取完整的系统 PATH
    system_path = get_system_path()
    user_path = get_user_path()
    full_path = f"{system_path};{user_path}"
    
    print(f"系统 PATH 中搜索 Git...")
    
    # 在 PATH 中搜索 git.exe
    for path_dir in full_path.split(';'):
        path_dir = path_dir.strip()
        if not path_dir:
            continue
        git_exe = os.path.join(path_dir, 'git.exe')
        if os.path.exists(git_exe):
            print(f"找到 Git: {git_exe}")
            return git_exe
    
    # 常见安装路径
    common_paths = [
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files\Git\bin\git.exe",
        r"C:\Program Files (x86)\Git\cmd\git.exe",
        r"D:\Program Files\Git\cmd\git.exe",
        r"D:\Git\cmd\git.exe",
    ]
    
    for git_path in common_paths:
        if os.path.exists(git_path):
            print(f"找到 Git: {git_path}")
            return git_path
    
    return None

def run_git(git_exe, args, check=True):
    """执行 Git 命令"""
    cmd = [git_exe] + args
    print(f"\n>>> 执行: git {' '.join(args)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    
    if check and result.returncode != 0:
        print(f"命令执行失败，退出码: {result.returncode}")
        return False, result
    return True, result

def main():
    print("=" * 50)
    print("Git 部署脚本 - 电动车租赁分期平台")
    print("=" * 50)
    
    # 查找 Git
    git_exe = find_git()
    if not git_exe:
        print("\n错误: 未找到 Git！")
        print("请确保 Git 已安装并添加到系统 PATH")
        print("下载地址: https://git-scm.com/download/win")
        sys.exit(1)
    
    # 切换到项目目录
    project_dir = r"E:\电动车租赁分期平台"
    os.chdir(project_dir)
    print(f"\n当前目录: {os.getcwd()}")
    
    remote_url = "https://github.com/menglingying/Electric-vehicle-rental-installment-platform.git"
    
    print("\n=== 1. 初始化 Git 仓库 ===")
    if os.path.exists(".git"):
        print("Git 仓库已存在")
    else:
        run_git(git_exe, ["init"])
    
    print("\n=== 2. 检查 Git 配置 ===")
    success, result = run_git(git_exe, ["config", "user.name"], check=False)
    if not result.stdout.strip():
        print("警告: 未配置 user.name，使用默认值")
        run_git(git_exe, ["config", "user.name", "menglingying"])
    
    success, result = run_git(git_exe, ["config", "user.email"], check=False)
    if not result.stdout.strip():
        print("警告: 未配置 user.email，使用默认值")
        run_git(git_exe, ["config", "user.email", "menglingying@users.noreply.github.com"])
    
    print("\n=== 3. 添加所有文件到暂存区 ===")
    run_git(git_exe, ["add", "."])
    
    print("\n=== 4. 查看状态 ===")
    run_git(git_exe, ["status"])
    
    print("\n=== 5. 创建初始提交 ===")
    run_git(git_exe, ["commit", "-m", "Initial commit: 电动车租赁分期平台项目"])
    
    print("\n=== 6. 配置远程仓库 ===")
    success, result = run_git(git_exe, ["remote", "get-url", "origin"], check=False)
    if result.returncode == 0:
        print("远程仓库已存在，更新 URL...")
        run_git(git_exe, ["remote", "set-url", "origin", remote_url])
    else:
        run_git(git_exe, ["remote", "add", "origin", remote_url])
    
    print("\n=== 7. 重命名分支为 main ===")
    run_git(git_exe, ["branch", "-M", "main"])
    
    print("\n=== 8. 推送到 GitHub ===")
    success, _ = run_git(git_exe, ["push", "-u", "origin", "main"])
    
    print("\n" + "=" * 50)
    if success:
        print("完成！项目已推送到:")
        print(remote_url)
    else:
        print("推送可能需要认证，请在弹出的窗口中登录 GitHub")
    print("=" * 50)

if __name__ == "__main__":
    main()
