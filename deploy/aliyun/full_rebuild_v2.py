# -*- coding: utf-8 -*-
"""完整重建：上传最新源代码，构建JAR，重启Docker"""
import paramiko
import tarfile
import os
import io
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"
API_SOURCE_PATH = "../../services/api"

def load_ssh_key(key_file):
    for kc in [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]:
        try:
            return kc.from_private_key_file(key_file)
        except:
            continue
    raise Exception("无法加载密钥")

def run(client, cmd, timeout=300):
    print(f"   > {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err and "warning" not in err.lower() and "WARN" not in err:
        print(f"   STDERR: {err[:300]}")
    return out

def create_source_archive():
    """创建源代码压缩包"""
    print("[1] 创建源代码压缩包...")
    buffer = io.BytesIO()
    
    with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
        source_dir = os.path.abspath(API_SOURCE_PATH)
        for root, dirs, files in os.walk(source_dir):
            # 跳过不需要的目录
            dirs[:] = [d for d in dirs if d not in ['target', '.git', 'node_modules', '.idea']]
            for file in files:
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, source_dir)
                tar.add(file_path, arcname=arc_name)
                
    buffer.seek(0)
    size_mb = len(buffer.getvalue()) / 1024 / 1024
    print(f"   压缩包大小: {size_mb:.2f} MB")
    return buffer

def main():
    print("=" * 60)
    print("完整重建：上传源代码 + 构建JAR + 重启Docker")
    print("=" * 60)
    
    # 创建源代码压缩包
    source_archive = create_source_archive()
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"\n[2] 连接服务器 {SSH_HOST}...")
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("   连接成功!")
        
        # 上传源代码
        print("\n[3] 上传源代码压缩包...")
        sftp = client.open_sftp()
        sftp.putfo(source_archive, "/opt/evlease/api-source.tar.gz")
        sftp.close()
        print("   上传成功!")
        
        # 解压源代码
        print("\n[4] 解压源代码...")
        run(client, "rm -rf /opt/evlease/api-source")
        run(client, "mkdir -p /opt/evlease/api-source")
        run(client, "cd /opt/evlease && tar -xzf api-source.tar.gz -C api-source")
        
        # 验证关键文件
        print("\n[5] 验证源代码中的 partyAAddress...")
        out = run(client, "grep -n 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java || echo '未找到'")
        print(f"   AsignService.java: {out[:200]}")
        
        out = run(client, "grep -n 'companyAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignConfig.java || echo '未找到'")
        print(f"   AsignConfig.java: {out[:200]}")
        
        # 构建 JAR
        print("\n[6] 构建 JAR (mvn package)...")
        print("   这可能需要几分钟，请耐心等待...")
        out = run(client, "cd /opt/evlease/api-source && mvn package -DskipTests -q 2>&1 | tail -20", timeout=600)
        print(f"   构建输出: {out[:500]}")
        
        # 检查 JAR 是否生成
        print("\n[7] 检查 JAR 文件...")
        out = run(client, "ls -la /opt/evlease/api-source/target/*.jar 2>/dev/null || echo '未找到JAR'")
        print(f"   {out}")
        
        if "未找到JAR" in out:
            print("\n❌ JAR 构建失败！检查 Maven 日志...")
            out = run(client, "cd /opt/evlease/api-source && mvn package -DskipTests 2>&1 | tail -50")
            print(out)
            return
        
        # 复制 JAR 到 Docker 卷位置
        print("\n[8] 复制 JAR 到 Docker 位置...")
        run(client, "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/api.jar")
        out = run(client, "ls -la /opt/evlease/api.jar")
        print(f"   {out}")
        
        # 重启 Docker
        print("\n[9] 重启 Docker 容器...")
        run(client, "cd /opt/evlease && docker compose down")
        time.sleep(3)
        run(client, "cd /opt/evlease && docker compose up -d --force-recreate")
        
        # 等待启动
        print("\n[10] 等待 API 启动 (60秒)...")
        time.sleep(60)
        
        # 验证
        print("\n[11] 验证部署...")
        out = run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        print(f"   容器状态:\n   {out}")
        
        out = run(client, "docker exec evlease-api-1 printenv ASIGN_COMPANY_ADDRESS 2>/dev/null || echo '未设置'")
        print(f"   ASIGN_COMPANY_ADDRESS = {out}")
        
        # 健康检查
        print("\n[12] API 健康检查...")
        for i in range(6):
            out = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo 'FAILED'")
            if "UP" in out:
                print(f"   ✅ API 健康!")
                break
            print(f"   等待中... {i+1}/6")
            time.sleep(10)
        
        print("\n" + "=" * 60)
        print("完成! 请重新测试生成合同功能")
        print("=" * 60)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

