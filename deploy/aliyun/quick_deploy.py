# -*- coding: utf-8 -*-
"""Quick deploy script - simplified version (不使用 Docker)"""

import paramiko
import os
import time

# Configuration
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
        # 1. Update .env with company serial number
        print("\n=== Step 1: Update .env config ===")
        company_serial_no = "CA3502026012811472681153"
        company_account = "ASIGN91510104MAG00BQP6G"
        
        # Check if ASIGN_COMPANY_SERIAL_NO exists
        result = run(f"cd {REMOTE_DIR} && grep -c 'ASIGN_COMPANY_SERIAL_NO' .env || echo '0'")
        if '0' in result:
            run(f"cd {REMOTE_DIR} && echo 'ASIGN_COMPANY_SERIAL_NO={company_serial_no}' >> .env")
            print(f"Added ASIGN_COMPANY_SERIAL_NO={company_serial_no}")
        else:
            run(f"cd {REMOTE_DIR} && sed -i 's/^ASIGN_COMPANY_SERIAL_NO=.*/ASIGN_COMPANY_SERIAL_NO={company_serial_no}/' .env")
            print(f"Updated ASIGN_COMPANY_SERIAL_NO={company_serial_no}")
        
        # Check if ASIGN_COMPANY_ACCOUNT exists
        result = run(f"cd {REMOTE_DIR} && grep -c 'ASIGN_COMPANY_ACCOUNT' .env || echo '0'")
        if '0' in result:
            run(f"cd {REMOTE_DIR} && echo 'ASIGN_COMPANY_ACCOUNT={company_account}' >> .env")
            print(f"Added ASIGN_COMPANY_ACCOUNT={company_account}")
        else:
            run(f"cd {REMOTE_DIR} && sed -i 's/^ASIGN_COMPANY_ACCOUNT=.*/ASIGN_COMPANY_ACCOUNT={company_account}/' .env")
            print(f"Updated ASIGN_COMPANY_ACCOUNT={company_account}")
        
        # Verify
        print("\nCurrent .env config:")
        run(f"cd {REMOTE_DIR} && grep -E 'ASIGN_COMPANY_(SERIAL_NO|ACCOUNT)' .env")
        
        # 2. Restart API service (直接运行 JAR，不使用 Docker)
        print("\n=== Step 2: Restart API service ===")
        run("pkill -f 'java.*installment-api' || true")
        
        time.sleep(2)
        
        start_cmd = f"""
cd {REMOTE_DIR} && \\
export $(grep -v '^#' .env | xargs) && \\
nohup java -jar /opt/evlease/artifacts/installment-api.jar --server.port=8080 > /opt/evlease/api.log 2>&1 &
"""
        run(start_cmd)
        
        # Wait for service to start
        print("\nWaiting for service to start...")
        time.sleep(15)
        
        # 3. Check service status
        print("\n=== Step 3: Check service status ===")
        run("ps aux | grep 'java.*installment-api' | grep -v grep || echo 'Process not found'")
        
        # 4. Check API health
        print("\n=== Step 4: Check API health ===")
        run("curl -s http://localhost:8080/actuator/health || echo 'Health check failed'")
        
        print("\n" + "=" * 50)
        print("Deployment completed!")
        print("=" * 50)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
