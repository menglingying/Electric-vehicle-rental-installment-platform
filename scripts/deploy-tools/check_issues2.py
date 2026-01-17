#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""深入检查服务器问题"""

import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器...")
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    # 检查数据库中的分类数据
    print("\n== 检查分类数据 ==")
    stdin, stdout, stderr = ssh.exec_command('''
cd /opt/evlease && docker compose exec -T mysql mysql -uroot -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2) evlease -e "SELECT * FROM product_category;" 2>/dev/null
''')
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # 检查Docker容器内的上传目录
    print("\n== 检查API容器内上传目录 ==")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && docker compose exec -T api ls -la /app/uploads/ 2>/dev/null || echo "目录不存在或无权限"')
    print(stdout.read().decode())
    
    # 检查docker-compose配置
    print("\n== 检查docker-compose volumes ==")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && cat docker-compose.yml | grep -A5 volumes')
    print(stdout.read().decode())
    
    # 检查最近的API错误日志
    print("\n== API最近50行日志 ==")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && docker compose logs --tail=50 api 2>&1')
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    main()
