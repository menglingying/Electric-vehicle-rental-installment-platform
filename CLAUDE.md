# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

电动车租赁分期平台 - Monorepo 结构，包含 H5 客户端、PC 后台、服务端 API。  
核心业务：客户提交 KYC → 爱签电子签合同 → 聚证公证 → 分期还款管理。

## 常用命令

```bash
# 安装依赖（根目录执行一次即可）
npm install

# 启动 Spring Boot 服务端（端口 8080）
npm run dev:api

# 启动 Node 联调服务端（端口 8082，不走 MySQL）
npm run dev:api:node

# 启动 H5 客户端（端口 5173）
npm run dev:h5

# 启动 PC 后台（端口 5174）
npm run dev:admin

# 构建
npm run build:h5
npm run build:admin
```

## 技术栈

| 模块 | 技术 |
|------|------|
| apps/h5 | Vue 3 + Vant 4 + Vite + TypeScript |
| apps/admin | Vue 3 + Arco Design + Vite + TypeScript |
| services/api | Spring Boot 3 + MySQL + Redis |
| services/api-node | Node.js + Express（联调用） |

## 仓库结构

```
apps/h5/          # H5 客户端（Vue3 + Vant）
apps/admin/       # PC 后台（Vue3 + Arco）
services/api/     # 服务端（Spring Boot 3）
services/api-node/# Node 联调服务端
docs/             # 需求文档、开发规划、UI 规范
deploy/aliyun/    # 阿里云部署配置、SSH密钥、docker-compose、nginx
scripts/deploy-tools/ # 运维检查脚本
```

## 联调账号

- H5 登录：任意手机号 + 验证码 `123456`
- 后台登录：`admin` / `admin123`

## API 路由约定

- H5 接口：`/api/h5/*`
- 后台接口：`/api/admin/*`
- 爱签回调：`/api/callbacks/asign/contract`（注意：callbacks 复数）
- 聚证回调：`/api/callback/juzheng`（注意：callback 单数）

## 第三方集成

### 爱签（电子签名）
- 配置类：`AsignConfig`，服务：`AsignService`，回调：`AsignCallbackController`
- 关键环境变量：`ASIGN_APP_ID`、`ASIGN_PRIVATE_KEY`、`ASIGN_PUBLIC_KEY`、`ASIGN_TEMPLATE_NO`
- 回调 URL：`ASIGN_CALLBACK_URL` / `ASIGN_NOTIFY_URL`（均指向 `/api/callbacks/asign/contract`）
- 合同状态码：`2`=已签署、`3`=已过期、`4`=被拒签、`-3`=失败
- 内部状态：`SIGNING` / `SIGNED` / `VOID` / `FAILED` / `EXPIRED`
- **注意**：爱签回调可能不可靠，管理后台已加每 20 秒自动轮询兜底（`Orders.vue`）
- 模板变量（当前）：`partyAName`、`partyBName`、`partyBIdCard`、`partyBPhone`、`partyBEmail`（选填）等

### 聚证（公证）
- 配置类：`JuzhengConfig`，服务：`NotaryService`、`JuzhengClient`，回调：`JuzhengCallbackController`
- 关键环境变量：`JUZHENG_CLIENT_ID`、`JUZHENG_CLIENT_SECRET`、`JUZHENG_PUBLIC_KEY`、`JUZHENG_PRIVATE_KEY`
- **重要**：聚证回调数据结构为 `{ eventType, businessData: { outOrderNo, ... } }`，业务字段在 `businessData` 子对象内

## 生产环境

- 服务器：`47.120.27.110`，H5: 端口 `8088`，Admin: 端口 `8089`
- API（Spring Boot）运行在 Docker 内部，通过 nginx 代理，**不直接对外暴露 8080**
- 因此回调 URL 必须走 nginx 端口（如 `http://47.120.27.110:8088/api/...`）
- 构建&部署命令：`python deploy\aliyun\deploy.py --ssh-key-file "deploy\aliyun\evlease_deploy_key"`
- **本地没有 Java 时**：SSH 到服务器，在 `/tmp` 克隆仓库，用服务器 Maven 构建 JAR，再复制到 `/opt/evlease/artifacts/`

## 规范文档

- 需求文档：`docs/需求文档/`
- 开发规划：`docs/开发规划.md`
- UI 规范：`docs/UI_视觉与交互要求.md`、`docs/UI_UIX_Pro_Max_执行规范.md`

## 历史重要修复记录

| 日期 | 问题 | 修复位置 |
|------|------|---------|
| 2026-03-11 | 聚证回调字段全为 null（businessData 未解包） | `JuzhengCallbackController.java` |
| 2026-03-11 | 爱签回调不可靠导致合同状态滞留 SIGNING | `Orders.vue` 加自动轮询 + `AdminContractController` 加 `sync-status` 接口 |
| 2026-03-11 | 爱签模板必填参数 partyBEmail 缺失报 100626 | `AsignService.buildTemplateFill()` 强制发送空值 |
| 2026-03-11 | 骑缝章位置改为甲方 | 通过 `ASIGN_COMPANY_SIGN_STRATEGY_JSON` 环境变量配置 |
| 2026-01-16 | H5 人脸照片上传失败 | H5 上传组件增加文件校验 |
