<template>
  <div class="page">
    <van-nav-bar title="商品列表" />
    <van-pull-refresh v-model="refreshing" @refresh="load">
      <van-list v-model:loading="loading" :finished="true" finished-text="没有更多了">
        <van-cell
          v-for="p in products"
          :key="p.id"
          :title="p.name"
          :label="`租金/期：￥${p.rentPerCycle}`"
          is-link
          @click="go(p.id)"
        >
          <template #icon>
            <van-image
              v-if="p.coverUrl"
              :src="p.coverUrl"
              width="44"
              height="44"
              fit="cover"
              radius="8"
              style="margin-right: 12px"
            />
          </template>
        </van-cell>
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
import { listProducts, type Product } from '@/services/api';

const router = useRouter();
const products = ref<Product[]>([]);
const loading = ref(false);
const refreshing = ref(false);

async function load() {
  loading.value = true;
  try {
    products.value = await listProducts();
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function go(id: string) {
  router.push(`/products/${id}`);
}

onMounted(load);
</script>

<style scoped>
.page {
  padding-bottom: 60px;
}
</style>

