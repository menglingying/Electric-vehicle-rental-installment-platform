<template>
  <div class="page">
    <van-nav-bar title="分类" left-arrow @click-left="router.back()" />

    <div class="search-wrap">
      <van-field v-model="keyword" left-icon="search" placeholder="请输入搜索内容" clearable />
      <van-button class="search-btn" type="primary" size="small" @click="onSearch">搜索</van-button>
    </div>

    <div class="category-layout">
      <div class="category-left">
        <button
          v-for="item in brandCategories"
          :key="item.id"
          class="category-item"
          :class="{ active: item.id === selectedBrandId }"
          @click="selectBrand(item.id)"
        >
          {{ item.name }}
        </button>
      </div>
      <div class="category-right">
        <div class="category-block">
          <div class="block-title">系列</div>
          <div class="block-options">
            <button
              v-for="item in seriesCategories"
              :key="item.id"
              class="option-btn"
              :class="{ active: item.id === selectedSeriesId }"
              @click="selectSeries(item.id)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
        <div class="category-block">
          <div class="block-title">车型</div>
          <div class="block-options">
            <button
              v-for="item in modelCategories"
              :key="item.id"
              class="option-btn"
              :class="{ active: item.id === selectedModelId }"
              @click="selectModel(item.id)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
        <van-pull-refresh v-model="refreshing" @refresh="loadProducts">
          <div v-if="loading" class="empty-text">
            <van-loading size="20px" />
          </div>
          <div v-else-if="filteredProducts.length === 0" class="empty-text">暂无商品</div>
          <div v-else class="product-grid">
            <div v-for="p in filteredProducts" :key="p.id" class="product-card" @click="go(p.id)">
              <div class="product-image">
                <van-image :src="p.coverUrl" width="100%" height="120" fit="cover" />
              </div>
              <div class="product-name">{{ p.brand ? p.brand + ' ' + p.name : p.name }}</div>
              <div class="product-price">
                ¥{{ displayPrice(p) }}<span>/期起</span>
              </div>
            </div>
          </div>
        </van-pull-refresh>
      </div>
    </div>

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
const selectedBrandId = ref('');
const selectedSeriesId = ref('');
const selectedModelId = ref('');
const keyword = ref('');

const brandCategories = computed(() => categories.value);

const seriesCategories = computed(() => {
  const brand = categories.value.find((item) => item.id === selectedBrandId.value);
  return brand?.children || [];
});

const modelCategories = computed(() => {
  const series = seriesCategories.value.find((item) => item.id === selectedSeriesId.value);
  return series?.children || [];
});

const filteredProducts = computed(() => {
  const list = products.value;
  const text = keyword.value.trim();
  if (!text) return list;
  return list.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()) || (p.brand || '').toLowerCase().includes(text.toLowerCase()));
});

function initSelection() {
  if (!brandCategories.value.length) return;
  selectedBrandId.value = brandCategories.value[0].id;
  const seriesList = seriesCategories.value;
  if (seriesList.length) {
    selectedSeriesId.value = seriesList[0].id;
    const modelList = modelCategories.value;
    if (modelList.length) {
      selectedModelId.value = modelList[0].id;
    }
  }
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
  if (!selectedModelId.value) {
    products.value = [];
    refreshing.value = false;
    return;
  }
  loading.value = true;
  try {
    products.value = await listProductsByCategory(selectedModelId.value);
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function selectBrand(id: string) {
  selectedBrandId.value = id;
  const seriesList = seriesCategories.value;
  selectedSeriesId.value = seriesList.length ? seriesList[0].id : '';
  const modelList = modelCategories.value;
  selectedModelId.value = modelList.length ? modelList[0].id : '';
}

function selectSeries(id: string) {
  selectedSeriesId.value = id;
  const modelList = modelCategories.value;
  selectedModelId.value = modelList.length ? modelList[0].id : '';
}

function selectModel(id: string) {
  selectedModelId.value = id;
}

function go(id: string) {
  router.push(`/products/${id}`);
}

function displayPrice(product: Product) {
  return product.rentWithoutBattery ?? product.rentPerCycle;
}

function onSearch() {
  // search uses computed
}

watch(selectedModelId, () => {
  loadProducts();
});

onMounted(async () => {
  await loadCategories();
  await loadProducts();
});
</script>

<style scoped>
.category-block {
  margin-bottom: 12px;
}
.block-title {
  font-size: 12px;
  color: var(--h5-muted);
  margin-bottom: 6px;
}
.block-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.option-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--h5-border);
  background: #fff;
  font-size: 12px;
  color: var(--h5-text);
}
.option-btn.active {
  color: #fff;
  background: var(--h5-primary);
  border-color: var(--h5-primary);
}
</style>
