<template>
  <div class="page">
    <van-nav-bar title="手机号登录" />
    <div class="card">
      <van-form @submit="onSubmit">
        <van-field v-model="phone" name="phone" label="手机号" placeholder="请输入手机号" />
        <van-field v-model="code" name="code" label="验证码" placeholder="请输入验证码" />
        <div style="display: flex; gap: 12px; padding: 16px 0">
          <van-button block type="default" @click.prevent="onRequestCode">获取验证码</van-button>
          <van-button block type="primary" native-type="submit">登录</van-button>
        </div>
        <div class="hint">开发环境固定验证码：123456</div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { login, requestLoginCode } from '@/services/api';
import { setH5Token } from '@/services/auth';

const router = useRouter();
const phone = ref('');
const code = ref('');

async function onRequestCode() {
  try {
    await requestLoginCode(phone.value);
    showSuccessToast('已发送（dev 固定码：123456）');
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '获取验证码失败');
  }
}

async function onSubmit() {
  try {
    const res = await login(phone.value, code.value);
    setH5Token(res.token);
    showSuccessToast('登录成功');
    await router.replace('/products');
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '登录失败');
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.card {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}
.hint {
  color: #999;
  font-size: 12px;
  padding: 8px 0;
}
</style>

