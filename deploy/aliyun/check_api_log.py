# -*- coding: utf-8 -*-
"""Check API log and process status"""

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
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        print("=" * 50)
        print("Check API Status")
        print("=" * 50)
        
        print("\n[1] Java process:")
        run("ps aux | grep java | grep -v grep || echo 'No Java process'")
        
        print("\n[2] Port 8080:")
        run("netstat -tlnp | grep 8080 || echo 'Port 8080 not listening'")
        
        print("\n[3] API log (last 50 lines):")
        run("tail -50 /opt/evlease/api.log 2>/dev/null || echo 'No log file'")
        
        print("\n[4] Health check:")
        run("curl -s http://127.0.0.1:8080/actuator/health || echo 'Health check failed'")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

