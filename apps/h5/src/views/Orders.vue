<template>
  <div class="page">
    <van-nav-bar title="我的订单" />
    <van-pull-refresh v-model="refreshing" @refresh="load">
      <van-list v-model:loading="loading" :finished="true" finished-text="没有更多了">
        <div v-for="o in orders" :key="o.id" class="order-item" @click="go(o.id)">
          <van-cell :title="o.productName" is-link>
            <template #label>
              <div class="order-info">
                <span>{{ statusText(o.status) }} · {{ o.periods }}期 · {{ o.cycleDays }}天/期</span>
              </div>
              <van-tag v-if="!o.kycCompleted" type="warning" style="margin-top: 4px">
                待补充资料
              </van-tag>
            </template>
          </van-cell>
        </div>
      </van-list>
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
.page {
  padding-bottom: 60px;
}
</style>
