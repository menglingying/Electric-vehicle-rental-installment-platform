# AGENTS.md

## Build/Run/Test
- `npm install` → install all workspaces
- `npm run dev:api` → Spring Boot (8080), `npm run dev:h5` → H5 (5173), `npm run dev:admin` → Admin (5174)
- `npm run build:h5` / `npm run build:admin` → production builds
- Backend single test: `cd services/api && mvn test -Dtest=ClassName#methodName`
- Type check: `vue-tsc -b` (run in apps/h5 or apps/admin)

## Deploy
- 部署命令: `python deploy\aliyun\deploy.py --skip-build --ssh-password "Alymima1!"`
- 备用（SSH密钥）: `python deploy\aliyun\deploy.py --skip-build --ssh-key-file "deploy\aliyun\evlease_deploy_key"`
- SSH密钥位置: `deploy/aliyun/evlease_deploy_key`
- 服务器: 47.120.27.110 (H5:8088, Admin:8089)
- 运维脚本: `scripts/deploy-tools/` (check_api.py, verify_deploy.py等)
- 检查服务器状态: `python deploy\aliyun\deploy.py --check-only --ssh-password "Alymima1!"`

### 部署注意事项（2026-04-09 记录）
- **本地无 Java 环境**：本地只能打包前端（H5/Admin），后端 JAR 需在服务器上 Maven 构建
- **推荐部署流程**：
  1. 前端：本地 `npm run build:h5` + `npm run build:admin` 生成 dist
  2. 后端：通过 `_deploy_fix.py` 上传 Java 源码到服务器，在服务器执行 `mvn package`
  3. 部署：`--skip-build` 参数跳过本地构建，直接打包 dist + 上传 + 重启容器
- **服务器资源紧张**：仅 1.6GB 内存，Maven 构建时 CPU/内存接近满载
  - 构建期间 SSH 连接可能超时断开
  - 不要同时在服务器上构建前端和后端
  - 构建完成后等待 1-2 分钟再尝试 SSH 连接
- **SSH 连接问题排查**：
  1. 连接未释放：脚本异常退出时 SSH 连接可能未正确关闭
  2. 服务器构建占满资源：Maven/npm build 会耗尽 1.6GB 内存，导致新 SSH 连接无法建立
  3. 前端打包占用：npm build 也会消耗大量 CPU，建议在本地完成
  4. 服务过多：4 个 Docker 容器 + 5000 端口其他服务，内存长期处于紧张状态

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

### 2026-04-17 【P0】还款台账与已签合同金额不一致
- **影响**：62 签约合同中 25 单台账 ≠ 合同（40%），涉及资金
- **根因**：`repayment_plan_item.amount` 会被多处按当前 `product.rent_*` 重算，而合同 meta 里的 `rentPerPeriod` 是签约瞬间冻结的；两者不一致
- **修复**：
  - `OrderEnricher.extractContractRentPerPeriod()` 读 API 时以合同金额覆盖台账显示
  - `H5OrderController.update` + `AdminRepaymentController.generatePlan` 加"合同 SIGNED 拒改 plan"保险
  - DB 批量刷新 186 行，备份表 `repayment_plan_item_backup_20260417`
  - 完整报告：`docs/P0_2026-04-17_还款台账与合同金额不一致.md`
- **后续**：对 25 位客户逐一外呼确认；建议在 `contract` 表增加 `rent_snapshot_json` 彻底固化；建议每日 cron 做一致性体检

### 2026-04-09
- 部署最新 bug 修复到生产服务器
- 记录部署注意事项：本地无 Java 环境、服务器内存紧张导致 SSH 超时等问题

### 2026-03-11
- **修复聚证回调解析 bug**：`JuzhengCallbackController` 字段从 `businessData` 子对象取，之前全为 null 导致公证状态不更新
- **管理后台合同状态自动轮询**：`Orders.vue` 抽屉打开时合同处于 SIGNING 状态，每 20 秒自动向爱签查询签署结果，客户签完后自动显示"合同已签署 ✓"
- 部署到生产服务器（服务器端 Maven 构建 JAR）

### 2026-01-16
- 修复H5人脸照片上传失败：增加文件大小/类型验证，移除capture属性
- 修复分类名称乱码：清空乱码数据
- 整理根目录：脚本移至scripts/deploy-tools/，SSH密钥移至deploy/aliyun/
- 部署最新代码到生产服务器
