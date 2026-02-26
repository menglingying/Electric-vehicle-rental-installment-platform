<template>
  <div class="page">
    <van-nav-bar title="登录" />
    <div class="h5-card login-card">
      <div class="section-title">手机号登录</div>
      <van-form @submit="onSubmit">
        <van-field v-model="phone" name="phone" label="手机号" placeholder="请输入手机号" />
        <van-field v-model="code" name="code" label="验证码" placeholder="请输入验证码" />
        <div class="login-actions">
          <van-button
            block
            type="default"
            :disabled="countdown > 0 || !phone"
            @click.prevent="onRequestCode"
          >
            {{ countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码' }}
          </van-button>
          <van-button block type="primary" native-type="submit" :disabled="!phone || !code">登录</van-button>
        </div>
        <div v-if="devFixedCode" class="hint">开发环境固定验证码：{{ devFixedCode }}</div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { login, requestLoginCode } from '@/services/api';
import { setH5Token } from '@/services/auth';

const router = useRouter();
const route = useRoute();
const phone = ref('');
const code = ref('');
const countdown = ref(0);
const devFixedCode = ref('');

let timer: ReturnType<typeof setInterval> | null = null;

function startCountdown(seconds: number) {
  countdown.value = seconds;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

async function onRequestCode() {
  if (!phone.value) {
    showFailToast('请输入手机号');
    return;
  }
  try {
    const res = await requestLoginCode(phone.value);
    if (res.devFixedCode) {
      devFixedCode.value = res.devFixedCode;
      showSuccessToast(`已发送（dev固定码：${res.devFixedCode}）`);
    } else {
      devFixedCode.value = '';
      showSuccessToast('验证码已发送');
    }
    startCountdown(60);
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '获取验证码失败');
  }
}

async function onSubmit() {
  try {
    const res = await login(phone.value, code.value);
    setH5Token(res.token);
    showSuccessToast('登录成功');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
    const target = redirect.startsWith('/') ? redirect : '/products';
    await router.replace(target);
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '登录失败');
  }
}
</script>

<style scoped>
.login-card {
  margin-top: 12px;
}
.login-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px 0;
}
.hint {
  color: var(--h5-muted);
  font-size: 12px;
  padding: 4px 0;
}
</style>
