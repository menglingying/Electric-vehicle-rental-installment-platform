#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载并安装 Git for Windows
"""

import urllib.request
import os
import subprocess
import sys

def main():
    print("=" * 50)
    print("Git for Windows 下载安装脚本")
    print("=" * 50)
    
    # Git 下载地址 (便携版，无需安装)
    git_portable_url = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/PortableGit-2.43.0-64-bit.7z.exe"
    git_installer_url = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    
    download_dir = r"C:\Users\daying\Downloads"
    installer_path = os.path.join(download_dir, "Git-2.43.0-64-bit.exe")
    
    # 检查是否已下载
    if os.path.exists(installer_path):
        print(f"安装包已存在: {installer_path}")
    else:
        print(f"正在下载 Git 安装包...")
        print(f"URL: {git_installer_url}")
        try:
            urllib.request.urlretrieve(git_installer_url, installer_path)
            print(f"下载完成: {installer_path}")
        except Exception as e:
            print(f"下载失败: {e}")
            return False
    
    # 静默安装 Git
    print("\n正在安装 Git (静默模式)...")
    install_cmd = [
        installer_path,
        "/VERYSILENT",
        "/NORESTART",
        "/NOCANCEL",
        "/SP-",
        "/CLOSEAPPLICATIONS",
        "/RESTARTAPPLICATIONS",
        "/COMPONENTS=icons,ext,ext\\shellhere,ext\\guihere,gitlfs,assoc,assoc_sh",
        "/DIR=C:\\Program Files\\Git"
    ]
    
    try:
        result = subprocess.run(install_cmd, capture_output=True, text=True, timeout=300)
        print(f"安装完成，退出码: {result.returncode}")
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
    except subprocess.TimeoutExpired:
        print("安装超时，请手动安装")
        return False
    except Exception as e:
        print(f"安装失败: {e}")
        return False
    
    # 验证安装
    git_path = r"C:\Program Files\Git\cmd\git.exe"
    if os.path.exists(git_path):
        print(f"\nGit 安装成功: {git_path}")
        # 测试 git 版本
        result = subprocess.run([git_path, "--version"], capture_output=True, text=True)
        print(f"Git 版本: {result.stdout.strip()}")
        return True
    else:
        print("\nGit 安装可能失败，请检查")
        return False

if __name__ == "__main__":
    main()
