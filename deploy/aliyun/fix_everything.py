# -*- coding: utf-8 -*-
"""
一次性修复所有问题 - 完整同步代码、配置、重建JAR、重启服务
"""
import paramiko
import tarfile
import os
import io
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

# 公司地址 - 根据合同模板需要
COMPANY_ADDRESS = "四川省成都市成华区"

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
    return out, err

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
    print("       一次性修复所有问题 - 完整部署流程")
    print("=" * 70)
    print(f"\n公司地址设置: {COMPANY_ADDRESS}")
    print("如需修改，请编辑此文件中的 COMPANY_ADDRESS 变量\n")
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # ===== 步骤 1: 连接 =====
        print("[1/10] 连接服务器...")
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("   ✅ 连接成功")
        
        # ===== 步骤 2: 打包并上传源代码 =====
        print("\n[2/10] 打包本地源代码...")
        archive = create_source_archive()
        size_mb = len(archive.getvalue()) / 1024 / 1024
        print(f"   压缩包大小: {size_mb:.2f} MB")
        
        print("\n[3/10] 上传源代码到服务器...")
        sftp = client.open_sftp()
        sftp.putfo(archive, "/opt/evlease/api-source-new.tar.gz")
        sftp.close()
        print("   ✅ 上传完成")
        
        # ===== 步骤 3: 解压源代码 =====
        print("\n[4/10] 解压源代码...")
        run(client, "rm -rf /opt/evlease/api-source")
        run(client, "mkdir -p /opt/evlease/api-source")
        out, err = run(client, "cd /opt/evlease && tar -xzf api-source-new.tar.gz -C api-source")
        
        # 验证关键代码
        out, _ = run(client, "grep -c 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo '0'")
        if out == '0':
            print("   ❌ 错误：源代码中没有 partyAAddress！")
            return
        print(f"   ✅ 源代码包含 {out} 处 partyAAddress 引用")
        
        # ===== 步骤 4: 上传最新的 docker-compose.yml =====
        print("\n[5/10] 上传最新的 docker-compose.yml...")
        local_compose = os.path.abspath("docker-compose.yml")
        sftp = client.open_sftp()
        sftp.put(local_compose, "/opt/evlease/docker-compose.yml")
        sftp.close()
        print("   ✅ docker-compose.yml 已更新")
        
        # ===== 步骤 5: 更新 .env 文件 =====
        print("\n[6/10] 更新 .env 文件...")
        
        # 检查并添加 ASIGN_COMPANY_ADDRESS
        out, _ = run(client, "grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env || echo 'NOT_FOUND'")
        if 'NOT_FOUND' in out:
            run(client, f"echo 'ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}' >> /opt/evlease/.env")
            print(f"   ✅ 添加了 ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
        else:
            # 更新现有值
            run(client, f"sed -i 's|^ASIGN_COMPANY_ADDRESS=.*|ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}|' /opt/evlease/.env")
            print(f"   ✅ 更新了 ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
        
        # 显示当前 ASIGN 配置
        out, _ = run(client, "grep 'ASIGN_' /opt/evlease/.env")
        print(f"   当前 ASIGN 配置:\n   {out.replace(chr(10), chr(10) + '   ')}")
        
        # ===== 步骤 6: 构建 JAR =====
        print("\n[7/10] 构建 JAR (这可能需要 2-5 分钟)...")
        out, err = run(client, "cd /opt/evlease/api-source && mvn package -DskipTests -q 2>&1", timeout=600)
        
        # 检查是否成功
        jar_check, _ = run(client, "ls /opt/evlease/api-source/target/installment-api-*.jar 2>/dev/null || echo 'NOT_FOUND'")
        if 'NOT_FOUND' in jar_check:
            print("   ❌ JAR 构建失败！")
            print(f"   Maven 输出: {out[:500]}")
            print(f"   错误: {err[:500]}")
            return
        print("   ✅ JAR 构建成功")
        
        # ===== 步骤 7: 复制 JAR =====
        print("\n[8/10] 复制 JAR 到部署位置...")
        run(client, "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/api.jar")
        out, _ = run(client, "ls -la /opt/evlease/api.jar")
        print(f"   {out}")
        
        # ===== 步骤 8: 重启 Docker =====
        print("\n[9/10] 重启 Docker 容器...")
        run(client, "cd /opt/evlease && docker compose down")
        time.sleep(3)
        out, err = run(client, "cd /opt/evlease && docker compose up -d --force-recreate 2>&1")
        print("   ✅ Docker 容器已重启")
        
        # ===== 步骤 9: 等待并验证 =====
        print("\n[10/10] 等待 API 启动并验证 (60秒)...")
        time.sleep(60)
        
        # 检查容器状态
        out, _ = run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}' | head -6")
        print(f"   容器状态:\n   {out.replace(chr(10), chr(10) + '   ')}")
        
        # 检查环境变量
        out, _ = run(client, "docker exec evlease-api-1 printenv ASIGN_COMPANY_ADDRESS 2>/dev/null || echo 'NOT_SET'")
        if out == 'NOT_SET':
            print("   ⚠️ 警告：ASIGN_COMPANY_ADDRESS 未传入容器")
        else:
            print(f"   ✅ ASIGN_COMPANY_ADDRESS = {out}")
        
        # 健康检查
        for i in range(6):
            out, _ = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo 'FAILED'")
            if 'UP' in out:
                print("   ✅ API 健康检查通过!")
                break
            print(f"   等待中... {i+1}/6")
            time.sleep(10)
        
        # ===== 完成 =====
        print("\n" + "=" * 70)
        print("                    ✅ 部署完成!")
        print("=" * 70)
        print("\n请重新测试生成合同功能。")
        print("如果仍有问题，请运行 diagnose_all.bat 查看详细诊断。")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

