#!/usr/bin/env python3
"""
全面诊断服务器配置
检查所有可能影响 ASIGN_COMPANY_SERIAL_NO 的地方
"""

import paramiko
import os

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

def main():
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=60):
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")
        return out

    print("\n" + "=" * 70)
    print("1. 检查 .env 文件中的 ASIGN 配置")
    print("=" * 70)
    run("cat /opt/evlease/.env | grep -i ASIGN")

    print("\n" + "=" * 70)
    print("2. 检查 docker-compose.yml 中的 ASIGN_COMPANY_SERIAL_NO 映射")
    print("=" * 70)
    run("grep -n 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/docker-compose.yml || echo 'NOT FOUND in docker-compose.yml!'")

    print("\n" + "=" * 70)
    print("3. 检查 docker-compose.yml 中的所有 ASIGN 环境变量映射")
    print("=" * 70)
    run("grep -n 'ASIGN_' /opt/evlease/docker-compose.yml")

    print("\n" + "=" * 70)
    print("4. 检查 API 容器内的所有 ASIGN 环境变量")
    print("=" * 70)
    run("docker exec evlease-api-1 env | grep -i ASIGN | sort")

    print("\n" + "=" * 70)
    print("5. 检查 JAR 包内的 application-prod.yml 配置")
    print("=" * 70)
    run("docker exec evlease-api-1 sh -c 'unzip -p /app/app.jar BOOT-INF/classes/application-prod.yml 2>/dev/null | grep -A5 company-serial-no' || echo 'Cannot read from JAR'")

    print("\n" + "=" * 70)
    print("6. 检查 Spring Boot 启动日志中的配置加载")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -i 'company-serial\\|companySerial' | head -20 || echo 'No config logs found'")

    print("\n" + "=" * 70)
    print("7. 检查 JAR 包的 AsignService.java 源代码 (forceStranger)")
    print("=" * 70)
    run("docker exec evlease-api-1 sh -c 'unzip -p /app/app.jar BOOT-INF/classes/com/evlease/installment/asign/AsignService.class 2>/dev/null | strings | grep -i stranger' || echo 'Cannot read class file'")

    print("\n" + "=" * 70)
    print("8. 检查服务器上的源代码 AsignService.java")
    print("=" * 70)
    run("grep -n 'forceStranger\\|useStranger' /opt/evlease/build/api/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo 'Source not found'")

    print("\n" + "=" * 70)
    print("9. 检查 JAR 包构建时间 vs 源代码修改时间")
    print("=" * 70)
    run("ls -la /opt/evlease/artifacts/installment-api.jar 2>/dev/null || echo 'artifacts JAR not found'")
    run("ls -la /opt/evlease/api.jar 2>/dev/null || echo 'api.jar not found'")
    run("ls -la /opt/evlease/build/api/target/*.jar 2>/dev/null || echo 'build target JAR not found'")

    print("\n" + "=" * 70)
    print("10. 检查 API 容器正在使用哪个 JAR")
    print("=" * 70)
    run("docker exec evlease-api-1 ls -la /app/app.jar")

    print("\n" + "=" * 70)
    print("11. 检查 100720 错误是来自哪个 API 调用")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -B5 -A5 '100720' | tail -30 || echo 'No 100720 error in recent logs'")

    print("\n" + "=" * 70)
    print("12. 检查最近的 API 错误日志")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -i 'error\\|exception' | tail -20")

    client.close()
    
    print("\n" + "=" * 70)
    print("诊断完成!")
    print("=" * 70)

if __name__ == "__main__":
    main()

