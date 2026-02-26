<template>
  <a-layout class="admin-layout">
    <a-layout-sider class="admin-sider" :width="180">
      <div class="brand">
        <div class="brand-badge">EV</div>
        <div>
          <div class="brand-title">电动车租赁</div>
          <div class="brand-subtitle">分期管理平台</div>
        </div>
      </div>
      <a-menu class="admin-menu" :selected-keys="[activeKey]" @menu-item-click="onMenuClick">
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <template #icon>
            <component :is="item.icon" />
          </template>
          {{ item.label }}
        </a-menu-item>
      </a-menu>
      <div class="sider-footer">
        <span class="status-dot" />
        在线运行
      </div>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="admin-header">
        <div>
          <div class="header-title">{{ currentTitle }}</div>
          <div class="header-subtitle">平台管理控制台</div>
        </div>
        <div class="header-right">
          <a-avatar size="24" style="background: #e5ebfe; color: #266eff">A</a-avatar>
          <span>管理员</span>
          <a-button type="text" @click="logout">退出登录</a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="admin-content">
        <div class="content-inner">
          <RouterView />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconHome,
  IconApps,
  IconArchive,
  IconList,
  IconCheckCircle,
  IconNotification,
  IconExclamationCircle,
  IconStop
} from '@arco-design/web-vue/es/icon';
import { clearAdminToken } from '@/services/auth';

const route = useRoute();
const router = useRouter();
const activeKey = computed(() => route.path);

const menuItems = [
  { key: '/dashboard', label: '首页概览', icon: IconHome },
  { key: '/categories', label: '分类管理', icon: IconApps },
  { key: '/products', label: '商品管理', icon: IconArchive },
  { key: '/orders', label: '订单管理', icon: IconList },
  { key: '/contracts', label: '合同管理', icon: IconArchive },
  { key: '/repayments', label: '还款管理', icon: IconCheckCircle },
  { key: '/reminders', label: '提醒与短信', icon: IconNotification },
  { key: '/overdue', label: '逾期分层', icon: IconExclamationCircle },
  { key: '/blacklist', label: '黑名单', icon: IconStop }
];

const currentTitle = computed(() => {
  const item = menuItems.find((entry) => entry.key === route.path);
  return item?.label ?? '平台管理';
});

function onMenuClick(key: string) {
  router.push(key);
}

function logout() {
  clearAdminToken();
  router.replace('/login');
}
</script>
