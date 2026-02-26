# 客户反馈需求整理（2026-01-17）

## 目标与范围
- 修正商品分类层级：品牌 → 系列 → 车型（三级）。
- 接入电子签（asign）并贯穿前后台流程。
- 接入公证（聚证）并在前后台展示与操作。
- 支持后台手动录入/上传历史合同 PDF。

## 业务流程（更新后）
1. 后台维护分类（品牌/系列/车型），商品挂载到“车型”层级。
2. H5 下单 → KYC 完成 → 后台审核/调价。
3. 后台审核通过后生成合同并发起电子签（asign）。
4. 客户在 H5 完成签署。
5. 合同签署完成后发起公证（聚证），并展示公证状态。

## 功能需求

### 1) 分类层级调整
- 三级结构固定为：品牌（一级）→ 系列（二级）→ 车型（三级）。
- 每个品牌都需要有系列。
- 商品只允许绑定到三级（车型）。
- 支持批量迁移历史商品到新分类（可手工或脚本批量）。

### 2) 电子签（asign）
- 电子签独立于公证，但公证流程依赖电子签完成。
- 发起时机：后台审核通过并完成调价后，由后台生成合同并发起签署。
- H5 端展示签署状态和签署入口，签署完成后自动刷新状态。
- 后台展示合同状态、签署链接、签署时间、签署人等信息。
- 接入助手要点（来自 https://web.asign.cn/platform/tools/helper）：
  - 环境地址：测试 `https://prev.asign.cn/`，正式 `https://oapi.asign.cn/`。
  - 基本流程：制作模板 → 完成认证并同步用户 → 可选自定义签章 → 上传合同 → 添加签署方 → 获取 signUrl → 签署完成 → 下载合同。
  - 陌生用户流程：addStranger → createContract → addSigner → signUrl → 认证后签署 → downloadContract。
  - 请求规范：`form-data`，Header 带 `sign` + `timestamp`，Body 带 `appId` + `timestamp` + `bizData(json)`。
  - 签名规则：对 bizData 按字母排序 → 拼接 `bizData + md5(bizData) + appId + timestamp` → 使用 RSA(SHA1withRSA) 签名 → base64 作为 sign。
- 接入信息获取指引（由客户提供）：
  1. 打开登录页：`https://web.asign.cn/platform/openlogin`（注册/登录）。
  2. 进入控制台后，切换到测试环境。
  3. 在「应用中心」创建应用，获取 `appId`（如有 `appKey/appSecret` 一并提供）。
  4. 生成 RSA 公私钥，上传公钥到应用配置，私钥由你保管并提供给我。
  5. 在应用配置中填写回调地址（签署完成回调）。
  6. 使用「在线模板制作」生成合同模板并记录 `templateId` 与模板字段名（占位符）。
  7. 如需企业签章，完成企业用户同步并生成 `sealId`（若平台要求）。

### 3) 公证（聚证）
- 合同签署完成后，发起公证申请（聚证）。
- 后台订单详情展示公证信息（订单号、状态、出证时间、公证员、证书下载）。
- H5 订单详情展示公证状态（只读为主）。
- 支持后台手动触发公证（异常/补偿场景），默认签署完成后自动触发。

### 4) 后台手动录入合同 PDF
- 支持管理员上传历史合同 PDF 并绑定到订单。
- 后台 UI 提供“合同管理”入口：字段录入 + 上传 PDF + 查看/下载 + 关联订单。
- 关键字段（用于快速检索/展示）建议以表单录入方式存档，再挂载 PDF。

## 接口与实现建议

### 分类
- 已有：`GET /api/h5/categories/tree`、`GET /api/admin/categories/tree`、`POST /api/admin/categories`。
- 建议新增：批量更新商品分类接口（可选）。

### 电子签
- 现有占位：`POST /api/h5/contracts/{orderId}/start`（example.com）。
- 建议新增/改造：
  - `POST /api/admin/contracts/{orderId}/prepare`：后台生成合同并发起电子签（asign）。
  - `GET /api/h5/contracts/{orderId}`：H5 查询合同状态。
  - `POST /api/callback/asign`：接收 asgin 回调，更新合同状态与订单日志。
  - 合同记录落库：签署链接、状态、签署完成时间、签署人等。
  - 接口对接建议：
    - `createContract`：上传合同文件或绑定模板。
    - `addSigner`：添加客户签署方并返回 signUrl。
    - `downloadContract`：签署完成后下载合同。

### 公证（聚证）
- 现有 H5 接口：`/api/h5/notary/*`，尚未在前后台接入。
- 建议新增/改造：
  - `POST /api/admin/notary/{orderId}/apply`：后台触发公证。
  - `GET /api/admin/notary/{orderId}/status`：后台查看公证状态。
  - `POST /api/callback/juzheng`：已有，继续完善数据落库与展示。

### 合同 PDF（历史录入）
- 建议新增：
  - `POST /api/admin/contracts/upload`：上传 PDF，返回 URL。
  - `POST /api/admin/contracts/manual-bind`：绑定订单并写入合同记录（含关键字段）。
  - `GET /api/admin/contracts/{orderId}`：后台查看合同详情。

## 前后台 UI 调整

### H5
- 订单详情增加“合同签署”卡片：
  - 状态：未发起 / 签署中 / 已签署 / 失败
  - 按钮：签署入口（签署中可点）
- 订单详情增加“公证状态”卡片：
  - 状态展示：预审中 / 申办中 / 已出证 等

### 后台
- 订单详情增加：
  - 合同信息（状态/签署链接/签署人/签署时间）
  - 公证信息（notaryOrderNo/notaryStatus/notaryName/notaryCertifiedTime）
- 订单列表可加“合同状态/公证状态”列（可选）
- 分类管理：支持三级结构可视化与排序
- 合同管理：上传与绑定历史 PDF

## 数据结构/表
- `product_category` 已支持 3 级结构（保留，重建数据即可）。
- `product.category_id` 指向三级分类。
- `contract` 建议新增/补充字段：
  - `provider`（asign）
  - `status`
  - `signUrl`
  - `signedAt`
  - `signedBy`
  - `fileUrl`（历史 PDF）
  - `contractNo`（合同编号）
  - `templateId`（如使用模板）
  - `meta`（历史录入关键字段，JSON）
  - `notaryCertUrl`（公证证书下载链接，需后台存档）
- `order` 已包含公证字段（notaryOrderNo/notaryStatus/notaryCertifiedTime/notaryName/notaryCertUrl）。

## 验收标准
- H5 商品筛选遵循“品牌→系列→车型”层级。
- 后台可完整维护三级分类与商品归属。
- 后台审核通过后可发起电子签，H5 可签署并回显状态。
- 电子签完成后公证自动/手动发起，前后台均展示公证状态。
- 历史合同 PDF 可上传、绑定订单并在后台查看。
- 公证证书下载链接在 H5 可查看，并同步存档到后台合同管理。

## 待确认问题（仅电子签参数）
1. 电子签（asign）所需的 `appId`、公私钥、回调地址、合同模板 ID、签署方字段映射（待客户提供）。

> 说明：合同生成方式按“模板 + 字段替换 + 在线签章”执行；历史 PDF 关键字段清单按默认方案执行，如需调整再补充。
