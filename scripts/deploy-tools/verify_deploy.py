#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""等待API启动并验证"""

import paramiko
import time

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器...")
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    print("等待API启动（约30秒）...")
    time.sleep(10)
    
    # 检查API健康状态
    print("\n== API健康检查 ==")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://127.0.0.1:8088/api/health')
    print(stdout.read().decode())
    
    # 检查分类API
    print("\n== 分类数据 ==")
    stdin, stdout, stderr = ssh.exec_command('''
cd /opt/evlease && docker compose exec -T mysql mysql -uroot -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2) evlease -e "SELECT * FROM product_category;" 2>/dev/null
''')
    result = stdout.read().decode()
    print(result if result.strip() else "分类表为空（已清理乱码数据）")
    
    ssh.close()
    print("\n验证完成!")

if __name__ == "__main__":
    main()
