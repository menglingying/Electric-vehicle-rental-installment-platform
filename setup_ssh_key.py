#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""配置SSH密钥到服务器"""

import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器 47.120.27.110...")
    ssh.connect('47.120.27.110', username='root', password='Alymima1!')
    
    pubkey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJwmu28Btv1nwT1jNcPTsX5ZdsFpRP2bT8JvYVbV8cxa evlease-deploy'
    
    # 添加公钥到authorized_keys
    cmd = f'mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "{pubkey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "SSH key added successfully!"'
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    
    if out:
        print(out)
    if err:
        print("Error:", err)
    
    ssh.close()
    print("完成!")

if __name__ == "__main__":
    main()
