<template>
  <div class="panel">
    <div class="panel-title">
      <div>分类管理</div>
      <span class="link">品牌 / 系列 / 型号</span>
    </div>
    <div class="section-toolbar">
      <a-button type="primary" @click="openCreate('')">新增大分类</a-button>
    </div>
    <div class="table-wrap">
      <a-table :data="treeData" :columns="columns" :pagination="false" row-key="id" />
    </div>
  </div>

  <a-modal v-model:visible="visible" :title="form.id ? '编辑分类' : '新增分类'" @ok="save">
    <a-form :model="form" layout="vertical">
      <a-form-item label="上级分类">
        <a-select v-model="form.parentId" :options="parentOptions" allow-clear placeholder="大分类无需选择" />
      </a-form-item>
      <a-form-item label="分类名称" field="name">
        <a-input v-model="form.name" />
      </a-form-item>
      <a-form-item label="排序" field="sort">
        <a-input-number v-model="form.sort" :min="0" />
      </a-form-item>
      <a-form-item label="状态" field="status">
        <a-radio-group v-model="form.status">
          <a-radio :value="1">启用</a-radio>
          <a-radio :value="0">停用</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, computed } from 'vue';
import { Button, Message, Modal } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import { deleteCategory, listCategories, upsertCategory, type CategoryNode } from '@/services/api';

const treeData = ref<CategoryNode[]>([]);
const visible = ref(false);
const form = reactive({
  id: '',
  parentId: '',
  name: '',
  sort: 0,
  status: 1
});

const parentOptions = computed(() => {
  const options: { label: string; value: string }[] = [];
  const walk = (nodes: CategoryNode[], path: string[]) => {
    for (const node of nodes) {
      const nextPath = [...path, node.name];
      options.push({ label: nextPath.join(' / '), value: node.id });
      if (node.children?.length) walk(node.children, nextPath);
    }
  };
  walk(treeData.value, []);
  return options;
});

const columns: TableColumnData[] = [
  { title: '名称', dataIndex: 'name' },
  { title: '层级', dataIndex: 'level' },
  { title: '排序', dataIndex: 'sort' },
  {
    title: '状态',
    render: ({ record }: { record: any }) => (record.status === 1 ? '启用' : '停用')
  },
  {
    title: '操作',
    render: ({ record }: { record: any }) =>
      h('div', { style: 'display:flex; gap:8px' }, [
        h(Button, { size: 'small', onClick: () => openCreate(record.id) }, () => '新增子类'),
        h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑'),
        h(Button, { size: 'small', status: 'danger', onClick: () => confirmDelete(record) }, () => '删除')
      ])
  }
];

async function load() {
  try {
    treeData.value = await listCategories();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

function openCreate(parentId: string) {
  form.id = '';
  form.parentId = parentId || '';
  form.name = '';
  form.sort = 0;
  form.status = 1;
  visible.value = true;
}

function openEdit(node: CategoryNode) {
  form.id = node.id;
  form.parentId = node.parentId || '';
  form.name = node.name;
  form.sort = node.sort;
  form.status = node.status;
  visible.value = true;
}

async function save() {
  if (!form.name.trim()) return Message.warning('请输入分类名称');
  if (form.parentId && form.parentId === form.id) return Message.warning('上级分类不能选择自身');
  try {
    await upsertCategory({
      id: form.id || undefined,
      parentId: form.parentId || undefined,
      name: form.name,
      sort: form.sort,
      status: form.status
    });
    Message.success('保存成功');
    visible.value = false;
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '保存失败');
  }
}

function confirmDelete(node: CategoryNode) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类「${node.name}」吗？`,
    okText: '删除',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        await deleteCategory(node.id);
        Message.success('删除成功');
        await load();
      } catch (e: any) {
        Message.error(e?.response?.data?.message ?? '删除失败');
      }
    }
  });
}

onMounted(load);
</script>
