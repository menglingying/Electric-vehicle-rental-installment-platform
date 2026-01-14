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
        <a-descriptions-item label="职业">{{ detail.occupation || '-' }}</a-descriptions-item>
        <a-descriptions-item label="工作单位">{{ detail.company || '-' }}</a-descriptions-item>
        <a-descriptions-item label="工作城市">{{ detail.workCity || '-' }}</a-descriptions-item>
        <a-descriptions-item label="居住时长">{{ detail.residenceDuration || '-' }}</a-descriptions-item>
        <a-descriptions-item label="现居地址" :span="2">{{ detail.residenceAddress || '-' }}</a-descriptions-item>
        <a-descriptions-item label="紧急联系人">{{ detail.contactName }}</a-descriptions-item>
        <a-descriptions-item label="联系人电话">{{ detail.contactPhone }}</a-descriptions-item>
        <a-descriptions-item label="与客户关系">{{ detail.contactRelation }}</a-descriptions-item>
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
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Button, Message, Modal, Input } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import {
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
