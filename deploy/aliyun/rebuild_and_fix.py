# -*- coding: utf-8 -*-
"""完整修复：重新构建JAR并部署到正确位置"""
import paramiko
import tarfile
import os
import io
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

def run(client, cmd, timeout=600):
    print(f"   > {cmd[:70]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(f"   {out[:400]}")
    if err and 'warning' not in err.lower():
        print(f"   STDERR: {err[:200]}")
    return out

def create_source_archive():
    """打包本地源代码"""
    buffer = io.BytesIO()
    source_dir = os.path.abspath("../../services/api")
    
    # 先验证本地代码包含 partyAAddress
    asign_service = os.path.join(source_dir, "src/main/java/com/evlease/installment/asign/AsignService.java")
    with open(asign_service, 'r', encoding='utf-8') as f:
        content = f.read()
        if 'partyAAddress' not in content:
            print("❌ 错误：本地 AsignService.java 不包含 partyAAddress!")
            return None
        print("✅ 本地代码包含 partyAAddress")
    
    with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in ['target', '.git', 'node_modules', '.idea']]
            for file in files:
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, source_dir)
                tar.add(file_path, arcname=arc_name)
    
    buffer.seek(0)
    return buffer

def main():
    print("=" * 70)
    print("完整修复：重新构建JAR并部署")
    print("=" * 70)
    
    # 打包源代码
    print("\n[1] 打包本地源代码...")
    archive = create_source_archive()
    if archive is None:
        return
    
    size_mb = len(archive.getvalue()) / 1024 / 1024
    print(f"   压缩包大小: {size_mb:.2f} MB")
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"\n[2] 连接服务器 {SSH_HOST}...")
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("   ✅ 连接成功")
        
        # 上传源代码
        print("\n[3] 上传源代码...")
        sftp = client.open_sftp()
        sftp.putfo(archive, "/opt/evlease/api-source-new.tar.gz")
        sftp.close()
        print("   ✅ 上传完成")
        
        # 解压
        print("\n[4] 解压源代码...")
        run(client, "rm -rf /opt/evlease/api-source && mkdir -p /opt/evlease/api-source")
        run(client, "cd /opt/evlease && tar -xzf api-source-new.tar.gz -C api-source")
        
        # 验证源代码
        print("\n[5] 验证源代码中的 partyAAddress...")
        out = run(client, "grep -n 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java || echo '未找到'")
        if '未找到' in out:
            print("   ❌ 源代码上传失败!")
            return
        
        # 构建 JAR
        print("\n[6] 构建 JAR (需要 2-5 分钟)...")
        out = run(client, "cd /opt/evlease/api-source && mvn clean package -DskipTests 2>&1 | tail -30", timeout=600)
        
        # 检查构建结果
        print("\n[7] 检查构建结果...")
        out = run(client, "ls -la /opt/evlease/api-source/target/installment-api-*.jar 2>/dev/null || echo 'JAR未找到'")
        if 'JAR未找到' in out:
            print("   ❌ JAR 构建失败!")
            run(client, "cat /opt/evlease/api-source/target/surefire-reports/*.txt 2>/dev/null | tail -50")
            return
        
        # 验证新 JAR 包含 partyAAddress
        print("\n[8] 验证新 JAR 包含 partyAAddress...")
        run(client, "rm -rf /tmp/jar_verify && mkdir /tmp/jar_verify")
        run(client, "cd /tmp/jar_verify && unzip -q /opt/evlease/api-source/target/installment-api-*.jar 'BOOT-INF/classes/com/evlease/installment/asign/AsignService.class'")
        out = run(client, "strings /tmp/jar_verify/BOOT-INF/classes/com/evlease/installment/asign/AsignService.class | grep 'partyAAddress' || echo '未找到'")
        if '未找到' in out:
            print("   ❌ 新构建的 JAR 不包含 partyAAddress!")
            return
        print("   ✅ 新 JAR 包含 partyAAddress")
        
        # 复制到正确的 artifacts 目录
        print("\n[9] 复制 JAR 到 artifacts 目录...")
        run(client, "mkdir -p /opt/evlease/artifacts")
        run(client, "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/artifacts/installment-api.jar")
        run(client, "ls -la /opt/evlease/artifacts/")
        
        # 重启 Docker
        print("\n[10] 重启 Docker...")
        run(client, "cd /opt/evlease && docker compose down")
        time.sleep(3)
        run(client, "cd /opt/evlease && docker compose up -d --force-recreate")
        
        # 等待
        print("\n[11] 等待 API 启动 (60秒)...")
        time.sleep(60)
        
        # 验证
        print("\n[12] 验证部署...")
        run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        
        # 健康检查
        print("\n[13] API 健康检查...")
        for i in range(6):
            out = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
            if "UP" in str(out):
                print("\n   ✅ API 健康!")
                break
            print(f"   等待... {i+1}/6")
            time.sleep(10)
        
        print("\n" + "=" * 70)
        print("✅ 完成! 请重新测试生成合同功能")
        print("=" * 70)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

