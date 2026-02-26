#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证服务器上 JAR 中是否包含最新代码"""

import sys
from pathlib import Path

def main():
    try:
        import paramiko
    except ImportError:
        print("Installing paramiko...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "paramiko"], check=True)
        import paramiko

    host = "47.120.27.110"
    user = "root"
    key_file = Path(__file__).parent / "evlease_deploy_key"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to {host}...")
    pkey = paramiko.Ed25519Key.from_private_key_file(str(key_file))
    ssh.connect(hostname=host, username=user, pkey=pkey, timeout=15)
    
    try:
        # Check JAR file info
        print("\n=== JAR file info ===")
        stdin, stdout, stderr = ssh.exec_command("ls -la /opt/evlease/artifacts/installment-api.jar")
        print(stdout.read().decode())
        
        # Check if our custom error message is in the AdminContractController class
        print("\n=== Checking AdminContractController for custom error message ===")
        cmd = """
cd /opt/evlease/artifacts && \
unzip -p installment-api.jar BOOT-INF/classes/com/evlease/installment/controller/admin/AdminContractController.class 2>/dev/null | \
strings | grep -E '(爱签|asignSerialNo|去实名认证)' | head -10
"""
        stdin, stdout, stderr = ssh.exec_command(cmd)
        result = stdout.read().decode()
        if result.strip():
            print("Found custom error messages in JAR:")
            print(result)
        else:
            print("WARNING: Custom error messages NOT found in JAR!")
            
        # Also check the source code on server
        print("\n=== Checking source code on server ===")
        cmd2 = "grep -n '爱签' /opt/evlease/build/api/src/main/java/com/evlease/installment/controller/admin/AdminContractController.java 2>/dev/null || echo 'Source not found'"
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        print(stdout.read().decode())
        
        # Check API container status
        print("\n=== API container status ===")
        stdin, stdout, stderr = ssh.exec_command("docker ps --filter name=api --format 'table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}'")
        print(stdout.read().decode())
        
        # Test the API directly
        print("\n=== Testing API health ===")
        stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:8088/api/health")
        print(stdout.read().decode())
        
    finally:
        ssh.close()
        print("\nDone.")

if __name__ == "__main__":
    main()

