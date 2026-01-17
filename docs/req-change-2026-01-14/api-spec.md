# 新增需求 API 草案（H5 + 后台）

本文件作为后端接口拆分的参考草案，命名与返回结构可按现有规范调整。

## 通用约定

- 枚举/字典：统一走字典表（`dict`/`dict_item`）。
- 地址：省/市/区三级联动，使用 `regionCode` 作为唯一标识。
- 调价：仅允许“审核前”，调价后需重签合同。

## H5 端接口

### 商品分类

- `GET /api/h5/categories/tree`
  - 描述：获取三级分类树（大类/系列/车型）。
  - 返回：`[{ id, name, level, children: [...] }]`

- `GET /api/h5/products`
  - 参数：`categoryId`（车型层级 id）
  - 描述：按车型分类获取商品列表

### 下单

- `POST /api/h5/orders`
  - 描述：提交下单资料（全部必填）
  - 请求体（关键字段）：
    - `productId`
    - `periods`
    - `cycleDays`
    - `depositRatio`
    - `batteryOption`
    - `repaymentMethod`

### KYC 资料提交

- `POST /api/h5/orders/{orderId}/kyc`
  - 描述：提交身份证与资料（全部必填）
  - 请求体（关键字段）：
    - `idCardFront`
    - `idCardBack`
    - `facePhoto`
    - `realName`
    - `idCardNumber`
    - `contactName`
    - `contactPhone`
    - `contactRelation`
    - `employmentStatus`（枚举 code）
    - `incomeRangeCode`（枚举 code）
    - `homeProvinceCode`
    - `homeCityCode`
    - `homeDistrictCode`
    - `homeAddressDetail`

## 后台管理端接口

### 分类管理

- `GET /api/admin/categories/tree`
  - 描述：获取分类树
- `POST /api/admin/categories`
- `PUT /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`

### 订单调价

- `POST /api/admin/orders/{orderId}/price-adjust`
  - 描述：仅允许审核前调价，重算分期计划，触发重签
  - 请求体（关键字段）：
    - `rentPerPeriod`
    - `periods`
    - `cycleDays`
    - `reason`

## 公共接口

### 地址数据

- `GET /api/common/regions`
  - 参数：`parentCode`（空=省级）
  - 描述：按父级查询下级地区列表

### 字典

- `GET /api/common/dicts/{dictCode}`
  - 示例：`employment_status`、`income_range`
