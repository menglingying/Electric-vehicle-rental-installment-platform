# -*- coding: utf-8 -*-
"""Enable Asign Stranger Mode (不使用 Docker)"""

import paramiko
import os
import time

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
        # 1. Check current config
        print("\n=== Step 1: Check current ASIGN_USE_STRANGER config ===")
        run(f"cd {REMOTE_DIR} && grep 'ASIGN_USE_STRANGER' .env || echo 'Not found'")
        
        # 2. Update .env to enable stranger mode
        print("\n=== Step 2: Enable Stranger Mode ===")
        result = run(f"cd {REMOTE_DIR} && grep -c 'ASIGN_USE_STRANGER' .env || echo '0'")
        
        if '0' in result:
            run(f"cd {REMOTE_DIR} && echo 'ASIGN_USE_STRANGER=true' >> .env")
            print("Added ASIGN_USE_STRANGER=true")
        else:
            run(f"cd {REMOTE_DIR} && sed -i 's/^ASIGN_USE_STRANGER=.*/ASIGN_USE_STRANGER=true/' .env")
            print("Updated ASIGN_USE_STRANGER=true")
        
        # 3. Verify
        print("\n=== Step 3: Verify config ===")
        run(f"cd {REMOTE_DIR} && grep 'ASIGN_USE_STRANGER' .env")
        
        # 4. Stop old API process
        print("\n=== Step 4: Restarting API process ===")
        run("pkill -f 'java.*installment-api' || true")
        
        time.sleep(2)
        
        # 5. Start new API process with updated env
        start_cmd = f"""
cd {REMOTE_DIR} && \\
export $(grep -v '^#' .env | xargs) && \\
nohup java -jar /opt/evlease/artifacts/installment-api.jar --server.port=8080 > /opt/evlease/api.log 2>&1 &
"""
        run(start_cmd)
        
        print("\nWaiting for service to start...")
        time.sleep(15)
        
        # 5. Check status
        print("\n=== Step 5: Check service status ===")
        run("ps aux | grep 'java.*installment-api' | grep -v grep || echo 'Process not found'")
        
        print("\n" + "=" * 50)
        print("Stranger mode enabled!")
        print("=" * 50)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
