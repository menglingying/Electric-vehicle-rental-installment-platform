# -*- coding: utf-8 -*-
"""Reliable API restart - creates a script on server and runs it"""

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
    client.connect(SSH_HOST, username=SSH_USER, key_filename=key_path, timeout=30)
    
    def run(cmd):
        print(f">>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out, exit_code
    
    try:
        print("\n[1] Kill existing Java processes...")
        run("pkill -9 -f 'java.*installment' || true")
        time.sleep(2)
        
        print("\n[2] Create startup script on server...")
        startup_script = '''#!/bin/bash
cd /opt/evlease
# Source environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi
# Start JAR
nohup java -jar /opt/evlease/artifacts/installment-api.jar --server.port=8080 > /opt/evlease/api.log 2>&1 &
echo "API started with PID: $!"
'''
        # Write script to server
        sftp = client.open_sftp()
        with sftp.file('/opt/evlease/start_api.sh', 'w') as f:
            f.write(startup_script)
        sftp.close()
        print("Startup script created.")
        
        print("\n[3] Make script executable and run it...")
        run("chmod +x /opt/evlease/start_api.sh")
        run("cd /opt/evlease && bash start_api.sh")
        
        print("\n[4] Waiting 40 seconds for API to start...")
        time.sleep(40)
        
        print("\n[5] Check process...")
        out, _ = run("ps aux | grep 'java.*installment' | grep -v grep || echo 'No Java process'")
        if "java" in out:
            print("\n*** API process is running! ***")
        else:
            print("\n*** API process NOT running! Checking log... ***")
            run("tail -100 /opt/evlease/api.log")
            return
        
        print("\n[6] Check port...")
        run("netstat -tlnp | grep 8080 || echo 'Port 8080 not listening'")
        
        print("\n[7] Check database connection in log...")
        run("grep -i 'mysql\\|datasource\\|hikari' /opt/evlease/api.log | tail -5")
        
        print("\n[8] Health check...")
        run("curl -s http://127.0.0.1:8080/api/health || echo 'Health check failed'")
        
    finally:
        client.close()
        print("\n" + "=" * 50)
        print("Done!")
        print("=" * 50)

if __name__ == "__main__":
    main()

