#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载、安装 Git 并配置环境变量
"""

import urllib.request
import os
import subprocess
import sys
import winreg

def download_git():
    """下载 Git 安装包"""
    git_url = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    download_dir = r"C:\Users\daying\Downloads"
    installer_path = os.path.join(download_dir, "Git-2.43.0-64-bit.exe")
    
    if os.path.exists(installer_path) and os.path.getsize(installer_path) > 50000000:
        print(f"[OK] 安装包已存在: {installer_path}")
        return installer_path
    
    print(f"[下载] 正在下载 Git...")
    print(f"URL: {git_url}")
    
    try:
        urllib.request.urlretrieve(git_url, installer_path)
        size = os.path.getsize(installer_path)
        print(f"[OK] 下载完成: {installer_path} ({size/1024/1024:.1f} MB)")
        return installer_path
    except Exception as e:
        print(f"[错误] 下载失败: {e}")
        return None

def install_git(installer_path):
    """静默安装 Git"""
    print("\n[安装] 正在安装 Git (静默模式)...")
    
    install_cmd = [
        installer_path,
        "/VERYSILENT",
        "/NORESTART",
        "/NOCANCEL",
        "/SP-",
        "/CLOSEAPPLICATIONS",
        "/RESTARTAPPLICATIONS",
        r"/DIR=C:\Program Files\Git"
    ]
    
    try:
        result = subprocess.run(install_cmd, timeout=300)
        print(f"[OK] 安装完成，退出码: {result.returncode}")
        return True
    except subprocess.TimeoutExpired:
        print("[错误] 安装超时")
        return False
    except Exception as e:
        print(f"[错误] 安装失败: {e}")
        return False

def add_git_to_path():
    """将 Git 添加到系统 PATH"""
    git_cmd_path = r"C:\Program Files\Git\cmd"
    
    if not os.path.exists(git_cmd_path):
        print(f"[错误] Git 目录不存在: {git_cmd_path}")
        return False
    
    print(f"\n[配置] 将 Git 添加到用户 PATH...")
    
    try:
        # 读取当前用户 PATH
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment', 0, winreg.KEY_ALL_ACCESS)
        try:
            current_path, _ = winreg.QueryValueEx(key, 'Path')
        except WindowsError:
            current_path = ""
        
        # 检查是否已存在
        if git_cmd_path.lower() in current_path.lower():
            print(f"[OK] Git 已在 PATH 中")
            winreg.CloseKey(key)
            return True
        
        # 添加到 PATH
        new_path = f"{current_path};{git_cmd_path}" if current_path else git_cmd_path
        winreg.SetValueEx(key, 'Path', 0, winreg.REG_EXPAND_SZ, new_path)
        winreg.CloseKey(key)
        
        print(f"[OK] 已添加到用户 PATH: {git_cmd_path}")
        
        # 通知系统环境变量已更改
        import ctypes
        HWND_BROADCAST = 0xFFFF
        WM_SETTINGCHANGE = 0x1A
        SMTO_ABORTIFHUNG = 0x0002
        ctypes.windll.user32.SendMessageTimeoutW(
            HWND_BROADCAST, WM_SETTINGCHANGE, 0, "Environment", SMTO_ABORTIFHUNG, 5000, None
        )
        
        return True
    except Exception as e:
        print(f"[错误] 配置 PATH 失败: {e}")
        return False

def verify_git():
    """验证 Git 安装"""
    git_exe = r"C:\Program Files\Git\cmd\git.exe"
    
    if not os.path.exists(git_exe):
        print(f"[错误] Git 未找到: {git_exe}")
        return None
    
    print(f"\n[验证] Git 安装位置: {git_exe}")
    
    try:
        result = subprocess.run([git_exe, "--version"], capture_output=True, text=True)
        print(f"[OK] {result.stdout.strip()}")
        return git_exe
    except Exception as e:
        print(f"[错误] 验证失败: {e}")
        return None

def main():
    print("=" * 50)
    print("Git for Windows 安装配置脚本")
    print("=" * 50)
    
    # 1. 检查是否已安装
    git_exe = r"C:\Program Files\Git\cmd\git.exe"
    if os.path.exists(git_exe):
        print(f"\n[检测] Git 已安装: {git_exe}")
        git_exe = verify_git()
        if git_exe:
            add_git_to_path()
            print("\n" + "=" * 50)
            print(f"Git 路径: {git_exe}")
            print("=" * 50)
            return git_exe
    
    # 2. 下载
    installer = download_git()
    if not installer:
        return None
    
    # 3. 安装
    if not install_git(installer):
        return None
    
    # 4. 配置 PATH
    add_git_to_path()
    
    # 5. 验证
    git_exe = verify_git()
    
    print("\n" + "=" * 50)
    if git_exe:
        print(f"[成功] Git 安装完成!")
        print(f"Git 路径: {git_exe}")
    else:
        print("[失败] Git 安装可能失败，请手动检查")
    print("=" * 50)
    
    return git_exe

if __name__ == "__main__":
    main()
