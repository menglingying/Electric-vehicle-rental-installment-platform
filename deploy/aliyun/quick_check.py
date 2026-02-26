#!/usr/bin/env python3
"""Quick check of Asign config on server without redeployment"""
import paramiko
import os

def main():
    print("Checking server configuration...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    key_path = os.path.join(os.path.dirname(__file__), 'evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', key_filename=key_path)
    
    checks = [
        ("ASIGN_BASE_URL in .env", "cd /opt/evlease && grep ASIGN_BASE_URL .env"),
        ("ASIGN_TEMPLATE_NO in .env", "cd /opt/evlease && grep ASIGN_TEMPLATE_NO .env"),
        ("Container ASIGN_BASE_URL", "docker exec evlease-api-1 printenv ASIGN_BASE_URL"),
        ("Container ASIGN_TEMPLATE_NO", "docker exec evlease-api-1 printenv ASIGN_TEMPLATE_NO"),
        ("Container SPRING_PROFILES_ACTIVE", "docker exec evlease-api-1 printenv SPRING_PROFILES_ACTIVE"),
    ]
    
    print("=" * 60)
    for name, cmd in checks:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        result = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if result:
            print(f"{name}: {result}")
        elif err:
            print(f"{name}: (error) {err}")
        else:
            print(f"{name}: (empty/not set)")
    print("=" * 60)
    
    ssh.close()

if __name__ == "__main__":
    main()

