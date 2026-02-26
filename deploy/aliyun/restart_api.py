# -*- coding: utf-8 -*-
"""Restart API and check logs"""

import paramiko
import os
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

def main():
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SSH_KEY_FILE)
    
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, username=SSH_USER, key_filename=key_path)
    
    def run(cmd):
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        print("=" * 60)
        print("Restart API Service")
        print("=" * 60)
        
        # 1. Check if JAR exists
        print("\n[1] Check JAR file:")
        run("ls -la /opt/evlease/artifacts/installment-api.jar")
        
        # 2. Check current API log
        print("\n[2] Current API log (last 30 lines):")
        run("tail -30 /opt/evlease/api.log 2>/dev/null || echo 'No log file found'")
        
        # 3. Kill any existing process
        print("\n[3] Stopping any existing API process:")
        run("pkill -9 -f 'java.*installment-api' || true")
        time.sleep(2)
        
        # 4. Clear old log
        print("\n[4] Clear old log:")
        run("rm -f /opt/evlease/api.log")
        
        # 5. Start new JAR with source command for env vars
        print("\n[5] Starting new JAR...")
        run("""
cd /opt/evlease && \\
set -a && \\
source .env && \\
set +a && \\
nohup java -jar /opt/evlease/artifacts/installment-api.jar --server.port=8080 > /opt/evlease/api.log 2>&1 &
echo "Started JAR in background"
""")
        
        # 6. Wait and check
        print("\n[6] Waiting for API to start (15 seconds)...")
        time.sleep(15)
        
        # 7. Check process
        print("\n[7] Check API process:")
        result = run("ps aux | grep 'java.*installment-api' | grep -v grep")
        
        if "java" in result:
            print("\n*** API process is running! ***")
        else:
            print("\n*** API process NOT running! ***")
        
        # 8. Check log
        print("\n[8] API startup log:")
        run("tail -50 /opt/evlease/api.log 2>/dev/null || echo 'No log yet'")
        
        # 9. Health check
        print("\n[9] Health check:")
        run("curl -s http://127.0.0.1:8080/actuator/health || echo 'Health check failed'")
        
    finally:
        client.close()
        print("\n" + "=" * 60)
        print("Done!")
        print("=" * 60)

if __name__ == "__main__":
    main()
