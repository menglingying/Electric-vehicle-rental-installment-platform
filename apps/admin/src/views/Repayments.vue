<template>
  <div class="panel">
    <div class="panel-title">
      <div>还款管理</div>
      <span class="link">人工标记与计划查看</span>
    </div>
    <div class="section-toolbar">
      <a-select v-model="selectedOrderId" placeholder="搜索客户姓名/手机号" style="width: 360px" @change="onSelect" allow-search>
        <a-option v-for="o in orders" :key="o.id" :value="o.id">
          {{ o.realName || '未实名' }} · {{ o.phone }} · {{ o.productName }}
        </a-option>
      </a-select>
      <a-button @click="loadOrders">刷新订单</a-button>
      <a-button @click="exportRepayments">导出还款CSV</a-button>
    </div>

    <a-alert style="margin-bottom: 12px" type="info">
      一期：还款记录先通过后台“标记已还”产生；后续对接收银台回调后可自动入账。
    </a-alert>

    <div class="table-wrap">
      <a-table :data="planRows" :pagination="false">
        <a-table-column title="期次" data-index="period" />
        <a-table-column title="应还日期" data-index="dueDate" />
        <a-table-column title="金额" :render="({ record }: any) => `¥${record.amount}`" />
        <a-table-column title="状态" :render="({ record }: any) => (record.paid ? '已还' : '未还')" />
        <a-table-column
          title="操作"
          :render="({ record }: any) =>
            h(
              Button,
              { type: 'primary', size: 'small', disabled: record.paid || record.amount <= 0, onClick: () => markPaid(record.period) },
              () => '标记已还'
            )
          "
        />
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
import { getRepayments, listOrders, markPeriodPaid } from '@/services/api';
import { downloadCsv } from '@/services/download';

const orders = ref<any[]>([]);
const selectedOrderId = ref<string>('');
const planRows = ref<any[]>([]);

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
  try {
    const data = await getRepayments(selectedOrderId.value);
    planRows.value = data.repaymentPlan ?? [];
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载还款计划失败');
  }
}

async function onSelect() {
  await loadPlan();
}

async function markPaid(period: number) {
  try {
    await markPeriodPaid(selectedOrderId.value, period);
    Message.success('已标记');
    await loadPlan();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
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
