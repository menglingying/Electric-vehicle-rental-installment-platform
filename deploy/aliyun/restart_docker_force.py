# -*- coding: utf-8 -*-
"""强制重启Docker，确保使用最新JAR"""
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
    err = stderr.read().decode().strip()
    if out:
        print(f"   {out[:300]}")
    return out, err

def main():
    print("=" * 70)
    print("强制重启Docker - 确保使用最新JAR")
    print("=" * 70)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!\n")
        
        # 检查当前 JAR 时间
        print("[2] 当前 JAR 文件信息...")
        run(client, "ls -la /opt/evlease/api.jar && md5sum /opt/evlease/api.jar")
        
        # 检查容器内的 JAR
        print("\n[3] 检查容器内的 JAR...")
        run(client, "docker exec evlease-api-1 ls -la /app/api.jar 2>/dev/null || echo '容器内无JAR'")
        run(client, "docker exec evlease-api-1 md5sum /app/api.jar 2>/dev/null || echo 'N/A'")
        
        # 检查 AsignConfig 是否加载了 companyAddress
        print("\n[4] 检查容器日志中的配置加载...")
        out, _ = run(client, "docker logs evlease-api-1 2>&1 | grep -i 'asign\\|company' | tail -20")
        
        # 完全停止并删除容器
        print("\n[5] 完全停止所有容器...")
        run(client, "cd /opt/evlease && docker compose down --volumes=false")
        time.sleep(3)
        
        # 确认容器已停止
        run(client, "docker ps -a | grep evlease || echo '所有evlease容器已停止'")
        
        # 重新启动
        print("\n[6] 重新启动容器...")
        run(client, "cd /opt/evlease && docker compose up -d --force-recreate")
        
        # 等待启动
        print("\n[7] 等待 API 启动 (45秒)...")
        time.sleep(45)
        
        # 验证
        print("\n[8] 验证容器状态...")
        run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        
        print("\n[9] 验证环境变量...")
        out, _ = run(client, "docker exec evlease-api-1 printenv | grep ASIGN_COMPANY_ADDRESS")
        print(f"   ASIGN_COMPANY_ADDRESS = {out}")
        
        print("\n[10] 健康检查...")
        for i in range(6):
            out, _ = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
            if "UP" in out:
                print("   ✅ API 健康!")
                break
            print(f"   等待中... {i+1}/6")
            time.sleep(10)
        
        print("\n" + "=" * 70)
        print("重启完成! 请重新测试生成合同功能")
        print("=" * 70)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

