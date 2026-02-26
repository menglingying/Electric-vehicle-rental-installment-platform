# -*- coding: utf-8 -*-
"""
全面诊断工具 - 检查服务器上所有相关配置和代码状态
"""
import paramiko
import hashlib
import os

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

def run(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

def get_local_file_hash(filepath):
    """获取本地文件的hash"""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()[:8]
    except:
        return "N/A"

def main():
    print("=" * 70)
    print("                    全面诊断报告")
    print("=" * 70)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("连接成功!\n")
        
        # ===== 1. 检查服务器源代码 =====
        print("=" * 70)
        print("[1] 源代码状态")
        print("=" * 70)
        
        # 检查 AsignService.java 中的 partyAAddress
        print("\n📄 AsignService.java - partyAAddress 相关代码:")
        out = run(client, "grep -n 'partyAAddress\\|partyAName\\|partyBAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo '❌ 文件不存在或无匹配'")
        print(f"   {out if out else '❌ 未找到'}")
        
        # 检查 AsignConfig.java 中的 companyAddress
        print("\n📄 AsignConfig.java - companyAddress 字段:")
        out = run(client, "grep -n 'companyAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignConfig.java 2>/dev/null || echo '❌ 文件不存在或无匹配'")
        print(f"   {out if out else '❌ 未找到'}")
        
        # 源代码时间戳
        print("\n📅 源代码时间戳:")
        out = run(client, "stat /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null | grep 'Modify' || echo '❌ 文件不存在'")
        print(f"   服务器 AsignService.java: {out}")
        
        local_path = "../../services/api/src/main/java/com/evlease/installment/asign/AsignService.java"
        if os.path.exists(local_path):
            local_time = os.path.getmtime(local_path)
            from datetime import datetime
            print(f"   本地 AsignService.java: Modify: {datetime.fromtimestamp(local_time)}")
        
        # ===== 2. 检查 JAR 文件 =====
        print("\n" + "=" * 70)
        print("[2] JAR 文件状态")
        print("=" * 70)
        
        out = run(client, "ls -la /opt/evlease/api.jar 2>/dev/null && stat /opt/evlease/api.jar 2>/dev/null | grep 'Modify' || echo '❌ JAR不存在'")
        print(f"   {out}")
        
        # ===== 3. 检查 docker-compose.yml =====
        print("\n" + "=" * 70)
        print("[3] docker-compose.yml 配置")
        print("=" * 70)
        
        print("\n服务器上的 env_file 配置:")
        out = run(client, "grep -A2 'env_file' /opt/evlease/docker-compose.yml 2>/dev/null || echo '❌ 无env_file配置'")
        print(f"   {out}")
        
        print("\n服务器上的 ASIGN_COMPANY_ADDRESS 映射:")
        out = run(client, "grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/docker-compose.yml 2>/dev/null || echo '❌ 无ASIGN_COMPANY_ADDRESS配置'")
        print(f"   {out}")
        
        # ===== 4. 检查 .env 文件 =====
        print("\n" + "=" * 70)
        print("[4] .env 文件内容 (ASIGN相关)")
        print("=" * 70)
        
        out = run(client, "grep 'ASIGN_' /opt/evlease/.env 2>/dev/null || echo '❌ 无ASIGN配置'")
        print(f"   {out}")
        
        # ===== 5. 检查 Docker 容器 =====
        print("\n" + "=" * 70)
        print("[5] Docker 容器状态")
        print("=" * 70)
        
        out = run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}' 2>/dev/null | head -10")
        print(f"   {out}")
        
        # ===== 6. 检查容器环境变量 =====
        print("\n" + "=" * 70)
        print("[6] 容器内环境变量 (ASIGN相关)")
        print("=" * 70)
        
        out = run(client, "docker exec evlease-api-1 printenv 2>/dev/null | grep 'ASIGN_' || echo '❌ 无ASIGN环境变量'")
        print(f"   {out}")
        
        # ===== 7. API 运行状态 =====
        print("\n" + "=" * 70)
        print("[7] API 运行状态")
        print("=" * 70)
        
        out = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo '❌ API不可访问'")
        print(f"   健康检查: {out[:100]}")
        
        # ===== 8. 最近的爱签日志 =====
        print("\n" + "=" * 70)
        print("[8] 最近的爱签API调用日志")
        print("=" * 70)
        
        out = run(client, "docker logs evlease-api-1 2>&1 | grep -i 'asign\\|100626\\|partyA' | tail -10")
        print(f"   {out if out else '无相关日志'}")
        
        # ===== 诊断结论 =====
        print("\n" + "=" * 70)
        print("                    诊断结论")
        print("=" * 70)
        
        # 检查关键问题
        issues = []
        
        # 检查源代码
        out = run(client, "grep -c 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo '0'")
        if out == '0':
            issues.append("❌ 服务器源代码中没有 partyAAddress (代码未同步)")
        else:
            print("✅ 服务器源代码包含 partyAAddress")
        
        # 检查 JAR 时间
        out = run(client, "stat -c %Y /opt/evlease/api.jar 2>/dev/null || echo '0'")
        src_time = run(client, "stat -c %Y /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo '0'")
        try:
            if int(out) < int(src_time):
                issues.append("❌ JAR 比源代码旧 (需要重新构建)")
            else:
                print("✅ JAR 时间正常")
        except:
            issues.append("❌ 无法比较 JAR 和源代码时间")
        
        # 检查环境变量
        out = run(client, "docker exec evlease-api-1 printenv ASIGN_COMPANY_ADDRESS 2>/dev/null")
        if not out:
            issues.append("❌ 容器中没有 ASIGN_COMPANY_ADDRESS 环境变量")
        else:
            print(f"✅ ASIGN_COMPANY_ADDRESS = {out}")
        
        if issues:
            print("\n⚠️  发现以下问题:")
            for issue in issues:
                print(f"   {issue}")
            print("\n建议: 运行 full_rebuild_v2.bat 进行完整重建")
        else:
            print("\n✅ 所有检查通过，问题可能在其他地方")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

