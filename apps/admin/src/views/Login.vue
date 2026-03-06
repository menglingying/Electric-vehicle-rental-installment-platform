<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="login-aside">
        <div class="aside-title">管理后台登录</div>
        <div class="aside-subtitle">支持扫码或账号密码登录</div>
        <div class="qr-box">扫码登录</div>
        <div class="login-hint">建议使用管理员账号登录进行配置</div>
      </div>
      <div class="login-panel">
        <div class="login-title">账号密码登录</div>
        <a-form :model="form" layout="vertical" @submit="onSubmit">
          <a-form-item field="username" label="用户名">
            <a-input v-model="form.username" placeholder="admin" />
          </a-form-item>
          <a-form-item field="password" label="密码">
            <a-input-password v-model="form.password" placeholder="admin123" />
          </a-form-item>
          <a-button type="primary" long html-type="submit" :loading="loading">登录</a-button>
          <div class="login-hint">总管理：admin/admin123 | 财务：finance/finance123 | 操作：operator/operator123</div>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { adminLogin } from '@/services/api';
import { setAdminToken, setAdminRole } from '@/services/auth';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const form = reactive({ username: 'admin', password: 'admin123' });

async function onSubmit() {
  loading.value = true;
  try {
    const res = await adminLogin(form.username, form.password);
    setAdminToken(res.token);
    setAdminRole(res.role || 'OPERATOR');
    Message.success('登录成功');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
    const target = redirect.startsWith('/') ? redirect : '/dashboard';
    await router.replace(target);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>
