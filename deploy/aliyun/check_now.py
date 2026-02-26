#!/usr/bin/env python3
import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.120.27.110', username='root', 
            key_filename=os.path.join(os.path.dirname(__file__), 'evlease_deploy_key'))

print("="*60)
print("[1] .env ASIGN config:")
stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && grep ASIGN .env')
print(stdout.read().decode())

print("[2] Container ASIGN env:")
stdin, stdout, stderr = ssh.exec_command('docker exec evlease-api-1 env 2>/dev/null | grep ASIGN | sort')
print(stdout.read().decode())

print("[3] SPRING_PROFILES_ACTIVE:")
stdin, stdout, stderr = ssh.exec_command('docker exec evlease-api-1 printenv SPRING_PROFILES_ACTIVE 2>/dev/null')
result = stdout.read().decode().strip()
print(result if result else "NOT SET")

ssh.close()
print("="*60)

