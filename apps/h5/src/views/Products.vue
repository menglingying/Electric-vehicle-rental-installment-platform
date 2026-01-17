<template>
  <div class="page">
    <van-nav-bar title="商品列表" />
    <div class="category-panel">
      <div class="panel-title">大分类</div>
      <van-tabs v-model:active="categoryIndex" shrink swipeable>
        <van-tab v-for="c in categories" :key="c.id" :title="c.name" />
      </van-tabs>
      <div class="panel-title">系列</div>
      <van-tabs v-model:active="seriesIndex" shrink swipeable>
        <van-tab v-for="s in seriesList" :key="s.id" :title="s.name" />
      </van-tabs>
      <div class="panel-title">车型</div>
      <div class="model-list">
        <van-button
          v-for="m in modelList"
          :key="m.id"
          size="small"
          :type="m.id === selectedModelId ? 'primary' : 'default'"
          plain
          @click="selectModel(m.id)"
        >
          {{ m.name }}
        </van-button>
      </div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="loadProducts">
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { listCategoryTree, listProductsByCategory, type CategoryNode, type Product } from '@/services/api';

const router = useRouter();
const products = ref<Product[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const categories = ref<CategoryNode[]>([]);
const categoryIndex = ref(0);
const seriesIndex = ref(0);
const selectedModelId = ref('');

const seriesList = computed(() => categories.value[categoryIndex.value]?.children ?? []);
const modelList = computed(() => seriesList.value[seriesIndex.value]?.children ?? []);

function initSelection() {
  if (!categories.value.length) return;
  categoryIndex.value = 0;
  seriesIndex.value = 0;
  const firstModel = modelList.value[0];
  selectedModelId.value = firstModel?.id ?? '';
}

async function loadCategories() {
  try {
    categories.value = await listCategoryTree();
    initSelection();
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '分类加载失败');
  }
}

async function loadProducts() {
  loading.value = true;
  try {
    if (!selectedModelId.value) {
      products.value = [];
    } else {
      products.value = await listProductsByCategory(selectedModelId.value);
    }
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

function selectModel(id: string) {
  selectedModelId.value = id;
  loadProducts();
}

watch([categoryIndex], () => {
  seriesIndex.value = 0;
  const firstModel = modelList.value[0];
  selectedModelId.value = firstModel?.id ?? '';
  loadProducts();
});

watch([seriesIndex], () => {
  const firstModel = modelList.value[0];
  selectedModelId.value = firstModel?.id ?? '';
  loadProducts();
});

onMounted(async () => {
  await loadCategories();
  await loadProducts();
});
</script>

<style scoped>
.page {
  padding-bottom: 60px;
}
.category-panel {
  padding: 8px 12px;
}
.panel-title {
  font-size: 13px;
  color: var(--van-gray-7);
  margin: 8px 0 4px;
}
.model-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0 8px;
}
</style>
