#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查产品API"""

import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器...")
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    # 测试产品列表API
    print("\n== 测试产品列表API ==")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://127.0.0.1:8088/api/h5/products')
    print(stdout.read().decode())
    
    # 检查API日志
    print("\n== API最近日志 ==")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && docker compose logs --tail=30 api 2>&1 | grep -i -E "error|exception|product" || echo "无相关错误日志"')
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    main()
