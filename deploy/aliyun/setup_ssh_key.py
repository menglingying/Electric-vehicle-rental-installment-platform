#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SSH 密钥免密登录配置脚本

功能：将本地公钥上传到服务器，配置 SSH 免密登录
使用方法：python deploy/aliyun/setup_ssh_key.py

首次运行需要输入服务器密码，配置完成后就可以使用密钥免密登录了。
"""

import argparse
import subprocess
import sys
from getpass import getpass
from pathlib import Path


def ensure_paramiko():
    """确保 paramiko 库已安装"""
    try:
        import paramiko
        return paramiko
    except ImportError:
        print("正在安装 paramiko...")
        subprocess.run([sys.executable, "-m", "pip", "install", "paramiko"], check=True)
        import paramiko
        return paramiko


def setup_ssh_key(
    host: str,
    user: str,
    password: str,
    pub_key_path: Path,
    private_key_path: Path,
):
    """配置 SSH 密钥免密登录"""
    paramiko = ensure_paramiko()
    
    # 读取公钥内容
    pub_key_content = pub_key_path.read_text(encoding="utf-8").strip()
    print(f"公钥内容: {pub_key_content[:50]}...")
    
    # 连接服务器
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"正在连接服务器 {user}@{host}...")
    ssh.connect(hostname=host, username=user, password=password, timeout=15)
    
    try:
        # 创建 .ssh 目录并设置权限
        commands = [
            "mkdir -p ~/.ssh",
            "chmod 700 ~/.ssh",
            "touch ~/.ssh/authorized_keys",
            "chmod 600 ~/.ssh/authorized_keys",
        ]
        
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        
        # 检查公钥是否已存在
        stdin, stdout, stderr = ssh.exec_command("cat ~/.ssh/authorized_keys")
        existing_keys = stdout.read().decode("utf-8", errors="ignore")
        
        if pub_key_content in existing_keys:
            print("✓ 公钥已存在于服务器，无需重复添加")
        else:
            # 添加公钥
            escaped_key = pub_key_content.replace("'", "'\\''")
            cmd = f"echo '{escaped_key}' >> ~/.ssh/authorized_keys"
            stdin, stdout, stderr = ssh.exec_command(cmd)
            exit_code = stdout.channel.recv_exit_status()
            
            if exit_code == 0:
                print("✓ 公钥已成功添加到服务器")
            else:
                err = stderr.read().decode("utf-8", errors="ignore")
                raise RuntimeError(f"添加公钥失败: {err}")
        
        # 验证密钥登录
        print("\n正在验证密钥登录...")
        ssh.close()
        
        ssh2 = paramiko.SSHClient()
        ssh2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        pkey = paramiko.Ed25519Key.from_private_key_file(str(private_key_path))
        ssh2.connect(hostname=host, username=user, pkey=pkey, timeout=15)
        
        stdin, stdout, stderr = ssh2.exec_command("echo 'SSH key auth OK'")
        result = stdout.read().decode("utf-8", errors="ignore").strip()
        ssh2.close()
        
        if "OK" in result:
            print("✓ SSH 密钥免密登录配置成功！")
            print(f"\n后续部署可以使用以下命令：")
            print(f'  python deploy/aliyun/deploy.py --ssh-key-file "deploy/aliyun/evlease_deploy_key"')
            return True
        else:
            print("✗ 密钥验证失败")
            return False
            
    finally:
        ssh.close()


def main():
    parser = argparse.ArgumentParser(description="配置 SSH 密钥免密登录")
    parser.add_argument("--host", default="47.120.27.110", help="服务器地址")
    parser.add_argument("--user", default="root", help="SSH 用户名")
    parser.add_argument("--password", default="", help="SSH 密码（不提供则交互输入）")
    
    args = parser.parse_args()
    
    # 定位密钥文件
    script_dir = Path(__file__).resolve().parent
    pub_key_path = script_dir / "evlease_deploy_key.pub"
    private_key_path = script_dir / "evlease_deploy_key"
    
    if not pub_key_path.exists():
        print(f"错误: 公钥文件不存在: {pub_key_path}")
        return 1
    
    if not private_key_path.exists():
        print(f"错误: 私钥文件不存在: {private_key_path}")
        return 1
    
    print("=" * 50)
    print("SSH 密钥免密登录配置")
    print("=" * 50)
    print(f"服务器: {args.user}@{args.host}")
    print(f"公钥文件: {pub_key_path}")
    print(f"私钥文件: {private_key_path}")
    print("=" * 50)
    
    password = args.password
    if not password:
        password = getpass(f"请输入 {args.user}@{args.host} 的密码: ")
    
    try:
        setup_ssh_key(
            host=args.host,
            user=args.user,
            password=password,
            pub_key_path=pub_key_path,
            private_key_path=private_key_path,
        )
        return 0
    except Exception as e:
        print(f"错误: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

