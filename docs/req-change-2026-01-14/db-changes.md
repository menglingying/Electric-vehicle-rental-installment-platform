# 数据模型变更清单（建议）

本清单为建议的表结构调整，实际字段命名以现有数据库规范为准。

## 1) 分类表

建议新增：`product_category`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| parent_id | bigint | 上级分类 |
| level | int | 1=大类 2=系列 3=车型 |
| name | varchar | 分类名称 |
| sort | int | 排序 |
| status | tinyint | 1启用 0停用 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

商品表增加：
- `product.category_id`（指向车型层级）

## 2) 订单资料补充

方式 A（推荐）：新增 `order_applicant` 表，避免订单表过度膨胀。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| order_id | bigint | 订单 id |
| id_card_name | varchar | 身份证姓名 |
| id_card_no | varchar | 身份证号 |
| contact_name | varchar | 联系人姓名 |
| contact_phone | varchar | 联系人手机号 |
| contact_relation | varchar | 联系人关系 |
| employment_status | varchar | 就业状态 code |
| income_range_code | varchar | 收入区间 code |
| home_province_code | varchar | 省 code |
| home_city_code | varchar | 市 code |
| home_district_code | varchar | 区 code |
| home_address_detail | varchar | 详细地址 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

方式 B（可选）：直接在 `orders` 表新增同名字段（改动小但表膨胀）。

## 3) 调价记录与合同作废

新增：`order_price_adjustment`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| order_id | bigint | 订单 id |
| before_rent | decimal | 调价前每期租金 |
| after_rent | decimal | 调价后每期租金 |
| before_periods | int | 调价前期数 |
| after_periods | int | 调价后期数 |
| before_cycle | varchar | 调价前周期 |
| after_cycle | varchar | 调价后周期 |
| reason | varchar | 调价原因 |
| operator_id | bigint | 操作人 |
| created_at | datetime | 创建时间 |

合同表（`contract`）增加：
- `status`（active/void）
- `void_reason`

## 4) 地区数据

建议新增：`region`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| code | varchar | 行政区划 code |
| name | varchar | 名称 |
| level | int | 1省 2市 3区 |
| parent_code | varchar | 上级 code |
| sort | int | 排序 |
