# 更新ASIGN_TEMPLATE_FILL_JSON
cd /opt/evlease

# 使用单引号避免shell解析问题，然后使用sed修改
FILL_JSON='{"productName":"{{productName}}","productSpec":"{{productSpec}}","productQty":"{{productQty}}","productFrameNo":"{{productFrameNo}}","productAmount":"{{productAmount}}","leaseStartDate":"{{leaseStart}}","leaseEndDate":"{{leaseEnd}}","leaseDays":"{{leaseDays}}","rentDaily":"{{rentDaily}}","rentPeriodDays":"{{rentPeriodDays}}","depositTotal":"{{depositTotal}}","depositPayType":"{{depositPayType}}","depositPeriods":"{{depositPeriods}}","depositPeriodDays":"{{depositPeriodDays}}","depositPerPeriod":"{{depositPerPeriod}}","rentTotalAmount":"{{rentTotalAmount}}","firstPayDate":"{{firstPayDate}}","firstPayTotal":"{{firstPayTotal}}","firstPayRent":"{{firstPayRent}}","firstPayDeposit":"{{firstPayDeposit}}","deliveryCustomerName":"{{renterName}}","deliveryCustomerIdNo":"{{renterIdNumber}}","deliveryReceiveDate":"{{deliveryReceiveDate}}","deliveryContractDate":"{{deliveryContractDate}}","userSignDate":"{{userSignDate}}","partyAName":"{{companyName}}","partyAAddress":"四川省成都市成华区","partyBName":"{{renterName}}","partyBIdNo":"{{renterIdNumber}}","partyBPhone":"{{renterPhone}}","partyBAddress":"{{homeAddress}}"}'

# 先备份.env
cp .env .env.backup

# 删除旧的ASIGN_TEMPLATE_FILL_JSON行
sed -i '/^ASIGN_TEMPLATE_FILL_JSON=/d' .env

# 添加新的配置
echo "ASIGN_TEMPLATE_FILL_JSON=$FILL_JSON" >> .env

# 验证
grep ASIGN_TEMPLATE_FILL_JSON .env
