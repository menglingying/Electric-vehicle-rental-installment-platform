#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查API状态和短信配置"""

import paramiko
import time

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器...")
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    print("等待API启动完成...")
    time.sleep(5)
    
    # 检查API健康状态
    print("\n== API健康检查 ==")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://127.0.0.1:8088/api/health')
    print(stdout.read().decode())
    
    # 检查API日志中的短信配置
    print("\n== API启动日志（最后50行）==")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && docker compose logs --tail=50 api')
    print(stdout.read().decode())
    
    ssh.close()
    print("\n检查完成!")

if __name__ == "__main__":
    main()
