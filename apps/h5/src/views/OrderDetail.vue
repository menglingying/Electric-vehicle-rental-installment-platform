<template>
  <div class="page">
    <van-nav-bar title="订单详情" left-arrow @click-left="router.back()" />
    <div class="card" v-if="order">
      <div class="title">{{ order.productName }}</div>
      <div class="sub">状态：{{ statusText(order.status) }}</div>
      <div class="sub">期数：{{ order.periods }}，周期：{{ order.cycleDays }} 天/期</div>
      <div class="sub" v-if="order.batteryOption">电池配置：{{ batteryOptionText(order.batteryOption) }}</div>
      <div class="sub" v-if="order.repaymentMethod">还款方式：{{ repaymentMethodText(order.repaymentMethod) }}</div>
      <div class="sub">创建时间：{{ order.createdAt }}</div>
      <div class="sub" v-if="order.approvedAt">审核通过：{{ order.approvedAt }}</div>
      <div class="sub" v-if="order.deliveredAt">交付时间：{{ order.deliveredAt }}</div>
      <div class="sub" v-if="order.pickedUpAt">取车时间：{{ order.pickedUpAt }}</div>
      <div class="sub" v-if="order.returnedAt">归还时间：{{ order.returnedAt }}</div>
      <div class="sub" v-if="order.settledAt">结清时间：{{ order.settledAt }}</div>
    </div>

    <!-- KYC状态提示 -->
    <div class="card kyc-card" v-if="shouldShowKycPrompt">
      <div class="title">资料待补充</div>
      <div class="sub">请尽快完成实名认证，以便订单进入审核流程</div>
      <van-button type="primary" size="small" style="margin-top: 8px" @click="goToKyc">
        去补充资料
      </van-button>
    </div>
    <div class="card kyc-card" v-else-if="shouldShowKycBlocked">
      <div class="title">资料未完成</div>
      <div class="sub">{{ kycBlockedReason }}</div>
    </div>
    <div class="card kyc-done" v-else-if="order && order.kycCompleted">
      <div class="title">✓ 资料已提交</div>
      <div class="sub" v-if="order.realName">姓名：{{ order.realName }}</div>
    </div>
    <div class="card" v-if="order">
      <div class="title">合同</div>
      <div class="sub">状态：{{ contractStatusText(order.contract?.status) }}</div>
      <div v-if="canStartContract" style="padding-top: 12px; display: flex; gap: 12px">
        <van-button type="primary" block :loading="contractLoading" @click="onStartContract">
          发起电子签（预留）
        </van-button>
      </div>
      <div v-else class="sub muted" style="margin-top: 8px">{{ contractBlockedReason }}</div>
    </div>
    <div class="card" v-if="order">
      <div class="title">收款（预留 H5 收银台）</div>
      <div class="sub">一期仅预留接口，实际对接第三方收银台后启用。</div>
      <div v-if="canStartPayment" style="padding-top: 12px; display: flex; gap: 12px">
        <van-button type="default" block :loading="paymentLoading" @click="onStartPayment">
          打开收银台（预留）
        </van-button>
      </div>
      <div v-else class="sub muted" style="margin-top: 8px">{{ paymentBlockedReason }}</div>
    </div>
    <div class="card" v-if="order?.repaymentPlan">
      <div class="title">租金计划（明细）</div>
      <van-cell
        v-for="(p, idx) in order.repaymentPlan"
        :key="idx"
        :title="`第${p.period}期`"
        :label="`应还日：${p.dueDate} · ${p.paid ? '已还' : '未还'}`"
        :value="`￥${p.amount}`"
      />
      <div class="hint">押金用于抵扣，H5 不单独展示为明细。</div>
    </div>
    <div class="card" v-if="order?.repaymentRecords?.length">
      <div class="title">还款记录</div>
      <van-cell
        v-for="(r, idx) in order.repaymentRecords"
        :key="idx"
        :title="`第${r.period}期`"
        :label="`时间：${r.paidAt}`"
        :value="`￥${r.amount}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, startContract, startPayment } from '@/services/api';

const route = useRoute();
const router = useRouter();
const order = ref<any>(null);
const contractLoading = ref(false);
const paymentLoading = ref(false);
const loading = ref(false);
const contractAllowedStatuses = new Set(['ACTIVE', 'DELIVERED', 'IN_USE', 'RETURNED']);
const paymentAllowedStatuses = new Set(['ACTIVE', 'DELIVERED', 'IN_USE', 'RETURNED']);
const shouldShowKycPrompt = computed(() => {
  return !!order.value && !order.value.kycCompleted && order.value.status === 'PENDING_REVIEW';
});
const shouldShowKycBlocked = computed(() => {
  return !!order.value && !order.value.kycCompleted && order.value.status !== 'PENDING_REVIEW';
});
const kycBlockedReason = computed(() => {
  if (!order.value) return '';
  if (order.value.status === 'REJECTED') return '订单已驳回，暂不支持补充资料';
  if (order.value.status === 'CLOSED') return '订单已关闭，暂不支持补充资料';
  if (order.value.status === 'SETTLED') return '订单已结清，暂不支持补充资料';
  if (order.value.status === 'ACTIVE' || order.value.status === 'DELIVERED' || order.value.status === 'IN_USE' || order.value.status === 'RETURNED') {
    return '订单已进入履约流程，暂不支持补充资料';
  }
  return '';
});
const canStartContract = computed(() => {
  return !!order.value && contractAllowedStatuses.has(order.value.status);
});
const canStartPayment = computed(() => {
  return !!order.value && paymentAllowedStatuses.has(order.value.status);
});
const contractBlockedReason = computed(() => {
  return buildBlockedReason(order.value?.status, '合同');
});
const paymentBlockedReason = computed(() => {
  return buildBlockedReason(order.value?.status, '收款');
});

function buildBlockedReason(status: string | undefined, target: string) {
  if (!status) return '';
  if (status === 'PENDING_REVIEW') return `订单待审核，暂不支持发起${target}`;
  if (status === 'REJECTED') return `订单已驳回，暂不支持发起${target}`;
  if (status === 'CLOSED') return `订单已关闭，暂不支持发起${target}`;
  if (status === 'SETTLED') return `订单已结清，无需发起${target}`;
  return `当前状态暂不支持发起${target}`;
}

function statusText(status: string) {
  switch (status) {
    case 'PENDING_REVIEW':
      return '待审核';
    case 'ACTIVE':
      return '待交付';
    case 'DELIVERED':
      return '已交付';
    case 'IN_USE':
      return '租赁中';
    case 'RETURNED':
      return '已归还';
    case 'SETTLED':
      return '已结清';
    case 'REJECTED':
      return '已驳回';
    case 'CLOSED':
      return '已关闭';
    default:
      return status;
  }
}

function contractStatusText(status?: string) {
  if (!status) return '未发起';
  if (status === 'SIGNING') return '签署中';
  if (status === 'SIGNED') return '已签署';
  if (status === 'FAILED') return '失败';
  return status;
}

function batteryOptionText(option?: string) {
  if (option === 'WITHOUT_BATTERY') return '空车';
  if (option === 'WITH_BATTERY') return '含电池';
  return option || '-';
}

function repaymentMethodText(method?: string) {
  if (method === 'AUTO_DEDUCT') return '自动扣款';
  if (method === 'MANUAL_TRANSFER') return '手动转账';
  if (method === 'OFFLINE') return '线下收款';
  return method || '-';
}

function goToKyc() {
  router.push(`/orders/${order.value?.id}/kyc`);
}

async function onStartContract() {
  if (!order.value) return;
  contractLoading.value = true;
  try {
    const c = await startContract(order.value.id);
    showSuccessToast('已生成签署链接（预留）');
    // 预留：对接真实供应商后跳转签署页
    window.open(c.signUrl, '_blank');
    await load();
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '发起失败');
  } finally {
    contractLoading.value = false;
  }
}

async function onStartPayment() {
  if (!order.value) return;
  paymentLoading.value = true;
  try {
    const pay = await startPayment(order.value.id);
    showSuccessToast('已生成收银台链接（预留）');
    window.open(pay.cashierUrl, '_blank');
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '操作失败');
  } finally {
    paymentLoading.value = false;
  }
}

async function load(options?: { bypassCache?: boolean }) {
  if (loading.value) return;
  loading.value = true;
  try {
    order.value = await getOrder(String(route.params.id), options);
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '加载失败');
  } finally {
    loading.value = false;
  }
}

function refreshIfVisible() {
  if (document.visibilityState === 'visible') {
    void load({ bypassCache: true });
  }
}

onMounted(() => {
  void load({ bypassCache: true });
  document.addEventListener('visibilitychange', refreshIfVisible);
  window.addEventListener('focus', refreshIfVisible);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', refreshIfVisible);
  window.removeEventListener('focus', refreshIfVisible);
});

watch(
  () => route.params.id,
  (next, prev) => {
    if (next && next !== prev) {
      void load({ bypassCache: true });
    }
  }
);
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
.title {
  font-weight: 600;
}
.sub {
  color: #666;
  margin-top: 6px;
}
.muted {
  color: #999;
}
.hint {
  color: #999;
  font-size: 12px;
  padding-top: 8px;
}
.kyc-card {
  background: #fff7e6;
  border: 1px solid #ffd591;
}
.kyc-done {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}
</style>
