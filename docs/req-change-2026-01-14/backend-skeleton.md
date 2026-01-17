# 后端实现骨架（按现有包结构）

本文件给出建议的类与接口清单，便于落地时直接对照实现。

## 1) Controller

### H5

- `com.evlease.installment.controller.h5.H5CategoryController`
  - `GET /api/h5/categories/tree`
  - `GET /api/h5/categories/{id}/children`
- `com.evlease.installment.controller.h5.H5ProductController`
  - `GET /api/h5/products?categoryId=`
- `com.evlease.installment.controller.h5.H5KycController`
  - `POST /api/h5/orders/{orderId}/kyc`
  - 更新 `KycSubmitRequest`：新增必填字段（就业/收入/住址）

### Admin

- `com.evlease.installment.controller.admin.AdminCategoryController`
  - `GET /api/admin/categories/tree`
  - `POST /api/admin/categories`
  - `PUT /api/admin/categories/{id}`
  - `DELETE /api/admin/categories/{id}`
- `com.evlease.installment.controller.admin.AdminOrderController`
  - 新增 `POST /api/admin/orders/{id}/price-adjust`

### Common

- `com.evlease.installment.controller.common.CommonRegionController`
  - `GET /api/common/regions?parentCode=`
- `com.evlease.installment.controller.common.CommonDictController`
  - `GET /api/common/dicts/{dictCode}`

## 2) Service

- `CategoryService`
  - 分类树构建、启停用校验
- `RegionService`
  - 省/市/区联动查询
- `DictService`
  - 就业状态、收入区间字典读取
- `OrderPriceAdjustService`
  - 审核前校验
  - 分期计划重算
  - 记录调价与合同作废/重签动作

## 3) Model / Entity

- `ProductCategory`
  - `id`, `parentId`, `level`, `name`, `sort`, `status`
- `Region`
  - `code`, `name`, `level`, `parentCode`, `sort`
- `Dict`, `DictItem`
  - 用于枚举字典（employment_status / income_range）
- `OrderPriceAdjustment`
  - 调价前后对比与操作留痕
- `Order`
  - 新增字段：
    - `employmentStatus`
    - `incomeRangeCode`
    - `homeProvinceCode`
    - `homeCityCode`
    - `homeDistrictCode`
    - `homeAddressDetail`

## 4) Repository

- `ProductCategoryRepository`
- `RegionRepository`
- `DictRepository`, `DictItemRepository`
- `OrderPriceAdjustmentRepository`

## 5) DTO（record）

- `H5CategoryController.CategoryTreeResponse`
- `AdminCategoryController.CategoryRequest`
- `AdminOrderController.PriceAdjustRequest`
- `CommonRegionController.RegionItem`
- `CommonDictController.DictItemResponse`

## 6) 规则要点

- 调价仅允许在订单 `PENDING_REVIEW` 状态
- 调价后重算分期计划并记录 `OrderPriceAdjustment`
- 调价后合同置为 `void` 并触发重签
