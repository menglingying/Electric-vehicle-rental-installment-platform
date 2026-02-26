#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查服务器状态"""

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
        # Check jar file date
        print("\n=== JAR file info ===")
        stdin, stdout, stderr = ssh.exec_command("ls -la /opt/evlease/artifacts/installment-api.jar")
        print(stdout.read().decode("utf-8", errors="ignore"))
        
        # Check container status
        print("\n=== Container status ===")
        stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && docker compose ps")
        print(stdout.read().decode("utf-8", errors="ignore"))
        
        # Check API health
        print("\n=== API health ===")
        stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:8088/api/health")
        print(stdout.read().decode("utf-8", errors="ignore"))
        
        # Check recent API logs for errors
        print("\n=== Recent API logs (last 30 lines) ===")
        stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && docker compose logs --tail=30 api 2>&1")
        print(stdout.read().decode("utf-8", errors="ignore"))
        
        print("\nDone!")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

