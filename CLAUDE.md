# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

电动车租赁分期平台 - Monorepo 结构，包含 H5 客户端、PC 后台、服务端 API。

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
```

## 联调账号

- H5 登录：任意手机号 + 验证码 `123456`
- 后台登录：`admin` / `admin123`

## API 路由约定

- H5 接口：`/api/h5/*`
- 后台接口：`/api/admin/*`

## 规范文档

- 需求文档：`docs/需求文档/`
- 开发规划：`docs/开发规划.md`
- UI 规范：`docs/UI_视觉与交互要求.md`、`docs/UI_UIX_Pro_Max_执行规范.md`
