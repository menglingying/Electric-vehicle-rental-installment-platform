# DTO 字段清单（新增部分）

本清单用于前后端对字段一致性进行对齐。

## 1) 下单请求 H5CreateOrderRequest

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| productId | long | 是 | 商品 id |
| periods | int | 是 | 期数 |
| cycleDays | int | 是 | 还款周期（天） |
| depositRatio | double | 是 | 押金比例（0-1） |
| batteryOption | string | 否 | 电池选项 |
| repaymentMethod | string | 否 | 还款方式 |

## 2) KYC 提交 H5KycSubmitRequest

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| idCardFront | string | 是 | 身份证正面图片 |
| idCardBack | string | 是 | 身份证反面图片 |
| facePhoto | string | 是 | 人脸自拍照 |
| realName | string | 是 | 真实姓名 |
| idCardNumber | string | 是 | 身份证号 |
| contactName | string | 是 | 联系人姓名 |
| contactPhone | string | 是 | 联系人手机号 |
| contactRelation | string | 是 | 联系人关系 |
| employmentStatus | string | 是 | 就业状态 code |
| incomeRangeCode | string | 是 | 收入区间 code |
| homeProvinceCode | string | 是 | 省 code |
| homeCityCode | string | 是 | 市 code |
| homeDistrictCode | string | 是 | 区 code |
| homeAddressDetail | string | 是 | 详细地址 |

## 3) 枚举/字典

### 就业状态 employment_status

- employed（在职）
- freelancer（自由职业）
- self_employed（个体经营）
- student（学生）
- unemployed（待业）
- retired（退休）

### 收入区间 income_range

- 1000_2000
- 2001_3000
- 3001_4000
- 4001_5000
- 5001_8000
- 8001_12000
- 12001_plus

## 4) 调价请求 OrderPriceAdjustRequest

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| rentPerPeriod | decimal | 是 | 每期租金 |
| periods | int | 是 | 期数 |
| cycleDays | int | 是 | 还款周期（天） |
| reason | string | 是 | 调价原因 |
