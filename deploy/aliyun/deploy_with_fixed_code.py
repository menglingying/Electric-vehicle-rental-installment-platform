# -*- coding: utf-8 -*-
"""部署修复并启用固定验证码"""
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
    print("部署修复并启用固定验证码 (123456)")
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
        
        # 先启用固定验证码
        print("\n[3] 启用固定验证码...")
        run(client, "grep -q 'APP_AUTH_FIXED_CODE_ENABLED' /opt/evlease/.env || echo 'APP_AUTH_FIXED_CODE_ENABLED=true' >> /opt/evlease/.env")
        run(client, "sed -i 's/APP_AUTH_FIXED_CODE_ENABLED=false/APP_AUTH_FIXED_CODE_ENABLED=true/' /opt/evlease/.env")
        out = run(client, "grep 'APP_AUTH_FIXED_CODE_ENABLED' /opt/evlease/.env")
        if 'true' in out:
            print("   ✅ 固定验证码已启用")
        
        # 检查 docker-compose.yml 是否有这个环境变量映射
        print("\n[4] 检查 docker-compose.yml 配置...")
        out = run(client, "grep 'APP_AUTH_FIXED_CODE_ENABLED' /opt/evlease/docker-compose.yml || echo '未配置'")
        if '未配置' in out:
            print("   添加环境变量映射...")
            run(client, "cd /opt/evlease && sed -i '/SMS_MOCK:/a\\      APP_AUTH_FIXED_CODE_ENABLED: \\${APP_AUTH_FIXED_CODE_ENABLED:-false}' docker-compose.yml")
        
        # 上传源代码
        print("\n[5] 上传源代码...")
        sftp = client.open_sftp()
        sftp.putfo(archive, "/opt/evlease/api-source-new.tar.gz")
        sftp.close()
        print("   ✅ 上传完成")
        
        # 解压
        print("\n[6] 解压源代码...")
        run(client, "rm -rf /opt/evlease/api-source && mkdir -p /opt/evlease/api-source")
        run(client, "cd /opt/evlease && tar -xzf api-source-new.tar.gz -C api-source")
        
        # 构建 JAR
        print("\n[7] 构建 JAR (需要 2-5 分钟)...")
        out = run(client, "cd /opt/evlease/api-source && mvn clean package -DskipTests 2>&1 | tail -10", timeout=600)
        
        # 检查构建结果
        print("\n[8] 检查构建结果...")
        out = run(client, "ls -la /opt/evlease/api-source/target/installment-api-*.jar 2>/dev/null || echo 'JAR未找到'")
        if 'JAR未找到' in out:
            print("   ❌ JAR 构建失败!")
            return
        
        # 复制到正确的 artifacts 目录
        print("\n[9] 复制 JAR 到 artifacts 目录...")
        run(client, "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/artifacts/installment-api.jar")
        
        # 重启 Docker
        print("\n[10] 重启 Docker...")
        run(client, "cd /opt/evlease && docker compose down")
        time.sleep(3)
        run(client, "cd /opt/evlease && docker compose up -d --force-recreate")
        
        # 等待
        print("\n[11] 等待 API 启动 (45秒)...")
        time.sleep(45)
        
        # 验证容器中的环境变量
        print("\n[12] 验证环境变量...")
        out = run(client, "docker exec evlease-api-1 env | grep APP_AUTH_FIXED_CODE_ENABLED || echo '未设置'")
        
        # 健康检查
        print("\n[13] API 健康检查...")
        for i in range(6):
            out = run(client, "curl -s http://localhost:8080/api/health 2>/dev/null || echo 'fail'")
            if "ok" in str(out).lower() or "UP" in str(out):
                print("\n   ✅ API 健康!")
                break
            print(f"   等待... {i+1}/6")
            time.sleep(10)
        
        print("\n" + "=" * 70)
        print("✅ 部署完成!")
        print("现在可以使用任意手机号 + 验证码 123456 登录 H5")
        print("=" * 70)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

