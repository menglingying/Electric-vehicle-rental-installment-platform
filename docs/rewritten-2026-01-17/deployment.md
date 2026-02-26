# 部署文档（本地 + 生产）

更新日期：2026-01-17

## 1. 环境与依赖

- Node.js + npm
- Java 17 (JDK)
- Maven Wrapper（后端使用 `services/api/mvnw`）
- Docker & Docker Compose（生产部署）
- Python 3（部署脚本）

## 2. 本地开发启动

在仓库根目录执行：

```bash
npm install
```

### 2.1 启动后端（Spring Boot）

```bash
npm run dev:api
```

- 默认端口：`http://localhost:8080`
- 开发配置：`services/api/src/main/resources/application-dev.yml`
- 若 `java` 未识别，需配置 `JAVA_HOME` 并将 `%JAVA_HOME%\bin` 加入 `PATH`。

### 2.2 启动 H5

```bash
npm run dev:h5
```

- 地址：`http://localhost:5173`

### 2.3 启动 Admin

```bash
npm run dev:admin
```

- 地址：`http://localhost:5174`

### 2.4 可选：Node Mock API

```bash
npm run dev:api:node
```

- 地址：`http://localhost:8082`

## 3. 构建

```bash
npm run build:h5
npm run build:admin
```

后端 jar 由 `deploy/aliyun/deploy.py` 自动构建（默认 `-DskipTests`）。

## 4. 生产部署（Aliyun）

### 4.1 部署脚本

部署脚本：`deploy/aliyun/deploy.py`

推荐命令：

```bash
python deploy\aliyun\deploy.py --ssh-key-file "deploy\aliyun\evlease_deploy_key"
```

常用参数：

- `--host` 服务器 IP（默认 `47.120.27.110`）
- `--user` SSH 用户（默认 `root`）
- `--remote-dir` 服务器部署目录（默认 `/opt/evlease`）
- `--bundle-only` 只打包不部署
- `--skip-build` 使用已有构建产物
- `--check-only` 远程检查
- `--open-ports` 开放 8088/8089（UFW 活跃时）

### 4.2 产物与目录结构

部署包包含：

- `artifacts/installment-api.jar`
- `artifacts/h5/`（H5 dist）
- `artifacts/admin/`（Admin dist）
- `docker-compose.yml`
- `nginx/*.conf`
- `remote/*.sh`

### 4.3 环境变量（.env）

示例文件：`deploy/aliyun/.env.example`

关键变量：

- `MYSQL_ROOT_PASSWORD`（必填）
- `APP_ADMIN_USERNAME` / `APP_ADMIN_PASSWORD`
- `APP_AUTH_FIXED_CODE_WHITELIST_PHONES`（白名单手机号）
- `APP_UPLOAD_DIR`（默认 `/app/uploads`）
- `JAVA_TOOL_OPTIONS`（JVM 内存参数）

### 4.4 Docker Compose 服务

- `mysql`：MySQL 8.0
- `api`：Spring Boot JAR
- `h5`：Nginx（静态资源 + /api 反代）
- `admin`：Nginx（静态资源 + /api 反代）

端口：

- H5：`http://<server-ip>:8088`
- Admin：`http://<server-ip>:8089`

### 4.5 上传与静态访问

- 上传目录：`/opt/evlease/data/uploads`（挂载到容器 `/app/uploads`）
- 访问路径：`/uploads/**`

## 5. 生产环境校验

- 健康检查：`GET http://<server-ip>:8088/api/health`
- 查看容器：`docker compose ps`
- 日志：`docker compose logs --tail=200 api`

可选运维脚本：`scripts/deploy-tools/`

- `check_api.py`
- `verify_deploy.py`
- `check_deploy.py`

## 6. 常见问题

### 6.1 MySQL 密码未配置

部署报错提示：缺少 `MYSQL_ROOT_PASSWORD`。请在 `.env` 配置后重试部署。

### 6.2 端口被占用

`8088`/`8089` 端口被占用会导致 Nginx 启动失败。请释放端口或调整映射。

### 6.3 Docker 未安装

部署脚本会自动运行 `remote/bootstrap-ubuntu22-docker.sh` 安装 Docker。

### 6.4 Token 丢失

后端 Token 保存在内存，容器重启会失效，需要重新登录。

