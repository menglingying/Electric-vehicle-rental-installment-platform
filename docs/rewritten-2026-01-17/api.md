# 接口文档（API Spec）

更新日期：2026-01-17

## 1. 基本约定

- Base URL：`/api`
- 鉴权方式：`Authorization: Bearer <token>`
- Token 类型：
  - H5：`/api/h5/**`、`/api/common/**`
  - Admin：`/api/admin/**`
- 错误返回统一格式：

```json
{ "message": "错误描述" }
```

- 状态码示例：401 未登录 / 403 无权限 / 400 参数错误 / 404 不存在。

### 1.1 无需鉴权的接口

- `POST /api/h5/auth/request-code`
- `POST /api/h5/auth/login`
- `GET /api/h5/products`
- `GET /api/h5/products/{id}`
- `GET /api/health`
- `POST /api/callbacks/esign`
- `POST /api/callbacks/payment`
- `POST /api/callback/juzheng`

## 2. H5 端接口

### 2.1 登录与验证码

**POST** `/api/h5/auth/request-code`

请求：

```json
{ "phone": "13800000000" }
```

响应：

```json
{ "message": "ok", "devFixedCode": "123456", "expireMinutes": 15 }
```

**POST** `/api/h5/auth/login`

请求：

```json
{ "phone": "13800000000", "code": "123456" }
```

响应：

```json
{ "token": "<jwt-like-token>" }
```

### 2.2 商品

**GET** `/api/h5/products`

查询参数：`categoryId`（可选）

响应：

```json
[
  {
    "id": "p_xxx",
    "name": "车型",
    "coverUrl": "",
    "images": [],
    "rentPerCycle": 299,
    "rentWithoutBattery": 269,
    "rentWithBattery": 299,
    "categoryId": "cat_xxx",
    "tags": ["..."],
    "frameConfig": "...",
    "batteryConfig": "..."
  }
]
```

**GET** `/api/h5/products/{id}`

响应同上单个对象。

### 2.3 分类

**GET** `/api/h5/categories/tree`

响应：

```json
[
  { "id": "cat_1", "name": "品牌", "level": 1, "children": [
      { "id": "cat_2", "name": "系列", "level": 2, "children": [
          { "id": "cat_3", "name": "型号", "level": 3, "children": [] }
      ]}
  ]}
]
```

### 2.4 订单

**POST** `/api/h5/orders`

请求：

```json
{
  "productId": "p_xxx",
  "periods": 12,
  "cycleDays": 30,
  "depositRatio": 0.25,
  "batteryOption": "WITHOUT_BATTERY",
  "repaymentMethod": "MANUAL_TRANSFER"
}
```

响应：订单详情（见 5. 数据模型）。

**GET** `/api/h5/orders`

响应：订单列表（见 5. 数据模型）。

**GET** `/api/h5/orders/{id}`

响应：订单详情（见 5. 数据模型）。

### 2.5 KYC 上传与提交

**POST** `/api/h5/upload`（multipart/form-data）

表单字段：`file`

响应：

```json
{ "url": "/uploads/kyc_xxx.jpg" }
```

**POST** `/api/h5/orders/{orderId}/kyc`

请求：

```json
{
  "idCardFront": "/uploads/xxx.jpg",
  "idCardBack": "/uploads/xxx.jpg",
  "facePhoto": "/uploads/xxx.jpg",
  "realName": "张三",
  "idCardNumber": "510xxx",
  "contactName": "李四",
  "contactPhone": "13800000000",
  "contactRelation": "parent",
  "employmentStatus": "employed",
  "employmentName": "某公司",
  "incomeRangeCode": "5001_8000",
  "homeProvinceCode": "510000",
  "homeCityCode": "510100",
  "homeDistrictCode": "510104",
  "homeAddressDetail": "xx路xx号"
}
```

响应：

```json
{ "success": true }
```

### 2.6 合同（预留）

**POST** `/api/h5/contracts/{orderId}/start`

响应：

```json
{ "id": "c_xxx", "orderId": "o_xxx", "status": "SIGNING", "signUrl": "..." }
```

**GET** `/api/h5/contracts/{orderId}`

响应：合同对象或 `null`。

### 2.7 收款（预留）

**POST** `/api/h5/orders/{orderId}/payment/start`

响应：

```json
{ "id": "pay_xxx", "orderId": "o_xxx", "status": "PENDING", "cashierUrl": "..." }
```

### 2.8 公证（聚证对接）

**POST** `/api/h5/notary/{orderId}/apply`

响应：

```json
{ "success": true, "outOrderNo": "..." }
```

**GET** `/api/h5/notary/{orderId}/sign-url`

响应：

```json
{ "signUrl": "..." }
```

**GET** `/api/h5/notary/{orderId}/status`

响应：

```json
{
  "notaryOrderNo": "...",
  "notaryStatus": "20",
  "notaryStatusText": "申请中",
  "notaryCertifiedTime": "",
  "notaryName": ""
}
```

## 3. 通用接口（H5 登录后可用）

**GET** `/api/common/dicts/{dictCode}`

- `employment_status` / `income_range` / `contact_relation`

响应：

```json
[{ "code": "employed", "label": "全职" }]
```

**GET** `/api/common/regions?parentCode=`

- `parentCode` 为空返回省级；传入省级 code 返回市级；传入市级 code 返回区县。

响应：

```json
[{ "code": "510000", "name": "四川省" }]
```

## 4. 管理后台接口

### 4.1 登录

**POST** `/api/admin/auth/login`

请求：

```json
{ "username": "admin", "password": "admin123" }
```

响应：

```json
{ "token": "<admin-token>" }
```

### 4.2 分类

**GET** `/api/admin/categories/tree`

**POST** `/api/admin/categories`

请求：

```json
{ "id": "", "parentId": "", "name": "品牌", "sort": 0, "status": 1 }
```

**DELETE** `/api/admin/categories/{id}`

### 4.3 商品

**GET** `/api/admin/products`

**POST** `/api/admin/products`

请求：

```json
{
  "id": "",
  "name": "车型",
  "rentPerCycle": 299,
  "categoryId": "cat_xxx",
  "tags": ["..."],
  "coverUrl": "",
  "images": ["..."],
  "frameConfig": "",
  "batteryConfig": "",
  "rentWithoutBattery": 269,
  "rentWithBattery": 299
}
```

**DELETE** `/api/admin/products/{id}`

**POST** `/api/admin/uploads`（multipart/form-data）

响应：

```json
{ "url": "/uploads/img_xxx.jpg" }
```

### 4.4 订单与履约

**GET** `/api/admin/orders`

**GET** `/api/admin/orders/{id}`

**POST** `/api/admin/orders/{id}/approve`

**POST** `/api/admin/orders/{id}/reject`

请求：

```json
{ "reason": "资料不完整" }
```

**POST** `/api/admin/orders/{id}/deliver`

**POST** `/api/admin/orders/{id}/pickup`

**POST** `/api/admin/orders/{id}/return`

**POST** `/api/admin/orders/{id}/settle`

**POST** `/api/admin/orders/{id}/close`

**POST** `/api/admin/orders/{id}/price-adjust`

请求：

```json
{ "rentPerPeriod": 299, "periods": 12, "cycleDays": 30, "reason": "活动调价" }
```

### 4.5 还款

**GET** `/api/admin/repayments?orderId=o_xxx`

**POST** `/api/admin/orders/{id}/repayments/{period}/mark-paid`

### 4.6 提醒与短信

**GET** `/api/admin/reminders?kind=all|due_today|due_soon`

**POST** `/api/admin/reminders/send`

请求：

```json
{ "ids": ["rem_o_xxx_1"] }
```

**GET** `/api/admin/overdue?tier=1-3|3-10|10-30|30+|all`

**POST** `/api/admin/overdue/send`

请求：

```json
{ "items": [{ "orderId": "o_xxx", "period": 1, "amount": 299, "overdueDays": 5 }] }
```

**POST** `/api/admin/sms/send`

请求：

```json
{ "phone": "13800000000", "content": "短信内容" }
```

**GET** `/api/admin/sms/records`

### 4.7 黑名单

**GET** `/api/admin/blacklist`

**POST** `/api/admin/blacklist`

请求：

```json
{ "phone": "13800000000", "reason": "风险客户" }
```

**DELETE** `/api/admin/blacklist/{phone}`

### 4.8 导出

- **GET** `/api/admin/exports/orders.csv`
- **GET** `/api/admin/exports/repayments.csv`
- **GET** `/api/admin/exports/overdue.csv`
- **GET** `/api/admin/exports/sms.csv`

CSV 返回为 UTF-8 BOM，适配 Excel。

## 5. 回调接口

**POST** `/api/callbacks/esign`

```json
{ "orderId": "o_xxx", "status": "SIGNED" }
```

**POST** `/api/callbacks/payment`

```json
{ "paymentId": "pay_xxx", "status": "SUCCESS" }
```

**POST** `/api/callback/juzheng`

- 聚证回调，参数为加密字符串。

## 6. 健康检查

**GET** `/api/health`

```json
{ "ok": true }
```

## 7. 数据模型（简要）

### 7.1 Order（订单详情）

主要字段：

- `id`, `phone`, `productId`, `productName`
- `periods`, `cycleDays`, `depositRatio`
- `batteryOption`, `repaymentMethod`
- `status`, `createdAt`, `approvedAt` ...
- `repaymentPlan`: [{ period, dueDate, amount, paid }]
- `repaymentRecords`: [{ period, amount, paidAt }]
- `remainingAmount`
- `contract`, `payment`
- `statusLogs`
- `kycCompleted` + KYC 字段（realName、idCardNumber 等）
- `homeProvinceName/homeCityName/homeDistrictName`

### 7.2 Contract

- `id`, `orderId`, `status`, `signUrl`, `createdAt`, `updatedAt`

### 7.3 PaymentIntent

- `id`, `orderId`, `status`, `cashierUrl`, `createdAt`, `updatedAt`

