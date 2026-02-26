# -*- coding: utf-8 -*-
"""Fix deployment - stop Docker, ensure only JAR runs"""

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
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        print("=" * 60)
        print("Fix Deployment")
        print("=" * 60)
        
        # 1. Check what's listening on port 8080
        print("\n[1] What's using port 8080:")
        run("netstat -tlnp | grep 8080")
        
        # 2. Stop Docker containers
        print("\n[2] Stopping Docker containers:")
        run("docker stop $(docker ps -q) 2>/dev/null || echo 'No Docker containers'")
        
        # 3. Kill any Java process
        print("\n[3] Stopping Java processes:")
        run("pkill -9 -f 'java.*installment-api' || true")
        time.sleep(2)
        
        # 4. Check port again
        print("\n[4] Port 8080 after cleanup:")
        run("netstat -tlnp | grep 8080 || echo 'Port 8080 free'")
        
        # 5. Check JAR file
        print("\n[5] Check JAR file:")
        run("ls -la /opt/evlease/artifacts/installment-api.jar")
        
        # 6. Start JAR
        print("\n[6] Starting JAR...")
        run("""cd /opt/evlease && \\
source .env 2>/dev/null || true && \\
nohup java -jar /opt/evlease/artifacts/installment-api.jar \\
  --server.port=8080 \\
  > /opt/evlease/api.log 2>&1 &
sleep 1
echo 'JAR started in background'""")
        
        # 7. Wait for startup
        print("\n[7] Waiting 30 seconds for API to start...")
        time.sleep(30)
        
        # 8. Check process
        print("\n[8] Check API process:")
        result = run("ps aux | grep 'java.*installment-api' | grep -v grep")
        if "java" in result:
            print("\n*** API process is running! ***")
        else:
            print("\n*** API process NOT running! ***")
        
        # 9. Check port
        print("\n[9] Check port 8080:")
        run("netstat -tlnp | grep 8080")
        
        # 10. Health check
        print("\n[10] Health check:")
        run("curl -s http://127.0.0.1:8080/actuator/health || echo 'Failed'")
        
        # 11. Check nginx config
        print("\n[11] Nginx upstream config:")
        run("grep -A5 'upstream.*api' /etc/nginx/nginx.conf 2>/dev/null || grep -A5 'proxy_pass' /etc/nginx/conf.d/*.conf 2>/dev/null || echo 'Not found'")
        
    finally:
        client.close()
        print("\n" + "=" * 60)
        print("Done!")
        print("=" * 60)

if __name__ == "__main__":
    main()

