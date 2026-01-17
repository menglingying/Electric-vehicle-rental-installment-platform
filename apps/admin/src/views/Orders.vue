<template>
  <a-card title="订单管理（人工审核 + 履约）">
    <div style="display: flex; gap: 8px; margin-bottom: 12px">
      <a-button @click="exportOrders">导出订单CSV</a-button>
    </div>
    <a-table :data="rows" :columns="columns" :pagination="false" />
  </a-card>

  <a-drawer v-model:visible="detailVisible" width="600" title="订单详情" :footer="false">
    <template v-if="detail">
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item label="订单ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ detail.phone }}</a-descriptions-item>
        <a-descriptions-item label="商品">{{ detail.productName }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ detail.status }}</a-descriptions-item>
        <a-descriptions-item label="电池配置">{{ batteryOptionText(detail.batteryOption) }}</a-descriptions-item>
        <a-descriptions-item label="还款方式">{{ repaymentMethodText(detail.repaymentMethod) }}</a-descriptions-item>
        <a-descriptions-item label="期数">{{ detail.periods }}期</a-descriptions-item>
        <a-descriptions-item label="周期">{{ detail.cycleDays }}天/期</a-descriptions-item>
        <a-descriptions-item label="合同状态">{{ detail.contract?.status || '未发起' }}</a-descriptions-item>
        <a-descriptions-item label="收款状态">{{ detail.payment?.status || '未发起' }}</a-descriptions-item>
        <a-descriptions-item label="剩余应还">￥{{ detail.remainingAmount }}</a-descriptions-item>
      </a-descriptions>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px">
        KYC实名信息
        <a-tag v-if="detail.kycCompleted" color="green">已完成</a-tag>
        <a-tag v-else color="orange">未完成</a-tag>
      </div>
      <a-descriptions v-if="detail.kycCompleted" :column="2" size="small" bordered>
        <a-descriptions-item label="真实姓名">{{ detail.realName }}</a-descriptions-item>
        <a-descriptions-item label="身份证号">{{ maskIdCard(detail.idCardNumber) }}</a-descriptions-item>
        <a-descriptions-item label="就业状态">{{ employmentStatusText(detail.employmentStatus) }}</a-descriptions-item>
        <a-descriptions-item label="单位/职业">{{ detail.employmentName || detail.occupation || '-' }}</a-descriptions-item>
        <a-descriptions-item label="月收入">{{ incomeRangeText(detail.incomeRangeCode) }}</a-descriptions-item>
        <a-descriptions-item label="住家地址" :span="2">{{ formatAddress(detail) }}</a-descriptions-item>
        <a-descriptions-item label="紧急联系人">{{ detail.contactName }}</a-descriptions-item>
        <a-descriptions-item label="联系人电话">{{ detail.contactPhone }}</a-descriptions-item>
        <a-descriptions-item label="与客户关系">{{ contactRelationText(detail.contactRelation) }}</a-descriptions-item>
      </a-descriptions>
      <div v-if="detail.kycCompleted" style="margin-top: 12px; display: flex; gap: 12px">
        <div v-if="detail.idCardFront" class="kyc-image">
          <div class="label">身份证正面</div>
          <a-image :src="detail.idCardFront" width="120" height="80" fit="cover" />
        </div>
        <div v-if="detail.idCardBack" class="kyc-image">
          <div class="label">身份证反面</div>
          <a-image :src="detail.idCardBack" width="120" height="80" fit="cover" />
        </div>
        <div v-if="detail.facePhoto" class="kyc-image">
          <div class="label">人脸自拍</div>
          <a-image :src="detail.facePhoto" width="80" height="80" fit="cover" />
        </div>
      </div>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px">状态流转日志</div>
      <a-table :data="detail.statusLogs || []" :pagination="false" size="small">
        <a-table-column title="时间" data-index="at" />
        <a-table-column title="动作" data-index="action" />
        <a-table-column title="状态" data-index="status" />
        <a-table-column title="来源" data-index="by" />
      </a-table>
    </template>
  </a-drawer>

  <a-modal v-model:visible="adjustVisible" title="订单调价" @ok="submitAdjust">
    <a-form :model="adjustForm" layout="vertical">
      <a-form-item label="租金/期（元）" field="rentPerPeriod">
        <a-input-number v-model="adjustForm.rentPerPeriod" :min="1" />
      </a-form-item>
      <a-form-item label="期数" field="periods">
        <a-input-number v-model="adjustForm.periods" :min="3" />
      </a-form-item>
      <a-form-item label="周期（天）" field="cycleDays">
        <a-input-number v-model="adjustForm.cycleDays" :min="7" />
      </a-form-item>
      <a-form-item label="调价原因" field="reason">
        <a-input v-model="adjustForm.reason" placeholder="请输入原因" />
      </a-form-item>
      <a-alert type="warning" :show-icon="true" title="调价仅限审核前，调价后需重签合同。" />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Button, Message, Modal, Input } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import {
  adjustOrderPrice,
  approveOrder,
  closeOrder,
  deliverOrder,
  getOrderDetail,
  listOrders,
  pickupOrder,
  rejectOrder,
  returnOrder,
  settleOrder,
  type Order
} from '@/services/api';
import { downloadCsv } from '@/services/download';

const rows = ref<Order[]>([]);
const detailVisible = ref(false);
const detail = ref<any>(null);
const adjustVisible = ref(false);
const adjustForm = ref({
  orderId: '',
  rentPerPeriod: 0,
  periods: 0,
  cycleDays: 0,
  reason: ''
});

// 辅助函数：电池配置文本
function batteryOptionText(option: string) {
  const map: Record<string, string> = {
    'WITHOUT_BATTERY': '空车',
    'WITH_BATTERY': '含电池'
  };
  return map[option] || option || '-';
}

// 辅助函数：还款方式文本
function repaymentMethodText(method: string) {
  const map: Record<string, string> = {
    'AUTO_DEDUCT': '自动扣款',
    'MANUAL_TRANSFER': '手动转账',
    'OFFLINE': '线下收款'
  };
  return map[method] || method || '-';
}

// 辅助函数：身份证号脱敏
function maskIdCard(idCard: string) {
  if (!idCard || idCard.length < 10) return idCard || '-';
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}

function employmentStatusText(code: string) {
  const map: Record<string, string> = {
    employed: '\u5168\u804c',
    part_time: '\u517c\u804c',
    freelancer: '\u81ea\u7531\u804c\u4e1a',
    self_employed: '\u4e2a\u4f53\u7ecf\u8425',
    student: '\u5b66\u751f',
    unemployed: '\u5168\u804c',
    retired: '\u9000\u4f11'
  };
  return map[code] || '-';
}

function incomeRangeText(code: string) {
  const map: Record<string, string> = {
    '0_1000': '0-1000',
    '1000_2000': '1000-2000',
    '2001_3000': '2001-3000',
    '3001_4000': '3001-4000',
    '4001_5000': '4001-5000',
    '5001_8000': '5001-8000',
    '8001_12000': '8001-12000',
    '12001_20000': '12001-20000',
    '20000_plus': '20000+',
    '12001_plus': '12001+'
  };
  return map[code] || '-';
}

function contactRelationText(code: string) {
  const map: Record<string, string> = {
    parent: '\u7236\u6bcd',
    spouse: '\u914d\u5076',
    child: '\u5b50\u5973',
    colleague: '\u540c\u4e8b',
    friend: '\u670b\u53cb',
    other: '\u5176\u4ed6'
  };
  return map[code] || code || '-';
}

function formatAddress(order: any) {
  const parts = [
    order?.homeProvinceName || order?.homeProvinceCode,
    order?.homeCityName || order?.homeCityCode,
    order?.homeDistrictName || order?.homeDistrictCode,
    order?.homeAddressDetail
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : '-';
}

const columns: TableColumnData[] = [
  { title: 'ID', dataIndex: 'id' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '商品', dataIndex: 'productName' },
  { title: '电池配置', render: ({ record }: { record: any }) => batteryOptionText(record.batteryOption) },
  { title: '还款方式', render: ({ record }: { record: any }) => repaymentMethodText(record.repaymentMethod) },
  { 
    title: 'KYC', 
    render: ({ record }: { record: any }) => h('span', { style: record.kycCompleted ? 'color: green' : 'color: orange' }, 
      record.kycCompleted ? '已完成' : '未完成')
  },
  { title: '状态', dataIndex: 'status' },
  { title: '期数', dataIndex: 'periods' },
  { title: '创建时间', dataIndex: 'createdAt' },
  { 
    title: '操作', 
    render: ({ record }: { record: any }) => {
      const status = record.status;
      const buttons: any[] = [];
      buttons.push(h(Button, { size: 'small', onClick: () => openDetail(record.id) }, () => '详情'));
      if (status === 'PENDING_REVIEW') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => approve(record.id) }, () => '通过'));
        buttons.push(h(Button, { status: 'danger', size: 'small', onClick: () => reject(record.id) }, () => '驳回'));
        buttons.push(h(Button, { size: 'small', onClick: () => openAdjust(record.id) }, () => '调价'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'ACTIVE') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => deliver(record.id) }, () => '交付'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'DELIVERED') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => pickup(record.id) }, () => '取车'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'IN_USE') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => doReturn(record.id) }, () => '归还'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'RETURNED') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => settle(record.id) }, () => '结清'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      }
      return h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' }, buttons);
    }
  }
];

async function load() {
  try {
    rows.value = await listOrders();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

async function approve(id: string) {
  try {
    await approveOrder(id);
    Message.success('已通过');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function reject(id: string) {
  let reason = '';
  Modal.confirm({
    title: '驳回原因',
    content: () =>
      h(Input, {
        placeholder: '请输入原因',
        onInput: (v: string) => (reason = v)
      }),
    onOk: async () => {
      await rejectOrder(id, reason || '资料不完整');
      Message.success('已驳回');
      await load();
    }
  });
}

async function deliver(id: string) {
  try {
    await deliverOrder(id);
    Message.success('已标记交付');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function pickup(id: string) {
  try {
    await pickupOrder(id);
    Message.success('已标记取车');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function doReturn(id: string) {
  try {
    await returnOrder(id);
    Message.success('已标记归还');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function settle(id: string) {
  try {
    await settleOrder(id);
    Message.success('已结清');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function close(id: string) {
  Modal.confirm({
    title: '关闭订单',
    content: '确认要关闭该订单吗？',
    onOk: async () => {
      await closeOrder(id);
      Message.success('已关闭');
      await load();
    }
  });
}

async function openDetail(id: string) {
  try {
    detail.value = await getOrderDetail(id);
    detailVisible.value = true;
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载详情失败');
  }
}

async function openAdjust(id: string) {
  try {
    const order = await getOrderDetail(id);
    const plan = Array.isArray(order?.repaymentPlan) ? order.repaymentPlan : [];
    const rentPerPeriod = plan.reduce((max: number, item: any) => Math.max(max, Number(item.amount || 0)), 0);
    adjustForm.value = {
      orderId: id,
      rentPerPeriod: rentPerPeriod || 0,
      periods: order.periods || 0,
      cycleDays: order.cycleDays || 0,
      reason: ''
    };
    adjustVisible.value = true;
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载订单失败');
  }
}

async function submitAdjust() {
  if (!adjustForm.value.orderId) return;
  if (!adjustForm.value.rentPerPeriod) return Message.warning('请输入租金/期');
  if (!adjustForm.value.periods) return Message.warning('请输入期数');
  if (!adjustForm.value.cycleDays) return Message.warning('请输入周期');
  if (!adjustForm.value.reason.trim()) return Message.warning('请输入调价原因');
  try {
    await adjustOrderPrice(adjustForm.value.orderId, {
      rentPerPeriod: adjustForm.value.rentPerPeriod,
      periods: adjustForm.value.periods,
      cycleDays: adjustForm.value.cycleDays,
      reason: adjustForm.value.reason
    });
    Message.success('调价成功');
    adjustVisible.value = false;
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '调价失败');
  }
}

onMounted(load);

async function exportOrders() {
  try {
    await downloadCsv('/admin/exports/orders.csv', 'orders.csv');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '导出失败');
  }
}
</script>

<style scoped>
.kyc-image {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kyc-image .label {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 4px;
}
</style>
