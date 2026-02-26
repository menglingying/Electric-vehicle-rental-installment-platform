# -*- coding: utf-8 -*-
"""Fix .env file and restart API with MySQL"""

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
        print("\n[1] Show current .env file...")
        run("cat /opt/evlease/.env")
        
        print("\n[2] Check MySQL container...")
        run("docker ps | grep mysql || echo 'No MySQL container'")
        
        print("\n[3] Check if MySQL is running on host...")
        run("netstat -tlnp | grep 3306 || echo 'MySQL not listening'")
        
        print("\n[4] Kill existing Java processes...")
        run("pkill -9 -f 'java.*installment' || true")
        time.sleep(2)
        
        print("\n[5] Start MySQL container if not running...")
        run("cd /opt/evlease && docker compose up -d mysql 2>/dev/null || echo 'Docker compose failed'")
        time.sleep(5)
        
        print("\n[6] Check MySQL again...")
        run("docker ps | grep mysql")
        run("netstat -tlnp | grep 3306")
        
        print("\n[7] Fix .env file - remove problematic line...")
        # Read current .env
        out, _ = run("cat /opt/evlease/.env")
        
        print("\n[8] Create new startup script with explicit MySQL config...")
        startup_script = '''#!/bin/bash
cd /opt/evlease

# Explicit database config
export SPRING_DATASOURCE_URL="jdbc:mysql://127.0.0.1:3306/evlease?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai"
export SPRING_DATASOURCE_USERNAME="evlease"
export SPRING_DATASOURCE_PASSWORD="evlease123"
export SPRING_DATASOURCE_DRIVER_CLASS_NAME="com.mysql.cj.jdbc.Driver"
export SPRING_JPA_DATABASE_PLATFORM="org.hibernate.dialect.MySQLDialect"

# Source other env vars (skip problematic lines)
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        # Skip JAVA_OPTS (problematic)
        [[ "$key" == "JAVA_OPTS" ]] && continue
        # Skip datasource (we set it above)
        [[ "$key" =~ DATASOURCE ]] && continue
        # Export valid vars
        export "$key=$value" 2>/dev/null || true
    done < .env
fi

# Start JAR
nohup java -jar /opt/evlease/artifacts/installment-api.jar --server.port=8080 > /opt/evlease/api.log 2>&1 &
echo "API started with PID: $!"
'''
        sftp = client.open_sftp()
        with sftp.file('/opt/evlease/start_api.sh', 'w') as f:
            f.write(startup_script)
        sftp.close()
        
        print("\n[9] Start API...")
        run("chmod +x /opt/evlease/start_api.sh")
        run("cd /opt/evlease && bash start_api.sh")
        
        print("\n[10] Waiting 45 seconds for API to start...")
        time.sleep(45)
        
        print("\n[11] Check process...")
        out, _ = run("ps aux | grep 'java.*installment' | grep -v grep || echo 'No Java process'")
        
        print("\n[12] Check database connection in log...")
        run("grep -i 'mysql\\|datasource\\|hikari\\|jdbc' /opt/evlease/api.log | tail -10")
        
        print("\n[13] Health check...")
        run("curl -s http://127.0.0.1:8080/api/health || echo 'Health check failed'")
        
    finally:
        client.close()
        print("\n" + "=" * 50)
        print("Done!")
        print("=" * 50)

if __name__ == "__main__":
    main()

