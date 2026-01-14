<template>
  <a-card title="提醒与短信（预留）">
    <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center">
      <a-radio-group v-model="kind" type="button" @change="load">
        <a-radio value="all">全部（今天+3天后）</a-radio>
        <a-radio value="due_today">今天到期</a-radio>
        <a-radio value="due_soon">3天后到期</a-radio>
      </a-radio-group>
      <a-button @click="load">刷新</a-button>
      <a-button @click="exportSms">导出短信记录CSV</a-button>
    </div>

    <a-alert style="margin-bottom: 12px" type="warning">
      一期：短信接口仅“留口 + 记录发送”，不会真实下发；后续接入短信通道后替换实现即可。
    </a-alert>

    <a-table :data="rows" :pagination="false">
      <a-table-column title="订单" data-index="orderId" />
      <a-table-column title="手机号" data-index="phone" />
      <a-table-column title="商品" data-index="productName" />
      <a-table-column title="期次" data-index="period" />
      <a-table-column title="到期日" data-index="dueDate" />
      <a-table-column title="金额" :render="({ record }: any) => `￥${record.amount}`" />
      <a-table-column
        title="操作"
        :render="({ record }: any) =>
          h(Button, { type: 'primary', size: 'small', onClick: () => send(record) }, () => '发送短信(模拟)')
        "
      />
    </a-table>

    <a-divider />
    <a-card title="发送记录" :bordered="false">
      <a-table :data="records" :pagination="false" size="small">
        <a-table-column title="时间" data-index="createdAt" />
        <a-table-column title="手机号" data-index="phone" />
        <a-table-column title="内容" data-index="content" />
        <a-table-column title="状态" data-index="status" />
      </a-table>
    </a-card>
  </a-card>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Button, Divider, Message } from '@arco-design/web-vue';
import { listReminders, listSmsRecords, sendSms, type ReminderItem } from '@/services/api';
import { downloadCsv } from '@/services/download';

const kind = ref<'all' | 'due_today' | 'due_soon'>('all');
const rows = ref<ReminderItem[]>([]);
const records = ref<any[]>([]);

async function load() {
  try {
    rows.value = await listReminders(kind.value);
    records.value = await listSmsRecords();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

async function send(item: ReminderItem) {
  try {
    const content = `【还款提醒】订单${item.orderId} 第${item.period}期 ￥${item.amount} 到期日：${item.dueDate}`;
    await sendSms(item.phone, content);
    Message.success('已记录发送');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '发送失败');
  }
}

onMounted(load);

async function exportSms() {
  try {
    await downloadCsv('/admin/exports/sms.csv', 'sms.csv');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '导出失败');
  }
}
</script>
