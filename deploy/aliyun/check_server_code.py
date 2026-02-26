# -*- coding: utf-8 -*-
"""检查服务器上的代码是否包含 partyAAddress"""
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
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

def main():
    print("=" * 60)
    print("检查服务器上的代码状态")
    print("=" * 60)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!\n")
        
        # 检查源代码中是否有 partyAAddress
        print("[2] 检查源代码 AsignService.java 中是否有 partyAAddress...")
        out, _ = run(client, "grep -n 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo '未找到'")
        print(f"   结果: {out[:500]}")
        
        # 检查源代码中是否有 getCompanyAddress
        print("\n[3] 检查源代码 AsignConfig.java 中是否有 companyAddress...")
        out, _ = run(client, "grep -n 'companyAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignConfig.java 2>/dev/null || echo '未找到'")
        print(f"   结果: {out[:500]}")
        
        # 检查 JAR 文件时间戳
        print("\n[4] 检查 JAR 文件时间戳...")
        out, _ = run(client, "ls -la /opt/evlease/api.jar 2>/dev/null && stat /opt/evlease/api.jar 2>/dev/null | grep Modify || echo 'JAR不存在'")
        print(f"   {out}")
        
        # 检查容器中的环境变量
        print("\n[5] 检查容器中的 ASIGN_COMPANY_ADDRESS 环境变量...")
        out, _ = run(client, "docker exec evlease-api-1 printenv ASIGN_COMPANY_ADDRESS 2>/dev/null || echo '未设置'")
        print(f"   ASIGN_COMPANY_ADDRESS = {out}")
        
        # 检查 API 日志中的爱签调用
        print("\n[6] 检查最近的 API 日志（爱签相关）...")
        out, _ = run(client, "docker logs evlease-api-1 2>&1 | grep -i 'asign\\|partyA' | tail -20")
        if out:
            print(f"   {out[:800]}")
        else:
            print("   无爱签相关日志")
        
        # 检查 buildFilledTemplate 方法是否正确
        print("\n[7] 检查源代码中 buildFilledTemplate 方法...")
        out, _ = run(client, "grep -A10 'def.*buildFilledTemplate\\|private.*buildFilledTemplate' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null | head -20 || echo '未找到'")
        print(f"   {out[:500]}")
        
        print("\n" + "=" * 60)
        print("如果源代码中没有 partyAAddress，需要重新上传源代码并构建")
        print("=" * 60)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

