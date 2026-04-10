<template>
  <div class="panel">
    <div class="panel-title">
      <div>还款提醒</div>
      <span class="link">短信提醒与记录</span>
    </div>
    <div class="section-toolbar">
      <a-radio-group v-model="kind" type="button" @change="load">
        <a-radio value="all">全部（今天+3天）</a-radio>
        <a-radio value="due_today">今天到期</a-radio>
        <a-radio value="due_soon">3天后到期</a-radio>
      </a-radio-group>
      <a-button @click="load">刷新</a-button>
      <a-button type="primary" :disabled="selectedIds.length === 0" @click="sendSelected">
        发送短信({{ selectedIds.length }})
      </a-button>
      <a-button @click="exportSms">导出短信记录CSV</a-button>
    </div>

    <div class="table-wrap">
      <a-table
        :data="rows"
        :pagination="false"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        v-model:selectedKeys="selectedIds"
        row-key="id"
      >
        <a-table-column title="客户" data-index="realName" />
        <a-table-column title="手机号" data-index="phone" />
        <a-table-column title="商品" data-index="productName" />
        <a-table-column title="期次" data-index="period" />
        <a-table-column title="到期日期" data-index="dueDate" />
        <a-table-column title="金额" :render="({ record }: any) => `¥${record.amount}`" />
        <a-table-column title="操作">
          <template #cell="{ record }">
            <a-button type="primary" size="small" @click="sendOne(record)">发送短信</a-button>
          </template>
        </a-table-column>
      </a-table>
    </div>

    <a-divider />
    <div class="panel" style="padding: 16px">
      <div class="panel-title">
        <div>发送记录</div>
      </div>
      <div class="table-wrap">
        <a-table :data="records" :pagination="false" size="small">
          <a-table-column title="时间" data-index="createdAt" />
          <a-table-column title="手机号" data-index="phone" />
          <a-table-column title="内容" data-index="content" />
          <a-table-column title="状态" data-index="status" />
          <a-table-column title="类型" data-index="bizType" />
        </a-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { listReminders, listSmsRecords, sendReminderSms, type ReminderItem } from '@/services/api';
import { downloadCsv } from '@/services/download';

const kind = ref<'all' | 'due_today' | 'due_soon'>('all');
const rows = ref<ReminderItem[]>([]);
const records = ref<any[]>([]);
const selectedIds = ref<string[]>([]);

async function load() {
  try {
    rows.value = await listReminders(kind.value);
    records.value = await listSmsRecords();
    selectedIds.value = [];
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

async function sendOne(item: ReminderItem) {
  try {
    const result = await sendReminderSms([item.id]);
    if (result.success > 0) {
      Message.success('短信发送成功');
    } else {
      Message.error('短信发送失败');
    }
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '发送失败');
  }
}

async function sendSelected() {
  if (selectedIds.value.length === 0) return;
  try {
    const result = await sendReminderSms(selectedIds.value);
    Message.success(`发送完成：成功 ${result.success}，失败 ${result.fail}`);
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
