# -*- coding: utf-8 -*-
"""Start API with correct environment variables"""

import paramiko
import os

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

def main():
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SSH_KEY_FILE)
    
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, username=SSH_USER, key_filename=key_path, timeout=30)
    
    def run(cmd):
        print(f">>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        # 1. Kill existing
        print("\n[1] Stopping existing Java processes...")
        run("pkill -9 -f 'java.*installment' || true")
        
        # 2. Check .env file
        print("\n[2] Check .env file...")
        run("cat /opt/evlease/.env | head -20")
        
        # 3. Start JAR with env vars from .env
        print("\n[3] Starting JAR with environment variables...")
        # Use export to load env vars before starting Java
        client.exec_command(
            "cd /opt/evlease && "
            "export $(grep -v '^#' .env | xargs) && "
            "nohup java -jar /opt/evlease/artifacts/installment-api.jar "
            "--server.port=8080 "
            "> /opt/evlease/api.log 2>&1 &"
        )
        print("JAR start command sent with env vars!")
        
        print("\n" + "=" * 50)
        print("JAR is starting with environment variables.")
        print("Please wait 30-60 seconds for API to fully start.")
        print("Then test: http://47.120.27.110:8089/orders")
        print("=" * 50)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

