# AGENTS.md

## Build/Run/Test
- `npm install` → install all workspaces
- `npm run dev:api` → Spring Boot (8080), `npm run dev:h5` → H5 (5173), `npm run dev:admin` → Admin (5174)
- `npm run build:h5` / `npm run build:admin` → production builds
- Backend single test: `cd services/api && mvn test -Dtest=ClassName#methodName`
- Type check: `vue-tsc -b` (run in apps/h5 or apps/admin)

## Deploy
- 部署命令: `python deploy\aliyun\deploy.py --ssh-key-file "deploy\aliyun\evlease_deploy_key"`
- SSH密钥位置: `deploy/aliyun/evlease_deploy_key`
- 服务器: 47.120.27.110 (H5:8088, Admin:8089)
- 运维脚本: `scripts/deploy-tools/` (check_api.py, verify_deploy.py等)

## Code Style
- **TypeScript**: strict mode, ES2022, path alias `@/*` → `src/*`, no ESLint configured
- **Vue**: `<script setup lang="ts">` + Composition API, Vant (H5), Arco Design (Admin)
- **Java**: Spring Boot 3.3, Java 17, record DTOs, constructor injection, JPA entities
- **Naming**: camelCase (TS/Java vars), PascalCase (components/classes), kebab-case (files)
- **Imports**: external → internal, always use `@/` alias in Vue apps

## Error Handling
- Frontend: axios interceptors in `services/http.ts`, catch `e?.response?.data?.message`
- Backend: throw `ApiException(HttpStatus, message)`, handled by `GlobalExceptionHandler`

## Structure
- `apps/h5` - H5 mobile (Vue3+Vant), `apps/admin` - PC admin (Vue3+Arco)
- `services/api` - Spring Boot API (JPA+MySQL), `services/api-node` - Node mock server
- `deploy/aliyun` - 阿里云部署配置、SSH密钥、docker-compose
- `scripts/deploy-tools` - 运维检查脚本
- `docs/` - 项目文档和进度

## 更新日志

### 2026-03-11
- **修复聚证回调解析 bug**：`JuzhengCallbackController` 字段从 `businessData` 子对象取，之前全为 null 导致公证状态不更新
- **管理后台合同状态自动轮询**：`Orders.vue` 抽屉打开时合同处于 SIGNING 状态，每 20 秒自动向爱签查询签署结果，客户签完后自动显示"合同已签署 ✓"
- 部署到生产服务器（服务器端 Maven 构建 JAR）

### 2026-01-16
- 修复H5人脸照片上传失败：增加文件大小/类型验证，移除capture属性
- 修复分类名称乱码：清空乱码数据
- 整理根目录：脚本移至scripts/deploy-tools/，SSH密钥移至deploy/aliyun/
- 部署最新代码到生产服务器
