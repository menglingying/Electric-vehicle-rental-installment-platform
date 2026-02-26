# -*- coding: utf-8 -*-
"""检查JAR文件内容，确认是否包含 partyAAddress"""
import paramiko

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

def main():
    print("=" * 70)
    print("检查 JAR 文件内容")
    print("=" * 70)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!\n")
        
        # 解压 JAR 中的 AsignService.class
        print("[2] 解压并反编译 AsignService.class...")
        
        # 创建临时目录
        run(client, "rm -rf /tmp/jar_check && mkdir -p /tmp/jar_check")
        
        # 解压 JAR
        run(client, "cd /tmp/jar_check && unzip -o /opt/evlease/api.jar 'BOOT-INF/classes/com/evlease/installment/asign/*' 2>/dev/null")
        
        # 检查文件是否存在
        print("\n[3] 检查解压的文件...")
        out = run(client, "ls -la /tmp/jar_check/BOOT-INF/classes/com/evlease/installment/asign/ 2>/dev/null || echo '未找到'")
        print(f"   {out}")
        
        # 使用 strings 查找 partyAAddress
        print("\n[4] 在 AsignService.class 中搜索 'partyAAddress'...")
        out = run(client, "strings /tmp/jar_check/BOOT-INF/classes/com/evlease/installment/asign/AsignService.class 2>/dev/null | grep -i 'partyA' || echo '未找到 partyA 相关字符串'")
        print(f"   {out}")
        
        # 搜索 companyAddress
        print("\n[5] 在 AsignConfig.class 中搜索 'companyAddress'...")
        out = run(client, "strings /tmp/jar_check/BOOT-INF/classes/com/evlease/installment/asign/AsignConfig.class 2>/dev/null | grep -i 'companyAddress' || echo '未找到'")
        print(f"   {out}")
        
        # 检查 JAR 的 MANIFEST
        print("\n[6] 检查 JAR MANIFEST (构建时间)...")
        out = run(client, "unzip -p /opt/evlease/api.jar META-INF/MANIFEST.MF 2>/dev/null | head -20")
        print(f"   {out}")
        
        # 直接检查容器运行的 JAR
        print("\n[7] 检查容器内的 JAR...")
        out = run(client, "docker exec evlease-api-1 strings /app/api.jar 2>/dev/null | grep -c 'partyAAddress' || echo '0'")
        print(f"   容器内JAR中 partyAAddress 出现次数: {out}")
        
        # 比较 MD5
        print("\n[8] 比较 JAR MD5...")
        out1 = run(client, "md5sum /opt/evlease/api.jar")
        out2 = run(client, "docker exec evlease-api-1 md5sum /app/api.jar 2>/dev/null || echo 'N/A'")
        print(f"   主机 JAR: {out1}")
        print(f"   容器 JAR: {out2}")
        
        print("\n" + "=" * 70)
        print("检查完成")
        print("=" * 70)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

