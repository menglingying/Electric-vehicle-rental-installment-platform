<template>
  <div class="panel">
    <div class="panel-title">
      <div>还款管理</div>
      <span class="link">人工标记与计划查看</span>
    </div>
    <div class="section-toolbar">
      <a-input
        v-model="searchKeyword"
        placeholder="搜索客户姓名 / 手机号"
        allow-clear
        style="width: 220px"
      />
      <a-select v-model="selectedOrderId" placeholder="选择订单" style="width: 400px" @change="onSelect" allow-search>
        <a-option v-for="o in filteredOrders" :key="o.id" :value="o.id">
          {{ o.realName || '未实名' }} · {{ o.phone }} · {{ o.productName }} · {{ o.periods }}期
        </a-option>
      </a-select>
      <a-button @click="loadOrders">刷新订单</a-button>
      <a-button @click="exportRepayments">导出还款CSV</a-button>
    </div>

    <!-- 订单摘要 -->
    <div v-if="orderSummary" style="margin-bottom:12px">
      <a-descriptions :column="4" size="small" bordered>
        <a-descriptions-item label="客户">{{ orderSummary.realName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ orderSummary.phone }}</a-descriptions-item>
        <a-descriptions-item label="商品">{{ orderSummary.productName }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ statusText(orderSummary.status) }}</a-descriptions-item>
        <a-descriptions-item label="分期">{{ orderSummary.periods }}期 / {{ orderSummary.cycleDays }}天</a-descriptions-item>
        <a-descriptions-item label="已还/总期">
          <span style="color:#52c41a; font-weight:600">{{ paidCount }}</span> / {{ planRows.length }}
        </a-descriptions-item>
        <a-descriptions-item label="剩余应还">
          <span style="color:#f53f3f; font-weight:600">¥{{ remainingAmount }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="合同状态">{{ contractStatusText(orderSummary.contractStatus) }}</a-descriptions-item>
      </a-descriptions>
    </div>

    <a-alert v-if="!selectedOrderId" style="margin-bottom: 12px" type="info">
      请先选择一个订单查看还款计划
    </a-alert>

    <!-- 无还款计划时，显示生成按钮 -->
    <div v-else-if="planRows.length === 0 && !loading" style="margin-bottom: 12px">
      <a-alert type="warning" style="margin-bottom: 8px">
        该订单暂无还款计划数据。可能是旧订单未自动生成计划，请点击下方按钮手动生成。
      </a-alert>
      <a-button type="primary" :loading="generating" @click="handleGeneratePlan">
        生成还款计划
      </a-button>
    </div>

    <div class="table-wrap">
      <a-table :data="planRows" :columns="tableColumns" :pagination="false" :loading="loading" :bordered="{ cell: true }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed, onMounted, ref } from 'vue';
import { Button, Message, Tag, Popconfirm } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import { getRepayments, listOrders, markPeriodPaid, getOrderDetail } from '@/services/api';
import { http } from '@/services/http';
import { downloadCsv } from '@/services/download';

const orders = ref<any[]>([]);
const selectedOrderId = ref<string>('');
const planRows = ref<any[]>([]);
const repaymentRecords = ref<any[]>([]);
const orderSummary = ref<any>(null);
const loading = ref(false);
const generating = ref(false);
const searchKeyword = ref('');

const filteredOrders = computed(() => {
  const kw = searchKeyword.value.trim();
  if (!kw) return orders.value;
  return orders.value.filter(o => {
    const name = o.realName || '';
    const phone = o.phone || '';
    return name.includes(kw) || phone.includes(kw);
  });
});

const paidCount = computed(() => planRows.value.filter(r => r.paid).length);
const remainingAmount = computed(() =>
  planRows.value.filter(r => !r.paid && r.amount > 0).reduce((sum, r) => sum + r.amount, 0)
);

function statusText(status: string) {
  const map: Record<string, string> = {
    PENDING_REVIEW: '待审核', ACTIVE: '待交付', DELIVERED: '已交付',
    IN_USE: '租赁中', RETURNED: '已归还', SETTLED: '已结清',
    REJECTED: '已驳回', CLOSED: '已关闭'
  };
  return map[status] || status || '-';
}

function contractStatusText(status?: string) {
  const map: Record<string, string> = {
    SIGNING: '签署中', SIGNED: '已签署', VOID: '已作废', FAILED: '失败', EXPIRED: '已过期'
  };
  return status ? (map[status] ?? status) : '未发起';
}

function isOverdue(dueDate: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getPaidTime(period: number) {
  const record = repaymentRecords.value.find(r => r.period === period);
  if (!record?.paidAt) return '';
  const d = new Date(record.paidAt);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

const tableColumns: TableColumnData[] = [
  { title: '期次', dataIndex: 'period', width: 80, align: 'center' },
  { title: '应还日期', dataIndex: 'dueDate', width: 140 },
  {
    title: '应还金额', width: 120,
    render: ({ record }: any) => `¥${record.amount}`
  },
  {
    title: '还款状态', width: 120, align: 'center',
    render: ({ record }: any) => {
      if (record.paid) return h(Tag, { color: 'green' }, () => '已还');
      if (record.amount <= 0) return h(Tag, { color: 'gray' }, () => '免还');
      if (isOverdue(record.dueDate)) return h(Tag, { color: 'red' }, () => '逾期未还');
      return h(Tag, { color: 'orangered' }, () => '待还');
    }
  },
  {
    title: '还款时间', width: 180,
    render: ({ record }: any) => getPaidTime(record.period) || '-'
  },
  {
    title: '操作', width: 140, align: 'center',
    render: ({ record }: any) => {
      if (record.paid) return h('span', { style: 'color:#52c41a' }, '✓ 已还');
      if (record.amount <= 0) return h('span', { style: 'color:#8c8c8c' }, '-');
      return h(
        Popconfirm,
        { content: `确认标记第${record.period}期（¥${record.amount}）为已还？`, onOk: () => markPaid(record.period) },
        { default: () => h(Button, { type: 'primary', size: 'small' }, () => '标记已还') }
      );
    }
  }
];

async function loadOrders() {
  try {
    orders.value = await listOrders();
    if (!selectedOrderId.value && orders.value.length) {
      selectedOrderId.value = orders.value[0].id;
      await loadPlan();
    }
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载订单失败');
  }
}

async function loadPlan() {
  if (!selectedOrderId.value) return;
  loading.value = true;
  try {
    const data = await getRepayments(selectedOrderId.value);
    planRows.value = data.repaymentPlan ?? [];
    repaymentRecords.value = data.repaymentRecords ?? [];

    const detail = await getOrderDetail(selectedOrderId.value);
    orderSummary.value = {
      realName: detail.realName,
      phone: detail.phone,
      productName: detail.productName,
      status: detail.status,
      periods: detail.periods,
      cycleDays: detail.cycleDays,
      contractStatus: detail.contract?.status
    };
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载还款计划失败');
  } finally {
    loading.value = false;
  }
}

async function onSelect() {
  await loadPlan();
}

async function markPaid(period: number) {
  try {
    await markPeriodPaid(selectedOrderId.value, period);
    Message.success(`第${period}期已标记还款`);
    await loadPlan();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function handleGeneratePlan() {
  if (!selectedOrderId.value) return;
  generating.value = true;
  try {
    const { data: result } = await http.post(`/admin/orders/${selectedOrderId.value}/generate-plan`);
    Message.success(`还款计划已生成，共${result.periods}期`);
    await loadPlan();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '生成还款计划失败');
  } finally {
    generating.value = false;
  }
}

onMounted(loadOrders);

async function exportRepayments() {
  try {
    await downloadCsv('/admin/exports/repayments.csv', 'repayments.csv');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '导出失败');
  }
}
</script>
