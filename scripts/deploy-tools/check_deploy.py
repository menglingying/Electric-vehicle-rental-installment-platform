#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
key = paramiko.Ed25519Key.from_private_key_file(r'E:\电动车租赁分期平台\deploy\aliyun\evlease_deploy_key')
ssh.connect('47.120.27.110', username='root', pkey=key)

print("检查admin JS文件中是否有cascader-row...")
stdin, stdout, stderr = ssh.exec_command('grep -l "cascader-row" /opt/evlease/artifacts/admin/assets/*.js')
result = stdout.read().decode()
print(result if result else "未找到cascader-row")

print("\n检查JS文件修改时间...")
stdin, stdout, stderr = ssh.exec_command('ls -la /opt/evlease/artifacts/admin/assets/*.js')
print(stdout.read().decode())

ssh.close()
