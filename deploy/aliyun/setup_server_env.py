#!/usr/bin/env python3
"""
在服务器上安装 Maven 环境并构建部署
"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
REMOTE_DIR = "/opt/evlease"

def main():
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=600):
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")
        return out

    print("\n" + "=" * 60)
    print("STEP 1: Check for Asign JAR files")
    print("=" * 60)
    run("find /opt -name '*asign*' -o -name '*aiqian*' 2>/dev/null | head -20")
    run("find /opt -name '*.jar' 2>/dev/null | head -20")
    run(f"ls -la {REMOTE_DIR}/build/ 2>/dev/null")

    print("\n" + "=" * 60)
    print("STEP 2: Install Maven")
    print("=" * 60)
    maven_check = run("which mvn || echo 'not found'")
    if "not found" in maven_check:
        print("\nInstalling Maven...")
        run("apt-get update -qq")
        run("apt-get install -y maven")
        run("mvn --version")
    else:
        print("Maven already installed!")

    print("\n" + "=" * 60)
    print("STEP 3: Check Java version")
    print("=" * 60)
    run("java -version 2>&1")

    print("\n" + "=" * 60)
    print("STEP 4: Extract and prepare source code")
    print("=" * 60)
    # 检查是否有源码压缩包
    run(f"ls -la {REMOTE_DIR}/build/")
    
    # 如果有 api-source.tar.gz，解压它
    run(f"cd {REMOTE_DIR}/build && tar -xzf api-source.tar.gz -C api/ 2>/dev/null || echo 'Already extracted or no archive'")
    run(f"ls -la {REMOTE_DIR}/build/api/")

    print("\n" + "=" * 60)
    print("STEP 5: Build JAR")
    print("=" * 60)
    # 查找 pom.xml
    pom_check = run(f"find {REMOTE_DIR}/build -name 'pom.xml' | head -5")
    
    if "pom.xml" in pom_check:
        # 找到第一个 pom.xml 所在目录
        pom_dir = pom_check.strip().split('\n')[0].rsplit('/', 1)[0]
        print(f"\nBuilding from: {pom_dir}")
        
        build_output = run(f"cd {pom_dir} && mvn clean package -DskipTests 2>&1 | tail -50", timeout=600)
        
        # 查找生成的 JAR
        jar_check = run(f"find {REMOTE_DIR}/build -name '*.jar' -path '*/target/*' | head -5")
        if jar_check.strip():
            print(f"\nBuild SUCCESS! JAR files found:")
            print(jar_check)
            
            # 获取第一个 JAR 路径
            jar_path = jar_check.strip().split('\n')[0]
            
            print("\n" + "=" * 60)
            print("STEP 6: Deploy new JAR")
            print("=" * 60)
            run(f"cd {REMOTE_DIR} && docker compose down || true")
            run(f"cp {jar_path} {REMOTE_DIR}/api.jar")
            run(f"cp {jar_path} {REMOTE_DIR}/artifacts/installment-api.jar")
            run(f"ls -la {REMOTE_DIR}/api.jar")
            
            print("\nStarting Docker containers...")
            run(f"cd {REMOTE_DIR} && docker compose up -d")
            
            print("\nWaiting 60 seconds for services to start...")
            time.sleep(60)
            
            run("docker ps")
            run("docker logs evlease-api-1 2>&1 | tail -30")
            run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")
        else:
            print("\nBuild may have failed - no JAR found in target/")
    else:
        print("\nNo pom.xml found! Cannot build.")
        print("Available files:")
        run(f"find {REMOTE_DIR}/build -type f | head -30")

    client.close()
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()

