# 电动车租赁分期平台（H5 + PC 后台）

一期范围（已确认）：
- H5 + PC 后台 + 服务端 API
- 手机验证码登录（一期先固定验证码用于联调/测试）
- 需要人工审核
- 收款：预留第三方 H5 收银台对接
- 电子签：预留对接能力（供应商后定）
- 不做：通讯录、定位

需求与规范：
- `docs/需求文档`
- `docs/开发规划.md`
- `docs/UI_视觉与交互要求.md`

## 目录结构

- `apps/h5`：H5 客户端（Vue3 + Vant）
- `apps/admin`：PC 后台（Vue3 + Arco）
- `services/api`：服务端（Spring Boot 3）

## 本地启动（开发）

1) 启动服务端（Spring Boot + MySQL 持久化）
- 根目录执行：`npm install`
- 根目录执行：`npm run dev:api`
- 默认端口：`http://localhost:8080`

2) 启动 H5
- 根目录执行：`npm run dev:h5`
- H5 地址：`http://localhost:5173`

3) 启动 PC 后台
- 根目录执行：`npm run dev:admin`
- 后台地址：`http://localhost:5174`

可选：Node 联调服务端（不走 MySQL，端口不同避免冲突）
- 运行：`npm run dev:api:node`
- 地址：`http://localhost:8082`

如果你终端里 `java` 提示“不是内部或外部命令”，但你实际安装了 JDK：
- 确认 `JAVA_HOME` 指到 JDK 目录（例如 `D:\jdk-17.0.2`）
- 把 `%JAVA_HOME%\bin` 加到 `PATH`
- 或者直接用 `npm run dev:api`（脚本会尝试使用 `JAVA_HOME`）

## 联调账号（dev）

H5 登录：
- 手机号：任意
- 固定验证码：`123456`

后台登录：
- 用户名：`admin`
- 密码：`admin123`
