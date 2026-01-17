#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查服务器API日志"""

import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器...")
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    # 检查API日志中的错误
    print("\n== API最近错误日志 ==")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && docker compose logs --tail=100 api 2>&1 | grep -i -E "error|exception|fail|upload" || echo "无相关日志"')
    print(stdout.read().decode())
    
    # 检查分类数据
    print("\n== 测试分类API ==")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://127.0.0.1:8088/api/admin/categories/tree')
    print(stdout.read().decode())
    
    # 检查上传目录
    print("\n== 检查上传目录 ==")
    stdin, stdout, stderr = ssh.exec_command('ls -la /opt/evlease/uploads/ 2>/dev/null || echo "目录不存在"')
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    main()
