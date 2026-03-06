<template>
  <div class="panel">
    <div class="panel-title">
      <div>黑名单</div>
      <span class="link">禁止下单名单</span>
    </div>
    <div class="section-toolbar">
      <a-input v-model="phone" placeholder="手机号" style="width: 200px" />
      <a-input v-model="reason" placeholder="原因" style="width: 260px" />
      <a-button type="primary" @click="add">加入黑名单</a-button>
    </div>
    <div class="table-wrap">
      <a-table :data="rows" :pagination="false">
        <a-table-column title="手机号" data-index="phone" />
        <a-table-column title="原因" data-index="reason" />
        <a-table-column title="创建时间" data-index="createdAt" />
        <a-table-column
          title="操作"
          :render="({ record }: any) =>
            isSuper()
              ? h(Button, { status: 'danger', size: 'small', onClick: () => remove(record.phone) }, () => '移除')
              : null
          "
        />
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
import { addBlacklist, listBlacklist, removeBlacklist } from '@/services/api';
import { isSuper } from '@/services/auth';

const rows = ref<{ phone: string; reason: string; createdAt: string }[]>([]);
const phone = ref('');
const reason = ref('');

async function load() {
  try {
    rows.value = await listBlacklist();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

async function add() {
  if (!phone.value) return Message.warning('请输入手机号');
  try {
    await addBlacklist(phone.value, reason.value || '风险客户');
    phone.value = '';
    reason.value = '';
    Message.success('已加入');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function remove(p: string) {
  try {
    await removeBlacklist(p);
    Message.success('已移除');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

onMounted(load);
</script>
