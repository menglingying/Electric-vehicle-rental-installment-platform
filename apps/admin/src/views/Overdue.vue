<template>
  <a-card title="逾期分层">
    <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center">
      <a-radio-group v-model="tier" type="button" @change="load">
        <a-radio value="1-3">1-3天</a-radio>
        <a-radio value="3-10">3-10天</a-radio>
        <a-radio value="10-30">10-30天</a-radio>
        <a-radio value="30+">30天以上</a-radio>
        <a-radio value="all">全部</a-radio>
      </a-radio-group>
      <a-button @click="load">刷新</a-button>
      <a-button @click="exportOverdue">导出逾期CSV</a-button>
    </div>

    <a-table :data="rows" :pagination="false">
      <a-table-column title="订单" data-index="orderId" />
      <a-table-column title="手机号" data-index="phone" />
      <a-table-column title="商品" data-index="productName" />
      <a-table-column title="状态" data-index="status" />
      <a-table-column title="最大逾期天数" data-index="maxOverdueDays" />
      <a-table-column title="逾期期次" :render="renderOverduePeriods" />
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Message, Tag } from '@arco-design/web-vue';
import { listOverdue } from '@/services/api';
import { downloadCsv } from '@/services/download';

const tier = ref<'1-3' | '3-10' | '10-30' | '30+' | 'all'>('1-3');
const rows = ref<any[]>([]);

function renderOverduePeriods({ record }: any) {
  const items = record.overduePeriods ?? [];
  return h(
    'div',
    { style: 'display:flex; gap:6px; flex-wrap:wrap' },
    items.map((x: any) =>
      h(Tag, { color: 'orangered' }, () => `第${x.period}期 ${x.overdueDays}天`)
    )
  );
}

async function load() {
  try {
    rows.value = await listOverdue(tier.value);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

onMounted(load);

async function exportOverdue() {
  try {
    await downloadCsv('/admin/exports/overdue.csv', 'overdue.csv');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '导出失败');
  }
}
</script>
