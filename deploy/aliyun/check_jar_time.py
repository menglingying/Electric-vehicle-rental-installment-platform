# -*- coding: utf-8 -*-
"""Check JAR file timestamp on server"""

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
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out: print(out)
        if err: print(f"STDERR: {err}")
        return out
    
    try:
        print("=" * 60)
        print("检查服务器上后端代码的更新时间")
        print("=" * 60)
        
        # 1. 检查 JAR 文件时间戳
        print("\n[1] JAR 文件信息:")
        run("ls -la /opt/evlease/*.jar 2>/dev/null || echo 'No JAR found in /opt/evlease'")
        run("ls -la /opt/evlease/api/*.jar 2>/dev/null || echo 'No JAR found in /opt/evlease/api'")
        run("ls -la /root/*.jar 2>/dev/null || echo 'No JAR found in /root'")
        
        # 2. 检查 Java 进程
        print("\n[2] Java 进程:")
        run("ps aux | grep java | grep -v grep")
        
        # 3. 检查 Docker 状态
        print("\n[3] Docker 容器状态:")
        run("docker ps -a 2>/dev/null || echo 'Docker not running or not installed'")
        
        # 4. 检查部署目录结构
        print("\n[4] /opt/evlease 目录结构:")
        run("ls -la /opt/evlease/ 2>/dev/null || echo '/opt/evlease not found'")
        
        # 5. 检查 API 源代码目录
        print("\n[5] API 源代码目录:")
        run("ls -la /opt/evlease/services/api/target/*.jar 2>/dev/null || echo 'No JAR in target'")
        
        # 6. 检查最后修改时间
        print("\n[6] 最近修改的 JAR 文件:")
        run("find /opt/evlease -name '*.jar' -type f -exec ls -la {} \\; 2>/dev/null")
        
        # 7. 检查 AsignService.java 是否包含 forceStranger
        print("\n[7] 检查 AsignService.java 是否包含 forceStranger:")
        run("grep -n 'forceStranger' /opt/evlease/services/api/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo 'forceStranger not found in source'")
        
    finally:
        client.close()
        print("\n" + "=" * 60)
        print("检查完成")
        print("=" * 60)

if __name__ == "__main__":
    main()

