#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
from getpass import getpass
from pathlib import Path


def resolve_executable(name: str) -> str:
    if os.name == "nt" and not Path(name).suffix:
        for ext in [".cmd", ".exe", ".bat"]:
            found = shutil.which(name + ext)
            if found:
                return found

    found = shutil.which(name)
    if found:
        # On Windows, npm/yarn may resolve to a .ps1 shim which cannot be executed by CreateProcess.
        if os.name == "nt" and found.lower().endswith(".ps1") and not Path(name).suffix:
            for ext in [".cmd", ".exe", ".bat"]:
                alt = shutil.which(name + ext)
                if alt:
                    return alt
        return found

    return name


def run(cmd: list[str], cwd: Path | None = None) -> None:
    cmd = [resolve_executable(cmd[0]), *cmd[1:]]
    print(f"+ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(cwd) if cwd else None, check=True)


def ensure_paramiko(auto_install: bool) -> None:
    try:
        import paramiko  # noqa: F401
        return
    except Exception:
        if not auto_install:
            raise
        print("paramiko not found; installing via pip...")
        run([sys.executable, "-m", "pip", "install", "paramiko"])


def read_secret_from_file(path: str) -> str:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Secret file not found: {p}")
    raw = p.read_text(encoding="utf-8", errors="ignore")
    for line in raw.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("#"):
            continue
        return s
    # Fallback: whole-file trimmed
    text = raw.strip()
    if not text:
        raise ValueError(f"Secret file is empty: {p}")
    return text


def build_artifacts(repo_root: Path) -> tuple[Path, Path, Path]:
    api_dir = repo_root / "services" / "api"
    h5_dir = repo_root / "apps" / "h5"
    admin_dir = repo_root / "apps" / "admin"

    java_home = os.environ.get("JAVA_HOME", "").strip()
    if java_home:
        os.environ["PATH"] = str(Path(java_home) / "bin") + os.pathsep + os.environ.get("PATH", "")

    print("Building backend jar...")
    run([str(api_dir / "mvnw.cmd"), "-DskipTests", "package"], cwd=api_dir)

    print("Building H5/Admin static assets...")
    run(["npm", "run", "build:h5"], cwd=repo_root)
    run(["npm", "run", "build:admin"], cwd=repo_root)

    jar_path = api_dir / "target" / "installment-api-0.0.1-SNAPSHOT.jar"
    h5_dist = h5_dir / "dist"
    admin_dist = admin_dir / "dist"

    if not jar_path.exists():
        raise FileNotFoundError(f"Jar not found: {jar_path}")
    if not h5_dist.exists():
        raise FileNotFoundError(f"H5 dist not found: {h5_dist}")
    if not admin_dist.exists():
        raise FileNotFoundError(f"Admin dist not found: {admin_dist}")

    return jar_path, h5_dist, admin_dist


def make_bundle(repo_root: Path, out_path: Path, jar_path: Path, h5_dist: Path, admin_dist: Path) -> Path:
    deploy_dir = repo_root / "deploy" / "aliyun"
    compose_path = deploy_dir / "docker-compose.yml"
    env_example = deploy_dir / ".env.example"
    nginx_h5 = deploy_dir / "nginx" / "h5.conf"
    nginx_admin = deploy_dir / "nginx" / "admin.conf"
    remote_bootstrap = deploy_dir / "remote" / "bootstrap-ubuntu22-docker.sh"
    remote_deploy = deploy_dir / "remote" / "deploy.sh"

    for p in [compose_path, env_example, nginx_h5, nginx_admin, remote_bootstrap, remote_deploy]:
        if not p.exists():
            raise FileNotFoundError(f"Missing deploy file: {p}")

    with tempfile.TemporaryDirectory(prefix="evlease-bundle-") as tmp:
        tmpdir = Path(tmp)
        (tmpdir / "artifacts" / "h5").mkdir(parents=True, exist_ok=True)
        (tmpdir / "artifacts" / "admin").mkdir(parents=True, exist_ok=True)
        (tmpdir / "nginx").mkdir(parents=True, exist_ok=True)
        (tmpdir / "remote").mkdir(parents=True, exist_ok=True)

        shutil.copy2(compose_path, tmpdir / "docker-compose.yml")
        shutil.copy2(env_example, tmpdir / ".env.example")
        shutil.copy2(nginx_h5, tmpdir / "nginx" / "h5.conf")
        shutil.copy2(nginx_admin, tmpdir / "nginx" / "admin.conf")
        shutil.copy2(remote_bootstrap, tmpdir / "remote" / "bootstrap-ubuntu22-docker.sh")
        shutil.copy2(remote_deploy, tmpdir / "remote" / "deploy.sh")

        shutil.copy2(jar_path, tmpdir / "artifacts" / "installment-api.jar")
        shutil.copytree(h5_dist, tmpdir / "artifacts" / "h5", dirs_exist_ok=True)
        shutil.copytree(admin_dist, tmpdir / "artifacts" / "admin", dirs_exist_ok=True)

        out_path.parent.mkdir(parents=True, exist_ok=True)
        if out_path.exists():
            out_path.unlink()

        print(f"Creating bundle: {out_path}")
        with tarfile.open(out_path, "w:gz") as tf:
            for item in tmpdir.rglob("*"):
                rel = item.relative_to(tmpdir)
                tf.add(item, arcname=str(rel))

    return out_path


def ssh_exec(ssh, cmd: str, pty: bool = False) -> tuple[int, str, str]:
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=pty)
    out = stdout.read().decode("utf-8", errors="ignore")
    err = stderr.read().decode("utf-8", errors="ignore")
    code = stdout.channel.recv_exit_status()
    return code, out, err


def parse_env(text: str) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if "=" not in s:
            continue
        k, v = s.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def format_env(env: dict[str, str]) -> str:
    preferred_order = [
        "MYSQL_ROOT_PASSWORD",
        "APP_ADMIN_USERNAME",
        "APP_ADMIN_PASSWORD",
        "JAVA_TOOL_OPTIONS",
        "APP_AUTH_FIXED_CODE_WHITELIST_PHONES",
        "APP_UPLOAD_DIR",
        "EVLEASE_MYSQL_IMAGE",
        "EVLEASE_NGINX_IMAGE",
        "EVLEASE_JRE_IMAGE",
    ]

    lines: list[str] = []
    seen: set[str] = set()
    for k in preferred_order:
        if k in env:
            lines.append(f"{k}={env[k]}")
            seen.add(k)

    for k in sorted(env.keys()):
        if k in seen:
            continue
        lines.append(f"{k}={env[k]}")

    return "\n".join(lines) + "\n"


def deploy_remote(
    bundle_tgz: Path,
    host: str,
    user: str,
    ssh_password: str,
    remote_dir: str,
    mysql_root_password: str | None,
    app_admin_username: str | None,
    app_admin_password: str | None,
    java_tool_options: str | None,
    fixed_code_whitelist_phones: str | None,
    reuse_remote_env: bool,
    auto_install_paramiko: bool,
    ssh_key_file: str | None = None,
) -> None:
    ensure_paramiko(auto_install_paramiko)
    import paramiko

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting: {user}@{host}")
    
    if ssh_key_file and Path(ssh_key_file).exists():
        print(f"Using SSH key: {ssh_key_file}")
        pkey = paramiko.Ed25519Key.from_private_key_file(ssh_key_file)
        ssh.connect(hostname=host, username=user, pkey=pkey, timeout=15)
    else:
        ssh.connect(hostname=host, username=user, password=ssh_password, timeout=15)

    try:
        code, _, err = ssh_exec(ssh, f"mkdir -p {remote_dir}")
        if code != 0:
            raise RuntimeError(f"mkdir failed: {err}")

        print("Uploading bundle.tgz ...")
        sftp = ssh.open_sftp()
        try:
            sftp.put(str(bundle_tgz), f"{remote_dir}/bundle.tgz")
        finally:
            sftp.close()

        print("Unpacking...")
        code, out, err = ssh_exec(ssh, f"cd {remote_dir} && tar -xzf bundle.tgz && chmod +x remote/*.sh")
        if code != 0:
            raise RuntimeError(f"unpack failed: {out}\n{err}")

        print("Checking port 8088/8089 availability (won't touch 5000)...")
        code, out, err = ssh_exec(
            ssh,
            "bash -lc \"ss -ltnH '( sport = :8088 or sport = :8089 )' 2>/dev/null || true\"",
        )
        if code != 0:
            raise RuntimeError(f"ss check failed: {err}")
        if out.strip():
            print("WARN: ports 8088/8089 are already listening; treating as redeploy and continuing.")

        print("Installing Docker if needed...")
        code, out, err = ssh_exec(
            ssh,
            f"bash -lc \"command -v docker >/dev/null 2>&1 || {remote_dir}/remote/bootstrap-ubuntu22-docker.sh\"",
            pty=True,
        )
        if code != 0:
            raise RuntimeError(f"docker install failed: {out}\n{err}")

        existing_env: dict[str, str] = {}
        if reuse_remote_env:
            sftp = ssh.open_sftp()
            try:
                with sftp.open(f"{remote_dir}/.env", "r") as f:
                    existing_env = parse_env(f.read().decode("utf-8", errors="ignore"))
            except Exception:
                existing_env = {}
            finally:
                sftp.close()

        env = dict(existing_env) if reuse_remote_env else {}
        if not mysql_root_password:
            mysql_root_password = env.get("MYSQL_ROOT_PASSWORD", "").strip() or None
        if not mysql_root_password:
            raise RuntimeError(
                "Missing MySQL ROOT password: provide --mysql-root-password (or set it once in remote .env)."
            )

        env["MYSQL_ROOT_PASSWORD"] = mysql_root_password
        if app_admin_username is not None:
            env["APP_ADMIN_USERNAME"] = app_admin_username
        if app_admin_password is not None:
            env["APP_ADMIN_PASSWORD"] = app_admin_password
        if java_tool_options is not None:
            env["JAVA_TOOL_OPTIONS"] = java_tool_options
        if fixed_code_whitelist_phones is not None:
            env["APP_AUTH_FIXED_CODE_WHITELIST_PHONES"] = fixed_code_whitelist_phones

        print("Writing .env ...")
        env_content = format_env(env)
        sftp = ssh.open_sftp()
        try:
            with sftp.open(f"{remote_dir}/.env", "w") as f:
                f.write(env_content)
        finally:
            sftp.close()

        print("Starting services...")
        code, out, err = ssh_exec(ssh, f"bash {remote_dir}/remote/deploy.sh {remote_dir}")
        if code != 0:
            raise RuntimeError(f"deploy failed: {out}\n{err}")

        print(out.strip())
        print(f"H5:    http://{host}:8088")
        print(f"Admin: http://{host}:8089")
    finally:
        ssh.close()


def remote_check(
    host: str,
    user: str,
    ssh_password: str,
    open_ports: bool = False,
    ssh_key_file: str | None = None,
) -> None:
    import paramiko

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting: {user}@{host}")
    
    if ssh_key_file and Path(ssh_key_file).exists():
        print(f"Using SSH key: {ssh_key_file}")
        pkey = paramiko.Ed25519Key.from_private_key_file(ssh_key_file)
        ssh.connect(hostname=host, username=user, pkey=pkey, timeout=15)
    else:
        ssh.connect(hostname=host, username=user, password=ssh_password, timeout=15)
    try:
        if open_ports:
            print("Opening UFW ports 8088/8089 if UFW is active...")
            ssh_exec(ssh, "bash -lc \"command -v ufw >/dev/null 2>&1 || exit 0; ufw status | head -n 1 | grep -qi active || exit 0; ufw allow 8088/tcp; ufw allow 8089/tcp\"")

        checks = [
            ("LISTEN_PORTS", "bash -lc \"ss -ltnH '( sport = :80 or sport = :443 or sport = :5000 or sport = :8088 or sport = :8089 )' 2>/dev/null || true\""),
            ("UFW_STATUS", "bash -lc \"command -v ufw >/dev/null 2>&1 && ufw status || echo 'ufw not installed'\""),
            ("COMPOSE_PS", "bash -lc \"cd /opt/evlease && docker compose ps\""),
            ("API_LOGS_TAIL", "bash -lc \"cd /opt/evlease && docker compose logs --tail=200 api || true\""),
            ("ENV_WHITELIST", "bash -lc \"cd /opt/evlease && (grep -E '^APP_AUTH_FIXED_CODE_WHITELIST_PHONES=' .env || true)\""),
            ("H5_LOCAL", "bash -lc \"command -v curl >/dev/null 2>&1 && curl -m 5 -s -o /dev/null -w '%{http_code}\\n' http://127.0.0.1:8088/ || echo 'no_curl'\""),
            ("ADMIN_LOCAL", "bash -lc \"command -v curl >/dev/null 2>&1 && curl -m 5 -s -o /dev/null -w '%{http_code}\\n' http://127.0.0.1:8089/ || echo 'no_curl'\""),
            ("API_HEALTH_LOCAL", "bash -lc \"command -v curl >/dev/null 2>&1 && curl -m 5 -s http://127.0.0.1:8088/api/health || echo 'no_curl'\""),
        ]
        for name, cmd in checks:
            code, out, err = ssh_exec(ssh, cmd)
            print(f"\n== {name} ==")
            if out.strip():
                print(out.strip())
            if err.strip():
                print(err.strip())
    finally:
        ssh.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy EvLease to Aliyun Ubuntu 22.04 with Docker Compose.")
    parser.add_argument("--host", default="47.120.27.110")
    parser.add_argument("--user", default="root")
    parser.add_argument("--remote-dir", default="/opt/evlease")
    parser.add_argument("--bundle-only", action="store_true")
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--check-only", action="store_true")
    parser.add_argument("--open-ports", action="store_true")
    parser.add_argument("--auto-install-paramiko", action="store_true", default=True)
    parser.add_argument("--no-reuse-remote-env", action="store_false", dest="reuse_remote_env", default=True)

    parser.add_argument("--ssh-password", default="")
    parser.add_argument("--ssh-password-file", default="")
    parser.add_argument("--ssh-key-file", default="", help="Path to SSH private key file for key-based auth")

    parser.add_argument("--mysql-root-password", default=None)
    parser.add_argument("--mysql-root-password-file", default="")

    parser.add_argument("--admin-username", default=None)
    parser.add_argument("--admin-password", default=None)
    parser.add_argument("--java-tool-options", default=None)
    parser.add_argument("--fixed-code-whitelist-phones", default=None)

    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    out_bundle = Path(__file__).resolve().parent / "bundle.tgz"

    if args.check_only:
        ssh_password = args.ssh_password
        if not ssh_password and args.ssh_password_file:
            ssh_password = read_secret_from_file(args.ssh_password_file)
        if not ssh_password and not args.ssh_key_file:
            ssh_password = getpass(f"SSH password for {args.user}@{args.host}: ")
        ensure_paramiko(args.auto_install_paramiko)
        remote_check(host=args.host, user=args.user, ssh_password=ssh_password, open_ports=args.open_ports, ssh_key_file=args.ssh_key_file)
        return 0

    if args.skip_build:
        api_jar = repo_root / "services" / "api" / "target" / "installment-api-0.0.1-SNAPSHOT.jar"
        h5_dist = repo_root / "apps" / "h5" / "dist"
        admin_dist = repo_root / "apps" / "admin" / "dist"
    else:
        api_jar, h5_dist, admin_dist = build_artifacts(repo_root)

    bundle = make_bundle(repo_root, out_bundle, api_jar, h5_dist, admin_dist)
    if args.bundle_only:
        print(f"Bundle created: {bundle}")
        return 0

    ssh_password = args.ssh_password
    if not ssh_password and args.ssh_password_file:
        ssh_password = read_secret_from_file(args.ssh_password_file)
    if not ssh_password and not args.ssh_key_file:
        ssh_password = getpass(f"SSH password for {args.user}@{args.host}: ")

    mysql_root_password = args.mysql_root_password
    if mysql_root_password is None and args.mysql_root_password_file:
        mysql_root_password = read_secret_from_file(args.mysql_root_password_file)

    deploy_remote(
        bundle_tgz=bundle,
        host=args.host,
        user=args.user,
        ssh_password=ssh_password,
        remote_dir=args.remote_dir,
        mysql_root_password=mysql_root_password,
        app_admin_username=args.admin_username,
        app_admin_password=args.admin_password,
        java_tool_options=args.java_tool_options,
        fixed_code_whitelist_phones=args.fixed_code_whitelist_phones,
        reuse_remote_env=args.reuse_remote_env,
        auto_install_paramiko=args.auto_install_paramiko,
        ssh_key_file=args.ssh_key_file,
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
