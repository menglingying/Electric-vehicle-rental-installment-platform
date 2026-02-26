<template>
  <div class="page">
    <van-nav-bar title="我的订单" />
    <van-pull-refresh v-model="refreshing" @refresh="load">
      <div v-if="loading" class="empty-text">
        <van-loading size="20px" />
      </div>
      <div v-else-if="orders.length === 0" class="empty-text">暂无订单</div>
      <div v-else>
        <div v-for="o in orders" :key="o.id" class="h5-card order-card" @click="go(o.id)">
          <div class="order-title">{{ o.productName }}</div>
          <div class="order-sub">{{ statusText(o.status) }} · {{ o.periods }}期 · {{ o.cycleDays }}天/期</div>
          <div class="order-sub">创建时间：{{ o.createdAt }}</div>
          <van-tag v-if="!o.kycCompleted" type="warning" style="margin-top: 6px">待补充资料</van-tag>
        </div>
      </div>
    </van-pull-refresh>
    <van-tabbar route>
      <van-tabbar-item replace to="/products" icon="shop-o">商品</van-tabbar-item>
      <van-tabbar-item replace to="/orders" icon="orders-o">订单</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { listOrders, type Order } from '@/services/api';

const router = useRouter();
const orders = ref<Order[]>([]);
const loading = ref(false);
const refreshing = ref(false);

function statusText(status: Order['status']) {
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

async function load() {
  loading.value = true;
  try {
    orders.value = await listOrders();
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function go(id: string) {
  router.push(`/orders/${id}`);
}

onMounted(load);
</script>

<style scoped>
.order-card {
  cursor: pointer;
}
.order-title {
  font-size: 15px;
  font-weight: 600;
}
.order-sub {
  margin-top: 6px;
  color: var(--h5-muted);
  font-size: 12px;
}
</style>
