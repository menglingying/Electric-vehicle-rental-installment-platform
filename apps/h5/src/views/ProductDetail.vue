<template>
  <div class="page">
    <van-nav-bar title="商品详情" left-arrow @click-left="router.back()" />

    <div class="h5-card" v-if="product">
      <div v-if="galleryImages.length" class="gallery">
        <van-swipe :autoplay="3500" lazy-render>
          <van-swipe-item v-for="(url, idx) in galleryImages" :key="url + idx">
            <van-image :src="url" width="100%" height="220" fit="cover" />
          </van-swipe-item>
        </van-swipe>
      </div>
      <div class="section-title" style="margin-top: 8px">{{ product.brand ? product.brand + ' ' + product.name : product.name }}</div>
      <div class="price-line">¥{{ currentRent }}<span>/期</span></div>
      <div v-if="product.frameConfig" class="detail-line">车架：{{ product.frameConfig }}</div>
    </div>

    <div class="h5-card" v-if="product && hasBatteryOptions">
      <div class="section-title">电池配置</div>
      <van-radio-group v-model="batteryOption" direction="horizontal">
        <van-radio name="WITHOUT_BATTERY">空车 (¥{{ product.rentWithoutBattery || product.rentPerCycle }}/期)</van-radio>
        <van-radio name="WITH_BATTERY">含电池 (¥{{ product.rentWithBattery || product.rentPerCycle }}/期)</van-radio>
      </van-radio-group>
    </div>

    <div class="h5-card" v-if="product">
      <div class="section-title">分期与还款</div>
      <div class="period-selector">
        <van-button
          v-for="p in periodOptions"
          :key="p"
          :type="periods === p ? 'primary' : 'default'"
          size="small"
          @click="periods = p"
        >
          {{ p }}期
        </van-button>
      </div>
      <div class="form-row">
        <van-field v-model.number="cycleDays" type="digit" label="周期(天)" placeholder="例如 30" />
      </div>
      <div class="form-row">
        <van-field v-model.number="depositRatioPercent" type="digit" label="押金比例(%)" placeholder="例如 25" />
      </div>
      <div class="form-row">
        <div class="section-title" style="margin-bottom: 6px">还款方式</div>
        <van-radio-group v-model="repaymentMethod" direction="horizontal">
          <van-radio name="AUTO_DEDUCT">自动扣款</van-radio>
          <van-radio name="MANUAL_TRANSFER">手动转账</van-radio>
          <van-radio name="OFFLINE">线下收款</van-radio>
        </van-radio-group>
      </div>
    </div>

    <div class="h5-card" v-if="product && repaymentPlan.length">
      <div class="section-title">还款计划预览</div>
      <div class="plan-summary">
        <div class="summary-item">
          <span class="label">每期应还</span>
          <span class="value">¥{{ currentRent }}</span>
        </div>
        <div class="summary-item">
          <span class="label">分期总额</span>
          <span class="value">¥{{ totalAmount }}</span>
        </div>
        <div class="summary-item" v-if="depositAmount > 0">
          <span class="label">押金</span>
          <span class="value">¥{{ depositAmount }}</span>
        </div>
      </div>
      <van-collapse v-model="planExpanded">
        <van-collapse-item title="查看详细还款计划" name="plan">
          <div class="plan-list">
            <div v-for="item in repaymentPlan" :key="item.period" class="plan-item">
              <span class="period">第{{ item.period }}期</span>
              <span class="date">{{ item.dueDate }}</span>
              <span class="amount">¥{{ item.amount }}</span>
            </div>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>

    <div class="h5-card" v-if="product">
      <div class="detail-line">订单创建后进入人工审核流程。</div>
    </div>

    <van-action-bar>
      <van-action-bar-button type="primary" :loading="submitting" @click="submit">提交下单</van-action-bar-button>
    </van-action-bar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { createOrder, getProduct, type Product } from '@/services/api';

const route = useRoute();
const router = useRouter();
const product = ref<Product | null>(null);

const periodOptions = [3, 6, 9, 12, 18, 24];
const periods = ref(12);
const cycleDays = ref(30);
const depositRatioPercent = ref(25);
const batteryOption = ref<'WITHOUT_BATTERY' | 'WITH_BATTERY'>('WITHOUT_BATTERY');
const repaymentMethod = ref<'AUTO_DEDUCT' | 'MANUAL_TRANSFER' | 'OFFLINE'>('MANUAL_TRANSFER');
const submitting = ref(false);
const planExpanded = ref<string[]>([]);

const hasBatteryOptions = computed(() => {
  if (!product.value) return false;
  return product.value.rentWithoutBattery != null || product.value.rentWithBattery != null;
});

const currentRent = computed(() => {
  if (!product.value) return 0;
  if (batteryOption.value === 'WITH_BATTERY' && product.value.rentWithBattery != null) {
    return product.value.rentWithBattery;
  }
  if (batteryOption.value === 'WITHOUT_BATTERY' && product.value.rentWithoutBattery != null) {
    return product.value.rentWithoutBattery;
  }
  return product.value.rentPerCycle;
});

const depositAmount = computed(() => {
  return Math.round((currentRent.value * periods.value * depositRatioPercent.value) / 100);
});

const totalAmount = computed(() => {
  return currentRent.value * periods.value;
});

const repaymentPlan = computed(() => {
  if (!product.value) return [];
  const plan: { period: number; dueDate: string; amount: number }[] = [];
  const today = new Date();

  for (let i = 1; i <= periods.value; i++) {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + cycleDays.value * i);
    plan.push({
      period: i,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: currentRent.value
    });
  }

  if (depositRatioPercent.value > 0) {
    let remaining = depositAmount.value;
    for (let i = plan.length - 1; i >= 0 && remaining > 0; i--) {
      const offset = Math.min(plan[i].amount, remaining);
      plan[i].amount -= offset;
      remaining -= offset;
    }
  }

  return plan;
});

const galleryImages = computed(() => {
  if (!product.value) return [];
  const imgs = (product.value.images ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (imgs.length) return imgs;
  return product.value.coverUrl ? [product.value.coverUrl] : [];
});

async function load() {
  try {
    product.value = await getProduct(String(route.params.id));
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '加载失败');
  }
}

async function submit() {
  if (!product.value) return;
  submitting.value = true;
  try {
    const order = await createOrder({
      productId: product.value.id,
      periods: periods.value,
      cycleDays: cycleDays.value,
      depositRatio: depositRatioPercent.value / 100,
      batteryOption: batteryOption.value,
      repaymentMethod: repaymentMethod.value
    });
    showSuccessToast('下单成功');
    await router.replace(`/orders/${order.id}/kyc`);
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '下单失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.gallery {
  overflow: hidden;
  border-radius: 12px;
}
.price-line {
  font-size: 20px;
  font-weight: 700;
  color: var(--h5-danger);
}
.price-line span {
  font-size: 12px;
  font-weight: 400;
  margin-left: 2px;
  color: var(--h5-muted);
}
.detail-line {
  margin-top: 6px;
  color: var(--h5-muted);
  font-size: 12px;
}
.period-selector {
  display: flex;
  gap: 8px;
  padding: 8px 0 12px;
  flex-wrap: wrap;
}
.form-row {
  margin-top: 8px;
}
.plan-summary {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  background: #f3f6ff;
  border-radius: 10px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.summary-item .label {
  font-size: 12px;
  color: var(--h5-muted);
}
.summary-item .value {
  font-size: 16px;
  font-weight: bold;
  color: var(--h5-primary);
}
.plan-list {
  padding: 8px 0;
}
.plan-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--h5-border);
}
.plan-item:last-child {
  border-bottom: none;
}
.plan-item .period {
  width: 60px;
  color: var(--h5-muted);
}
.plan-item .date {
  flex: 1;
  text-align: center;
  color: var(--h5-muted);
}
.plan-item .amount {
  width: 80px;
  text-align: right;
  font-weight: bold;
}
</style>
