<template>
  <div class="page">
    <van-nav-bar title="订单详情" left-arrow @click-left="router.back()" />

    <div class="h5-card" v-if="order">
      <div class="section-title">{{ order.productName }}</div>
      <div class="detail-line">状态：{{ statusText(order.status) }}</div>
      <div class="detail-line">期数：{{ order.periods }}，周期：{{ order.cycleDays }} 天/期</div>
      <div class="detail-line" v-if="order.batteryOption">电池配置：{{ batteryOptionText(order.batteryOption) }}</div>
      <div class="detail-line" v-if="order.repaymentMethod">还款方式：{{ repaymentMethodText(order.repaymentMethod) }}</div>
      <div class="detail-line">创建时间：{{ order.createdAt }}</div>
      <van-button
        v-if="order.status === 'PENDING_REVIEW'"
        type="warning"
        size="small"
        plain
        style="margin-top: 10px"
        @click="router.push(`/orders/${order.id}/edit`)"
      >修改订单</van-button>
      <div class="detail-line" v-if="order.approvedAt">审核通过：{{ order.approvedAt }}</div>
      <div class="detail-line" v-if="order.deliveredAt">交付时间：{{ order.deliveredAt }}</div>
      <div class="detail-line" v-if="order.pickedUpAt">取车时间：{{ order.pickedUpAt }}</div>
      <div class="detail-line" v-if="order.returnedAt">归还时间：{{ order.returnedAt }}</div>
      <div class="detail-line" v-if="order.settledAt">结清时间：{{ order.settledAt }}</div>
    </div>

    <div class="h5-card" v-if="shouldShowKycPrompt">
      <div class="section-title">资料待补充</div>
      <div class="detail-line">请尽快完成实名认证，以便订单进入审核流程。</div>
      <van-button type="primary" size="small" style="margin-top: 8px" @click="goToKyc">去补充资料</van-button>
    </div>
    <div class="h5-card" v-else-if="shouldShowKycBlocked">
      <div class="section-title">资料未完成</div>
      <div class="detail-line">{{ kycBlockedReason }}</div>
    </div>
    <div class="h5-card" v-else-if="order && order.kycCompleted">
      <div class="section-title">已提交资料</div>
      <div class="detail-line" v-if="order.realName">姓名：{{ order.realName }}</div>
    </div>

    <div class="h5-card" v-if="order && order.kycCompleted">
      <div class="section-title">爱签实名认证</div>
      <div class="detail-line">状态：{{ order.asignSerialNo ? '已完成' : '未完成' }}</div>
      <div v-if="!order.asignSerialNo" style="margin-top: 8px">
        <van-button type="primary" block :loading="asignLoading" @click="onStartAsignAuth">去实名认证</van-button>
      </div>
    </div>

    <div class="h5-card" v-if="order">
      <div class="section-title">合同</div>
      <div class="detail-line">状态：{{ contractStatusText(order.contract?.status, order.contract?.contractType) }}</div>
      <div class="detail-line" v-if="order.contract?.contractNo">合同编号：{{ order.contract.contractNo }}</div>
      <div class="detail-line" v-if="order.contract?.signedAt">签署时间：{{ order.contract.signedAt }}</div>
      <div v-if="contractHint" class="detail-line">{{ contractHint }}</div>
      <div style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap">
        <van-button v-if="canSignContract" type="primary" block @click="onOpenSignUrl">去签署</van-button>
        <van-button v-if="contractFileUrl" type="primary" block @click="onOpenContractFile">查看合同</van-button>
        <van-button
          v-if="order.contract?.status === 'SIGNING'"
          type="default"
          size="small"
          :loading="contractSyncLoading"
          @click="onSyncContract"
        >刷新合同状态</van-button>
      </div>
    </div>

    <div class="h5-card" v-if="order">
      <div class="section-title">公证</div>
      <div class="detail-line">状态：{{ notaryStatusText(order.notaryStatus) }}</div>
      <div class="detail-line" v-if="order.notaryOrderNo">公证单号：{{ order.notaryOrderNo }}</div>
      <div class="detail-line" v-if="order.notaryName">公证员：{{ order.notaryName }}</div>
      <div class="detail-line" v-if="order.notaryCertifiedTime">出证时间：{{ order.notaryCertifiedTime }}</div>
      <div v-if="canSignNotary" style="margin-top: 8px">
        <van-button type="primary" block :loading="notarySignLoading" @click="onSignNotary">去签署公证</van-button>
        <div class="detail-line" style="color: #ff976a; margin-top: 4px">请点击上方按钮完成公证文件签署</div>
      </div>
      <div v-if="order.notaryCertUrl" style="margin-top: 8px">
        <van-button type="default" block @click="onOpenNotaryCert">下载公证证书</van-button>
      </div>
    </div>

    <div class="h5-card" v-if="order">
      <div class="section-title">收款（预留H5收银台）</div>
      <div class="detail-line">一期仅预留接口，实际对接后启用。</div>
      <div v-if="canStartPayment" style="margin-top: 8px; display: flex; gap: 12px">
        <van-button type="default" block :loading="paymentLoading" @click="onStartPayment">打开收银台</van-button>
      </div>
      <div v-else class="detail-line">{{ paymentBlockedReason }}</div>
    </div>

    <div class="h5-card" v-if="order?.repaymentPlan">
      <div class="section-title">租金计划（明细）</div>
      <van-cell
        v-for="(p, idx) in order.repaymentPlan"
        :key="idx"
        :title="`第${p.period}期`"
        :label="`应还日：${p.dueDate} · ${p.paid ? '已还' : '未还'}`"
        :value="`¥${p.amount}`"
      />
      <div class="detail-line">押金用于抵扣，H5 不单独展示为明细。</div>
    </div>

    <div class="h5-card" v-if="order?.repaymentRecords?.length">
      <div class="section-title">还款记录</div>
      <van-cell
        v-for="(r, idx) in order.repaymentRecords"
        :key="idx"
        :title="`第${r.period}期`"
        :label="`时间：${r.paidAt}`"
        :value="`¥${r.amount}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, startAsignAuth, startPayment, getNotarySignUrl, syncContractStatus } from '@/services/api';

const route = useRoute();
const router = useRouter();
const order = ref<any>(null);
const paymentLoading = ref(false);
const asignLoading = ref(false);
const notarySignLoading = ref(false);
const contractSyncLoading = ref(false);
const loading = ref(false);
const paymentAllowedStatuses = new Set(['ACTIVE', 'DELIVERED', 'IN_USE', 'RETURNED']);
const shouldShowKycPrompt = computed(() => !!order.value && !order.value.kycCompleted && order.value.status === 'PENDING_REVIEW');
const shouldShowKycBlocked = computed(() => !!order.value && !order.value.kycCompleted && order.value.status !== 'PENDING_REVIEW');
const kycBlockedReason = computed(() => {
  if (!order.value) return '';
  if (order.value.status === 'REJECTED') return '订单已驳回，暂不支持补充资料';
  if (order.value.status === 'CLOSED') return '订单已关闭，暂不支持补充资料';
  if (order.value.status === 'SETTLED') return '订单已结清，暂不支持补充资料';
  if (
    order.value.status === 'ACTIVE' ||
    order.value.status === 'DELIVERED' ||
    order.value.status === 'IN_USE' ||
    order.value.status === 'RETURNED'
  ) {
    return '订单已进入履约流程，暂不支持补充资料';
  }
  return '';
});
const canSignContract = computed(() => {
  if (!order.value?.contract) return false;
  return order.value.contract.status === 'SIGNING' && !!order.value.contract.signUrl;
});
const contractFileUrl = computed(() => order.value?.contract?.fileUrl);
const contractHint = computed(() => {
  if (!order.value) return '';
  if (!order.value.contract) return '合同待生成（审核通过后生成）';
  if (order.value.contract.status === 'SIGNING' && !order.value.contract.signUrl) {
    return '签署链接待生成，请联系平台';
  }
  if (order.value.contract.status === 'SIGNED') return '合同已签署';
  if (order.value.contract.status === 'VOID') return '合同已作废';
  if (order.value.contract.contractType === 'MANUAL') return '历史合同已录入';
  return '';
});
const canStartPayment = computed(() => !!order.value && paymentAllowedStatuses.has(order.value.status));
const paymentBlockedReason = computed(() => buildBlockedReason(order.value?.status, '收款'));
// 状态20=申办中时，可以签署公证
const canSignNotary = computed(() => !!order.value && order.value.notaryStatus === '20');

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

function contractStatusText(status?: string, type?: string) {
  if (type === 'MANUAL') return '历史合同';
  if (!status) return '未发起';
  if (status === 'SIGNING') return '签署中';
  if (status === 'SIGNED') return '已签署';
  if (status === 'FAILED') return '失败';
  if (status === 'VOID') return '已作废';
  return status;
}

function notaryStatusText(status?: string) {
  if (!status) return '未发起';
  if (status === '10') return '预审中';
  if (status === '11') return '预审不通过';
  if (status === '20') return '申办中';
  if (status === '21') return '申办终止';
  if (status === '22') return '申办成功';
  if (status === '23') return '申办完结';
  if (status === '31') return '受理中';
  if (status === '33') return '已出证';
  if (status === '34') return '异常终止';
  if (status === 'FAILED') return '发起失败';
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

function onOpenSignUrl() {
  if (!order.value?.contract?.signUrl) return;
  window.open(order.value.contract.signUrl, '_blank');
}

function onOpenContractFile() {
  if (!order.value?.contract?.fileUrl) return;
  window.open(order.value.contract.fileUrl, '_blank');
}

function onOpenNotaryCert() {
  if (!order.value?.notaryCertUrl) return;
  window.open(order.value.notaryCertUrl, '_blank');
}

async function onSignNotary() {
  if (!order.value) return;
  notarySignLoading.value = true;
  try {
    const result = await getNotarySignUrl(order.value.id);
    if (!result.signUrl) {
      showFailToast('签署链接获取失败');
      return;
    }
    // 直接跳转到签署页面
    window.location.href = result.signUrl;
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '获取签署链接失败');
  } finally {
    notarySignLoading.value = false;
  }
}

async function onStartPayment() {
  if (!order.value) return;
  paymentLoading.value = true;
  try {
    const pay = await startPayment(order.value.id);
    showSuccessToast('已生成收银台链接');
    window.open(pay.cashierUrl, '_blank');
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '操作失败');
  } finally {
    paymentLoading.value = false;
  }
}

async function onSyncContract() {
  if (!order.value) return;
  contractSyncLoading.value = true;
  try {
    const result = await syncContractStatus(order.value.id);
    if (result.synced) {
      showSuccessToast('合同状态已更新');
      await load({ bypassCache: true });
    } else {
      showFailToast(result.reason ?? '合同暂无更新');
    }
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '同步失败');
  } finally {
    contractSyncLoading.value = false;
  }
}

async function onStartAsignAuth() {
  if (!order.value) return;
  asignLoading.value = true;
  try {
    const result = await startAsignAuth(order.value.id);
    if (!result.authUrl) {
      showFailToast('爱签认证链接获取失败');
      return;
    }
    showSuccessToast('已生成实名认证链接');
    window.open(result.authUrl, '_blank');
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '操作失败');
  } finally {
    asignLoading.value = false;
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

async function autoSyncContractIfNeeded() {
  if (order.value?.contract?.status === 'SIGNING' && order.value.contract.contractNo) {
    try {
      const result = await syncContractStatus(order.value.id);
      if (result.synced) {
        await load({ bypassCache: true });
      }
    } catch { /* ignore */ }
  }
}

function refreshIfVisible() {
  if (document.visibilityState === 'visible') {
    void load({ bypassCache: true }).then(() => autoSyncContractIfNeeded());
  }
}

onMounted(async () => {
  await load({ bypassCache: true });
  void autoSyncContractIfNeeded();
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
.detail-line {
  margin-top: 6px;
  color: var(--h5-muted);
  font-size: 12px;
}
</style>
