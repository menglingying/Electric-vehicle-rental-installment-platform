<template>
  <div class="panel">
    <div class="panel-title">
      <div>逾期分层</div>
      <span class="link">逾期催收与分层</span>
    </div>
    <div class="section-toolbar">
      <a-radio-group v-model="tier" type="button" @change="load">
        <a-radio value="1-3">1-3天</a-radio>
        <a-radio value="3-10">3-10天</a-radio>
        <a-radio value="10-30">10-30天</a-radio>
        <a-radio value="30+">30天以上</a-radio>
        <a-radio value="all">全部</a-radio>
      </a-radio-group>
      <a-button @click="load">刷新</a-button>
      <a-button type="primary" :disabled="selectedRows.length === 0" @click="sendSelected">
        发送催收短信({{ selectedRows.length }})
      </a-button>
      <a-button @click="exportOverdue">导出逾期CSV</a-button>
    </div>

    <div class="table-wrap">
      <a-table
        :data="rows"
        :pagination="false"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedKeys"
        row-key="orderId"
      >
        <a-table-column title="订单" data-index="orderId" />
        <a-table-column title="手机号" data-index="phone" />
        <a-table-column title="商品" data-index="productName" />
        <a-table-column title="状态" data-index="status" />
        <a-table-column title="最大逾期天数" data-index="maxOverdueDays" />
        <a-table-column title="逾期期次">
          <template #cell="{ record }">
            <div style="display:flex; gap:6px; flex-wrap:wrap">
              <a-tag v-for="x in record.overduePeriods" :key="x.period" color="orangered">
                第{{ x.period }}期 {{ x.overdueDays }}天
              </a-tag>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="操作">
          <template #cell="{ record }">
            <a-button type="primary" size="small" @click="sendOne(record)">发送催收</a-button>
          </template>
        </a-table-column>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { listOverdue, sendOverdueSms, type OverdueSendItem } from '@/services/api';
import { downloadCsv } from '@/services/download';

const tier = ref<'1-3' | '3-10' | '10-30' | '30+' | 'all'>('1-3');
const rows = ref<any[]>([]);
const selectedKeys = ref<string[]>([]);

const selectedRows = computed(() => rows.value.filter((r) => selectedKeys.value.includes(r.orderId)));

async function load() {
  try {
    rows.value = await listOverdue(tier.value);
    selectedKeys.value = [];
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

function buildSendItems(record: any): OverdueSendItem[] {
  return (record.overduePeriods ?? []).map((p: any) => ({
    orderId: record.orderId,
    period: p.period,
    amount: p.amount,
    overdueDays: p.overdueDays
  }));
}

async function sendOne(record: any) {
  try {
    const items = buildSendItems(record);
    const result = await sendOverdueSms(items);
    if (result.success > 0) {
      Message.success(`催收短信发送成功：${result.success}条`);
    } else {
      Message.error('催收短信发送失败');
    }
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '发送失败');
  }
}

async function sendSelected() {
  if (selectedRows.value.length === 0) return;
  try {
    const items: OverdueSendItem[] = [];
    for (const record of selectedRows.value) {
      items.push(...buildSendItems(record));
    }
    const result = await sendOverdueSms(items);
    Message.success(`发送完成：成功 ${result.success}，失败 ${result.fail}`);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '发送失败');
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
