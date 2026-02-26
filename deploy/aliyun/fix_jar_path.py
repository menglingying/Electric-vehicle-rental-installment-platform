# -*- coding: utf-8 -*-
"""修复 JAR 路径问题 - 复制到正确的 artifacts 目录"""
import paramiko
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

def load_ssh_key(key_file):
    for kc in [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]:
        try:
            return kc.from_private_key_file(key_file)
        except:
            continue
    raise Exception("无法加载密钥")

def run(client, cmd, timeout=120):
    print(f"   > {cmd[:70]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    if out:
        print(f"   {out[:500]}")
    return out

def main():
    print("=" * 70)
    print("修复 JAR 路径问题")
    print("=" * 70)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!\n")
        
        # 检查两个 JAR 文件
        print("[2] 检查 JAR 文件...")
        print("\n   主机上的 api.jar:")
        run(client, "ls -la /opt/evlease/api.jar 2>/dev/null || echo '不存在'")
        
        print("\n   artifacts 目录:")
        run(client, "ls -la /opt/evlease/artifacts/ 2>/dev/null || echo '目录不存在'")
        
        # 比较两个文件
        print("\n[3] 比较两个 JAR 文件...")
        out1 = run(client, "md5sum /opt/evlease/api.jar 2>/dev/null || echo 'N/A'")
        out2 = run(client, "md5sum /opt/evlease/artifacts/installment-api.jar 2>/dev/null || echo 'N/A'")
        
        # 检查源代码构建的 JAR
        print("\n[4] 检查源代码构建的 JAR...")
        run(client, "ls -la /opt/evlease/api-source/target/*.jar 2>/dev/null || echo '无构建JAR'")
        
        # 确保 artifacts 目录存在
        print("\n[5] 确保 artifacts 目录存在...")
        run(client, "mkdir -p /opt/evlease/artifacts")
        
        # 复制最新的 JAR 到 artifacts 目录
        print("\n[6] 复制最新 JAR 到 artifacts 目录...")
        # 首先尝试从源码构建目录复制
        run(client, "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/artifacts/installment-api.jar 2>/dev/null || cp /opt/evlease/api.jar /opt/evlease/artifacts/installment-api.jar")
        
        # 验证
        print("\n[7] 验证 artifacts 目录...")
        run(client, "ls -la /opt/evlease/artifacts/")
        
        # 检查 partyAAddress
        print("\n[8] 检查新 JAR 中的 partyAAddress...")
        run(client, "cd /tmp && rm -rf jar_test && mkdir jar_test && cd jar_test && unzip -q /opt/evlease/artifacts/installment-api.jar 'BOOT-INF/classes/com/evlease/installment/asign/AsignService.class' 2>/dev/null && strings BOOT-INF/classes/com/evlease/installment/asign/AsignService.class | grep -i 'partyA' || echo '未找到'")
        
        # 重启容器
        print("\n[9] 重启 Docker 容器...")
        run(client, "cd /opt/evlease && docker compose down")
        time.sleep(3)
        run(client, "cd /opt/evlease && docker compose up -d --force-recreate")
        
        # 等待
        print("\n[10] 等待 API 启动 (45秒)...")
        time.sleep(45)
        
        # 验证容器
        print("\n[11] 验证容器状态...")
        run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        
        # 健康检查
        print("\n[12] API 健康检查...")
        for i in range(6):
            out = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
            if "UP" in str(out):
                print("\n   ✅ API 健康!")
                break
            print(f"   等待... {i+1}/6")
            time.sleep(10)
        
        print("\n" + "=" * 70)
        print("修复完成! 请重新测试生成合同功能")
        print("=" * 70)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

