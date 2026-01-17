#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复服务器上分类名称乱码"""

import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("连接服务器...")
    key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', pkey=key)
    
    # 先清空分类表，让用户重新创建
    print("\n== 清空分类表（乱码数据）==")
    cmd = '''
cd /opt/evlease && docker compose exec -T mysql mysql -uroot -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2) evlease -e "
SET NAMES utf8mb4;
DELETE FROM product_category;
SELECT '分类表已清空，请在后台重新创建分类' AS result;
" 2>/dev/null
'''
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    ssh.close()
    print("完成！请在Admin后台重新创建分类。")

if __name__ == "__main__":
    main()
