# -*- coding: utf-8 -*-
"""Check Stranger Mode Config (不使用 Docker)"""

import paramiko
import os

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"
REMOTE_DIR = "/opt/evlease"

def main():
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SSH_KEY_FILE)
    
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, username=SSH_USER, key_filename=key_path)
    
    def run(cmd):
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        print("\n=== 1. Check .env file ===")
        run(f"cd {REMOTE_DIR} && cat .env | grep -i stranger")
        
        print("\n=== 2. Check running API process ===")
        run("ps aux | grep 'java.*installment-api' | grep -v grep || echo 'API process not found'")
        
        print("\n=== 3. Check JAR file timestamp ===")
        run(f"ls -la {REMOTE_DIR}/artifacts/installment-api.jar")
        
        print("\n=== 4. Check API logs (last 50 lines) ===")
        run(f"tail -50 {REMOTE_DIR}/api.log 2>/dev/null || echo 'Log file not found'")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
