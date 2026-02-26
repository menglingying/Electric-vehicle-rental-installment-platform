# -*- coding: utf-8 -*-
"""修复JAR挂载问题 - 确保容器使用最新的JAR"""
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
        print(f"   {out[:400]}")
    return out

def main():
    print("=" * 70)
    print("修复 JAR 挂载问题")
    print("=" * 70)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!\n")
        
        # 检查 docker-compose.yml 中的 volume 配置
        print("[2] 检查 docker-compose.yml 中的 volume 配置...")
        out = run(client, "grep -A5 'volumes:' /opt/evlease/docker-compose.yml | head -20")
        
        # 检查 JAR 文件路径
        print("\n[3] 检查主机 JAR 文件...")
        run(client, "ls -la /opt/evlease/api.jar")
        run(client, "strings /opt/evlease/api.jar | grep -c partyAAddress")
        
        # 完全停止容器
        print("\n[4] 完全停止所有容器...")
        run(client, "cd /opt/evlease && docker compose down")
        time.sleep(3)
        
        # 删除旧的 Docker volumes (如果有)
        print("\n[5] 清理可能缓存的 volumes...")
        run(client, "docker volume ls | grep evlease || echo '无 evlease volumes'")
        
        # 重新启动，强制使用最新的文件
        print("\n[6] 重新启动容器 (--force-recreate)...")
        run(client, "cd /opt/evlease && docker compose up -d --force-recreate")
        
        # 等待启动
        print("\n[7] 等待 API 启动 (60秒)...")
        time.sleep(60)
        
        # 验证容器内 JAR
        print("\n[8] 验证容器内 JAR 是否包含 partyAAddress...")
        out = run(client, "docker exec evlease-api-1 strings /app/api.jar 2>/dev/null | grep -c partyAAddress || echo '0'")
        
        if out and out.strip() != '0':
            print(f"\n   ✅ 容器内 JAR 包含 partyAAddress ({out.strip()} 处)")
        else:
            print("\n   ❌ 容器内 JAR 仍然不包含 partyAAddress")
            print("   尝试强制复制 JAR...")
            run(client, "docker cp /opt/evlease/api.jar evlease-api-1:/app/api.jar")
            print("   重启 API 容器...")
            run(client, "docker restart evlease-api-1")
            time.sleep(30)
            out = run(client, "docker exec evlease-api-1 strings /app/api.jar 2>/dev/null | grep -c partyAAddress || echo '0'")
            print(f"   重新检查: partyAAddress 出现次数 = {out}")
        
        # 比较 MD5
        print("\n[9] 比较主机和容器 JAR 的 MD5...")
        run(client, "md5sum /opt/evlease/api.jar")
        run(client, "docker exec evlease-api-1 md5sum /app/api.jar 2>/dev/null || echo 'N/A'")
        
        # 健康检查
        print("\n[10] API 健康检查...")
        for i in range(6):
            out = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
            if "UP" in str(out):
                print("   ✅ API 健康!")
                break
            time.sleep(10)
        
        print("\n" + "=" * 70)
        print("修复完成! 请重新测试生成合同功能")
        print("=" * 70)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

