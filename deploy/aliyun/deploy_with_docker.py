# -*- coding: utf-8 -*-
"""Deploy with Docker Compose - proper way"""

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
        stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out, exit_code
    
    try:
        print("\n[1] Kill any standalone Java processes...")
        run("pkill -9 -f 'java.*installment' || true")
        
        print("\n[2] Stop all Docker containers...")
        run("cd /opt/evlease && docker compose down || true")
        time.sleep(3)
        
        print("\n[3] Copy latest JAR to Docker volume location...")
        run("cp /opt/evlease/artifacts/installment-api.jar /opt/evlease/api.jar")
        
        print("\n[4] Check JAR file...")
        run("ls -la /opt/evlease/api.jar")
        
        print("\n[5] Start all services with Docker Compose...")
        run("cd /opt/evlease && docker compose up -d")
        
        print("\n[6] Waiting 60 seconds for services to start...")
        time.sleep(60)
        
        print("\n[7] Check Docker containers...")
        run("docker ps")
        
        print("\n[8] Check API container logs...")
        run("docker logs evlease-api-1 2>&1 | tail -30")
        
        print("\n[9] Health check...")
        run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")
        
    finally:
        client.close()
        print("\n" + "=" * 50)
        print("Done!")
        print("=" * 50)

if __name__ == "__main__":
    main()

