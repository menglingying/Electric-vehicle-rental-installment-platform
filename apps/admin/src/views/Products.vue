<template>
  <div class="panel">
    <div class="panel-title">
      <div>商品管理</div>
      <span class="link">商品与价格维护</span>
    </div>
    <div class="section-toolbar">
      <div class="left">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索车型名称"
          style="width: 240px"
          allow-clear
          @search="onSearch"
          @clear="onSearch"
        />
      </div>
      <div class="right">
        <div class="info-hint">商品上架后，H5 会自动同步可选。</div>
        <a-button type="primary" @click="openCreate">新增商品</a-button>
      </div>
    </div>
    <div class="table-wrap">
      <a-table :data="filteredRows" :columns="columns" :pagination="false" />
    </div>
  </div>

  <a-modal v-model:visible="visible" :title="form.id ? '编辑商品' : '新增商品'" @ok="save">
    <a-form :model="form" layout="vertical">
      <a-form-item label="商品图片（可多图，第一张为封面）" field="images">
        <a-upload :show-file-list="false" :auto-upload="false" accept="image/*" multiple @change="onSelectFiles">
          <template #upload-button>
            <a-button :loading="uploading">上传图片</a-button>
          </template>
        </a-upload>

        <a-alert
          style="margin-top: 8px"
          type="info"
          :show-icon="true"
          title="建议至少上传 1 张图片；第一张作为封面，H5 详情页轮播展示。"
        />

        <a-space v-if="form.images.length" wrap size="medium" style="margin-top: 12px">
          <div v-for="(url, idx) in form.images" :key="url + idx" class="image-card">
            <a-image :src="url" width="96" height="96" fit="cover" />
            <a-space size="mini" wrap class="image-actions">
              <a-tag v-if="idx === 0" bordered>封面</a-tag>
              <a-button size="mini" :disabled="idx === 0" @click="setAsCover(idx)">设为封面</a-button>
              <a-button size="mini" :disabled="idx === 0" @click="moveImage(idx, -1)">上移</a-button>
              <a-button size="mini" :disabled="idx === form.images.length - 1" @click="moveImage(idx, 1)">下移</a-button>
              <a-button size="mini" status="danger" @click="removeImage(idx)">删除</a-button>
            </a-space>
          </div>
        </a-space>
      </a-form-item>

      <a-form-item label="名称" field="name">
        <a-input v-model="form.name" />
      </a-form-item>
      <a-form-item label="车型分类">
        <div class="cascader-row">
          <a-select v-model="form.brandId" placeholder="选择品牌" :options="brandOptions" allow-clear @change="onBrandChange" style="flex: 1" />
          <a-select
            v-model="form.seriesId"
            placeholder="选择系列"
            :options="seriesOptions"
            allow-clear
            @change="onSeriesChange"
            :disabled="!form.brandId"
            style="flex: 1"
          />
          <a-select
            v-model="form.categoryId"
            placeholder="选择型号"
            :options="modelOptions"
            allow-clear
            :disabled="!form.seriesId"
            style="flex: 1"
          />
        </div>
        <div v-if="!brandOptions.length" style="margin-top: 8px">
          <a-alert type="warning">暂无分类数据，请先在「分类管理」创建品牌 → 系列 → 型号。</a-alert>
        </div>
      </a-form-item>
      <a-form-item label="租金/期（元）" field="rentPerCycle">
        <a-input-number v-model="form.rentPerCycle" :min="1" />
      </a-form-item>
      <a-form-item label="标签（逗号分隔）" field="tagsText">
        <a-input v-model="form.tagsText" placeholder="例如：续航,通勤,分期" />
      </a-form-item>
      <a-form-item label="车架配置" field="frameConfig">
        <a-input v-model="form.frameConfig" placeholder="例如：铝合金车架、碳钢车架" />
      </a-form-item>

      <a-form-item label="电池配置（下单可选）">
        <div class="battery-config-section">
          <div class="battery-option">
            <div class="option-header">
              <a-tag color="blue">选项1：空车（不含电池）</a-tag>
            </div>
            <a-form-item label="空车租金/期（元）" style="margin-bottom: 0">
              <a-input-number v-model="form.rentWithoutBattery" :min="0" placeholder="必填" style="width: 100%" />
            </a-form-item>
          </div>
          <div class="battery-option">
            <div class="option-header">
              <a-tag color="green">选项2：含电池</a-tag>
            </div>
            <a-form-item label="电池型号/规格" style="margin-bottom: 8px">
              <a-input v-model="form.batteryConfig" placeholder="例如：48V20Ah锂电池" />
            </a-form-item>
            <a-form-item label="含电池租金/期（元）" style="margin-bottom: 0">
              <a-input-number v-model="form.rentWithBattery" :min="0" placeholder="不填则不提供此选项" style="width: 100%" />
            </a-form-item>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, computed } from 'vue';
import { Button, Message, Tag, Modal } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import {
  listCategories,
  listProducts,
  uploadProductImage,
  upsertProduct,
  deleteProduct,
  type CategoryNode,
  type Product
} from '@/services/api';

const rows = ref<Product[]>([]);
const categories = ref<CategoryNode[]>([]);
const visible = ref(false);
const uploading = ref(false);
const searchKeyword = ref('');

const brandOptions = computed(() => {
  return categories.value.map((c) => ({ label: c.name, value: c.id }));
});

const seriesOptions = computed(() => {
  if (!form.brandId) return [];
  const brand = categories.value.find((c) => c.id === form.brandId);
  return (brand?.children || []).map((c) => ({ label: c.name, value: c.id }));
});

const modelOptions = computed(() => {
  if (!form.brandId || !form.seriesId) return [];
  const brand = categories.value.find((c) => c.id === form.brandId);
  const series = (brand?.children || []).find((c) => c.id === form.seriesId);
  return (series?.children || []).map((c) => ({ label: c.name, value: c.id }));
});

function onBrandChange() {
  form.seriesId = '';
  form.categoryId = '';
}

function onSeriesChange() {
  form.categoryId = '';
}

function resolveCategoryPath(categoryId: string) {
  for (const brand of categories.value) {
    for (const series of brand.children || []) {
      for (const model of series.children || []) {
        if (model.id === categoryId) {
          return { brandId: brand.id, seriesId: series.id };
        }
      }
    }
  }
  return { brandId: '', seriesId: '' };
}

const categoryNameMap = computed(() => {
  const map: Record<string, string> = {};
  for (const brand of categories.value) {
    for (const series of brand.children || []) {
      for (const model of series.children || []) {
        map[model.id] = `${brand.name} / ${series.name} / ${model.name}`;
      }
    }
  }
  return map;
});

const filteredRows = computed(() => {
  let list = rows.value;
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (keyword) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.id.toLowerCase().includes(keyword) ||
        (p.frameConfig || '').toLowerCase().includes(keyword) ||
        (p.batteryConfig || '').toLowerCase().includes(keyword)
    );
  }
  return [...list].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    const firstCharA = nameA.charAt(0);
    const firstCharB = nameB.charAt(0);
    if (firstCharA !== firstCharB) {
      return firstCharA.localeCompare(firstCharB);
    }
    return nameA.localeCompare(nameB);
  });
});

function onSearch() {
  // computed will update
}

const columns: TableColumnData[] = [
  {
    title: '图片',
    render: ({ record }: { record: any }) => {
      const coverUrl = record.coverUrl || record.images?.[0];
      if (!coverUrl) return '-';
      return h('img', {
        src: coverUrl,
        style: 'width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--color-border)'
      });
    }
  },
  { title: 'ID', dataIndex: 'id' },
  { title: '名称', dataIndex: 'name' },
  {
    title: '分类',
    render: ({ record }: { record: any }) => categoryNameMap.value[record.categoryId] || '-'
  },
  {
    title: '电池配置/价格',
    render: ({ record }: { record: any }) => {
      const items = [];
      const withoutBattery = record.rentWithoutBattery ?? record.rentPerCycle;
      items.push(h('div', { style: 'white-space: nowrap' }, `空车: ¥${withoutBattery}/期`));
      if (record.rentWithBattery != null) {
        const batteryName = record.batteryConfig || '含电池';
        items.push(h('div', { style: 'white-space: nowrap' }, `${batteryName}: ¥${record.rentWithBattery}/期`));
      }
      return h('div', { style: 'display: flex; flex-direction: column; gap: 4px' }, items);
    }
  },
  {
    title: '标签',
    render: ({ record }: { record: any }) =>
      h(
        'div',
        { style: 'display:flex; gap:6px; flex-wrap:wrap' },
        (record.tags ?? []).map((t: string) => h(Tag, { bordered: true }, () => t))
      )
  },
  {
    title: '操作',
    render: ({ record }: { record: any }) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑'),
        h(Button, { size: 'small', status: 'danger', onClick: () => confirmDelete(record) }, () => '删除')
      ])
  }
];

const form = reactive({
  id: '',
  name: '',
  brandId: '',
  seriesId: '',
  categoryId: '',
  images: [] as string[],
  rentPerCycle: 299,
  tagsText: '',
  frameConfig: '',
  batteryConfig: '',
  rentWithoutBattery: null as number | null,
  rentWithBattery: null as number | null
});

async function load() {
  try {
    rows.value = await listProducts();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

function confirmDelete(p: Product) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除商品「${p.name}」吗？此操作不可恢复。`,
    okText: '删除',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        await deleteProduct(p.id);
        Message.success('删除成功');
        await load();
      } catch (e: any) {
        Message.error(e?.response?.data?.message ?? '删除失败');
      }
    }
  });
}

function openCreate() {
  form.id = '';
  form.name = '';
  form.brandId = '';
  form.seriesId = '';
  form.categoryId = '';
  form.images = [];
  form.rentPerCycle = 299;
  form.tagsText = '';
  form.frameConfig = '';
  form.batteryConfig = '';
  form.rentWithoutBattery = null;
  form.rentWithBattery = null;
  visible.value = true;
}

function openEdit(p: Product) {
  form.id = p.id;
  form.name = p.name;
  const path = resolveCategoryPath(p.categoryId ?? '');
  form.brandId = path.brandId;
  form.seriesId = path.seriesId;
  form.categoryId = p.categoryId ?? '';
  form.images = (p.images ?? []).length ? [...(p.images ?? [])] : p.coverUrl ? [p.coverUrl] : [];
  form.rentPerCycle = p.rentPerCycle;
  form.tagsText = (p.tags ?? []).join(',');
  form.frameConfig = p.frameConfig ?? '';
  form.batteryConfig = p.batteryConfig ?? '';
  form.rentWithoutBattery = p.rentWithoutBattery ?? null;
  form.rentWithBattery = p.rentWithBattery ?? null;
  visible.value = true;
}

function setAsCover(idx: number) {
  if (idx <= 0 || idx >= form.images.length) return;
  const [picked] = form.images.splice(idx, 1);
  form.images.unshift(picked);
}

function moveImage(idx: number, delta: -1 | 1) {
  const next = idx + delta;
  if (next < 0 || next >= form.images.length) return;
  const tmp = form.images[idx];
  form.images[idx] = form.images[next];
  form.images[next] = tmp;
}

function removeImage(idx: number) {
  if (idx < 0 || idx >= form.images.length) return;
  form.images.splice(idx, 1);
}

async function onSelectFiles(fileList: any, fileItem?: any) {
  const items = fileItem ? [fileItem] : fileList ?? [];
  if (!items.length) return;

  const MAX_IMAGES = 10;
  for (const item of items) {
    if (form.images.length >= MAX_IMAGES) {
      Message.warning(`最多上传 ${MAX_IMAGES} 张图片`);
      break;
    }

    const raw: File | undefined = item?.file ?? item?.originFile ?? item?.raw;
    if (!raw) continue;

    uploading.value = true;
    try {
      const res = await uploadProductImage(raw);
      form.images.push(res.url);
      Message.success('上传成功');
    } catch (e: any) {
      Message.error(e?.response?.data?.message ?? '上传失败');
    } finally {
      uploading.value = false;
    }
  }
}

async function save() {
  if (!form.name) return Message.warning('请输入名称');
  if (!form.categoryId) return Message.warning('请选择车型分类');
  const images = (form.images ?? []).map((s) => String(s).trim()).filter(Boolean);
  try {
    await upsertProduct({
      id: form.id || undefined,
      name: form.name,
      categoryId: form.categoryId,
      coverUrl: images[0] || undefined,
      images,
      rentPerCycle: form.rentPerCycle,
      tags: form.tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      frameConfig: form.frameConfig,
      batteryConfig: form.batteryConfig,
      rentWithoutBattery: form.rentWithoutBattery ?? undefined,
      rentWithBattery: form.rentWithBattery ?? undefined
    });
    Message.success('保存成功');
    visible.value = false;
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '保存失败');
  }
}

onMounted(load);

onMounted(async () => {
  try {
    categories.value = await listCategories();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '分类加载失败');
  }
});
</script>

<style scoped>
.image-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.image-actions {
  max-width: 320px;
}
.battery-config-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
.battery-option {
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 12px;
  background: var(--color-fill-1);
}
.option-header {
  margin-bottom: 12px;
}
.cascader-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>
