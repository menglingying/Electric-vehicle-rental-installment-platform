# -*- coding: utf-8 -*-
"""Check API status only"""

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
    client.connect(SSH_HOST, username=SSH_USER, key_filename=key_path)
    
    def run(cmd):
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        print("=" * 60)
        print("Check API Status")
        print("=" * 60)
        
        # 1. Check process
        print("\n[1] Check Java process:")
        result = run("ps aux | grep java | grep -v grep")
        
        # 2. Check port 8080
        print("\n[2] Check port 8080:")
        run("netstat -tlnp | grep 8080 || echo 'Port 8080 not listening'")
        
        # 3. Health check
        print("\n[3] Health check:")
        run("curl -s http://127.0.0.1:8080/actuator/health || echo 'Failed'")
        
        # 4. Check log tail
        print("\n[4] API log (last 30 lines):")
        run("tail -30 /opt/evlease/api.log 2>/dev/null || echo 'No log'")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
