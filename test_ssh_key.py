#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试SSH密钥连接"""

import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("使用SSH密钥连接服务器 47.120.27.110...")
    
    # 使用私钥连接
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    print("SSH密钥连接成功!")
    
    # 测试命令
    stdin, stdout, stderr = ssh.exec_command('echo "Hello from SSH key auth!" && hostname && uptime')
    print(stdout.read().decode())
    
    ssh.close()
    print("测试完成!")

if __name__ == "__main__":
    main()
