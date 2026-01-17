<template>
  <a-layout style="height: 100vh">
    <a-layout-sider :width="220" collapsible>
      <div class="logo">电动车租赁分期</div>
      <a-menu :selected-keys="[activeKey]" @menu-item-click="onMenuClick">
        <a-menu-item key="/dashboard">仪表盘</a-menu-item>
        <a-menu-item key="/categories">分类管理</a-menu-item>
        <a-menu-item key="/products">商品管理</a-menu-item>
        <a-menu-item key="/orders">订单管理</a-menu-item>
        <a-menu-item key="/repayments">还款管理</a-menu-item>
        <a-menu-item key="/reminders">提醒与短信</a-menu-item>
        <a-menu-item key="/overdue">逾期分层</a-menu-item>
        <a-menu-item key="/blacklist">黑名单</a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <div />
        <a-button type="text" @click="logout">退出</a-button>
      </a-layout-header>
      <a-layout-content class="content">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clearAdminToken } from '@/services/auth';

const route = useRoute();
const router = useRouter();
const activeKey = computed(() => route.path);

function onMenuClick(key: string) {
  router.push(key);
}

function logout() {
  clearAdminToken();
  router.replace('/login');
}
</script>

<style scoped>
.logo {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #fff;
  font-weight: 600;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.content {
  padding: 16px;
  background: #f2f3f5;
  overflow: auto;
}
</style>
