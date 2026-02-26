# -*- coding: utf-8 -*-
"""Simple API start script - fire and forget"""

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
        # 1. Kill everything
        print("\n[1] Stopping all Java processes...")
        run("pkill -9 -f 'java.*installment' || true")
        
        # 2. Stop Docker
        print("\n[2] Stopping Docker containers...")
        run("docker stop $(docker ps -q) 2>/dev/null || true")
        
        # 3. Check JAR exists
        print("\n[3] Check JAR file...")
        run("ls -la /opt/evlease/artifacts/installment-api.jar")
        
        # 4. Start JAR in background (don't wait)
        print("\n[4] Starting JAR in background...")
        # Use a simple command that returns immediately
        client.exec_command(
            "cd /opt/evlease && "
            "nohup java -jar /opt/evlease/artifacts/installment-api.jar "
            "--server.port=8080 "
            "> /opt/evlease/api.log 2>&1 &"
        )
        print("JAR start command sent!")
        
        print("\n" + "=" * 50)
        print("JAR is starting in background.")
        print("Please wait 30-60 seconds for API to fully start.")
        print("Then test: http://47.120.27.110:8089/orders")
        print("=" * 50)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

