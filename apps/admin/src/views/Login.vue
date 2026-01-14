<template>
  <div class="page">
    <div class="card">
      <div class="title">后台登录</div>
      <a-form :model="form" layout="vertical" @submit="onSubmit">
        <a-form-item field="username" label="用户名">
          <a-input v-model="form.username" placeholder="admin" />
        </a-form-item>
        <a-form-item field="password" label="密码">
          <a-input-password v-model="form.password" placeholder="admin123" />
        </a-form-item>
        <a-button type="primary" long html-type="submit" :loading="loading">登录</a-button>
        <div class="hint">开发账号：admin / admin123</div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { adminLogin } from '@/services/api';
import { setAdminToken } from '@/services/auth';

const router = useRouter();
const loading = ref(false);
const form = reactive({ username: 'admin', password: 'admin123' });

async function onSubmit() {
  loading.value = true;
  try {
    const res = await adminLogin(form.username, form.password);
    setAdminToken(res.token);
    Message.success('登录成功');
    await router.replace('/dashboard');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
}
.card {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}
.hint {
  color: #999;
  font-size: 12px;
  margin-top: 12px;
}
</style>

