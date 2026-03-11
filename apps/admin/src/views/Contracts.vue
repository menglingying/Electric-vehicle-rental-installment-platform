<template>
  <div class="panel">
    <div class="panel-title">
      <div>合同管理</div>
      <span class="link">电子签合同 + 历史合同录入</span>
    </div>
    <div class="section-toolbar">
      <a-radio-group v-model="activeType" type="button" size="small" @change="load">
        <a-radio value="ALL">全部</a-radio>
        <a-radio value="ORDER">电子签</a-radio>
        <a-radio value="MANUAL">历史合同</a-radio>
      </a-radio-group>
      <a-button type="primary" @click="openCreate">新增历史合同</a-button>
    </div>
    <div class="table-wrap">
      <a-table :data="rows" :columns="columns" :pagination="false" />
    </div>
  </div>

  <a-modal v-model:visible="visible" :title="form.id ? '编辑历史合同' : '新增历史合同'" @ok="save">
    <a-form :model="form" layout="vertical">
      <a-form-item label="合同编号">
        <a-input v-model="form.contractNo" placeholder="可选" />
      </a-form-item>
      <a-form-item label="历史订单编号">
        <a-input v-model="form.orderNo" placeholder="历史订单编号（可选）" />
      </a-form-item>
      <a-form-item label="商品名称">
        <a-input v-model="form.productName" />
      </a-form-item>
      <a-form-item label="承租人姓名">
        <a-input v-model="form.renterName" />
      </a-form-item>
      <a-form-item label="承租人证件号">
        <a-input v-model="form.renterIdNumber" />
      </a-form-item>
      <a-form-item label="承租人手机号">
        <a-input v-model="form.renterPhone" />
      </a-form-item>
      <a-form-item label="租期起始（YYYY-MM-DD）">
        <a-input v-model="form.leaseStart" placeholder="例如 2025-01-01" />
      </a-form-item>
      <a-form-item label="租期结束（YYYY-MM-DD）">
        <a-input v-model="form.leaseEnd" placeholder="例如 2025-12-31" />
      </a-form-item>
      <a-form-item label="期数">
        <a-input-number v-model="form.periods" :min="1" />
      </a-form-item>
      <a-form-item label="周期（天）">
        <a-input-number v-model="form.cycleDays" :min="1" />
      </a-form-item>
      <a-form-item label="租金/期（元）">
        <a-input-number v-model="form.rentPerPeriod" :min="0" />
      </a-form-item>
      <a-form-item label="押金比例">
        <a-input-number v-model="form.depositRatio" :min="0" :max="1" :step="0.01" />
      </a-form-item>
      <a-form-item label="签署时间（ISO）">
        <a-input v-model="form.signedAt" placeholder="例如 2025-01-01T08:00:00Z" />
      </a-form-item>
      <a-form-item label="签署人">
        <a-input v-model="form.signedBy" />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model="form.remark" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>
      <a-form-item label="合同PDF">
        <a-upload :show-file-list="false" :auto-upload="false" accept="application/pdf" @change="onSelectPdf">
          <template #upload-button>
            <a-button :loading="uploading">上传PDF</a-button>
          </template>
        </a-upload>
        <div v-if="form.fileUrl" class="file-hint">
          已上传：{{ form.fileUrl }}
          <a-button size="mini" @click="openUrl(form.fileUrl)">查看</a-button>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import { Button, Message, Modal, Tag } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import { listContracts, upsertManualContract, uploadContractPdf, downloadContractFile, syncContractStatus, deleteContract, type Contract } from '@/services/api';
import { isSuper } from '@/services/auth';

type ContractRow = Contract & { metaObj: Record<string, any> };
const rows = ref<ContractRow[]>([]);
const activeType = ref<'ALL' | 'ORDER' | 'MANUAL'>('ALL');
const visible = ref(false);
const uploading = ref(false);
const form = reactive({
  id: '',
  contractNo: '',
  orderNo: '',
  productName: '',
  renterName: '',
  renterIdNumber: '',
  renterPhone: '',
  leaseStart: '',
  leaseEnd: '',
  periods: 0,
  cycleDays: 0,
  rentPerPeriod: 0,
  depositRatio: 0,
  signedAt: '',
  signedBy: '',
  remark: '',
  fileUrl: ''
});

function parseMeta(meta?: string) {
  if (!meta) return {};
  try {
    return JSON.parse(meta);
  } catch {
    return {};
  }
}

async function load() {
  try {
    const data = activeType.value === 'ALL' ? await listContracts() : await listContracts(activeType.value);
    rows.value = data.map((item) => ({ ...item, metaObj: parseMeta(item.meta) }));
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

function openCreate() {
  Object.assign(form, {
    id: '',
    contractNo: '',
    orderNo: '',
    productName: '',
    renterName: '',
    renterIdNumber: '',
    renterPhone: '',
    leaseStart: '',
    leaseEnd: '',
    periods: 0,
    cycleDays: 0,
    rentPerPeriod: 0,
    depositRatio: 0,
    signedAt: '',
    signedBy: '',
    remark: '',
    fileUrl: ''
  });
  visible.value = true;
}

function openEdit(row: Contract & { metaObj: Record<string, any> }) {
  if (row.contractType && row.contractType !== 'MANUAL') {
    return;
  }
  const meta = row.metaObj || {};
  Object.assign(form, {
    id: row.orderId,
    contractNo: row.contractNo || '',
    orderNo: meta.orderNo || '',
    productName: meta.productName || '',
    renterName: meta.renterName || '',
    renterIdNumber: meta.renterIdNumber || '',
    renterPhone: meta.renterPhone || '',
    leaseStart: meta.leaseStart || '',
    leaseEnd: meta.leaseEnd || '',
    periods: Number(meta.periods || 0),
    cycleDays: Number(meta.cycleDays || 0),
    rentPerPeriod: Number(meta.rentPerPeriod || 0),
    depositRatio: Number(meta.depositRatio || 0),
    signedAt: meta.signedAt || row.signedAt || '',
    signedBy: row.signedBy || '',
    remark: meta.remark || '',
    fileUrl: row.fileUrl || ''
  });
  visible.value = true;
}

async function save() {
  if (!form.productName) return Message.warning('请输入商品名称');
  if (!form.renterName) return Message.warning('请输入承租人姓名');
  if (!form.renterPhone) return Message.warning('请输入承租人手机号');
  if (!form.fileUrl) return Message.warning('请上传合同PDF');
  try {
    await upsertManualContract({
      id: form.id || undefined,
      contractNo: form.contractNo || undefined,
      orderNo: form.orderNo || undefined,
      productName: form.productName || undefined,
      renterName: form.renterName || undefined,
      renterIdNumber: form.renterIdNumber || undefined,
      renterPhone: form.renterPhone || undefined,
      leaseStart: form.leaseStart || undefined,
      leaseEnd: form.leaseEnd || undefined,
      periods: form.periods || undefined,
      cycleDays: form.cycleDays || undefined,
      rentPerPeriod: form.rentPerPeriod || undefined,
      depositRatio: form.depositRatio || undefined,
      signedAt: form.signedAt || undefined,
      signedBy: form.signedBy || undefined,
      fileUrl: form.fileUrl || undefined,
      remark: form.remark || undefined
    });
    Message.success('保存成功');
    visible.value = false;
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '保存失败');
  }
}

async function onSelectPdf(fileList: any, fileItem?: any) {
  const item = fileItem ?? (fileList?.length ? fileList[fileList.length - 1] : null);
  const raw: File | undefined = item?.file ?? item?.originFile ?? item?.raw;
  if (!raw) return;
  uploading.value = true;
  try {
    const res = await uploadContractPdf(raw);
    form.fileUrl = res.url;
    Message.success('上传成功');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '上传失败');
  } finally {
    uploading.value = false;
  }
}

function openUrl(url: string) {
  if (!url) return;
  window.open(url, '_blank');
}

function copyText(text?: string) {
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => Message.success('已复制')).catch(() => Message.error('复制失败'));
  } else {
    Message.info('浏览器不支持复制，请手动复制');
  }
}

function handleDelete(record: ContractRow) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除合同 ${record.contractNo || record.orderId} 吗？此操作不可恢复。`,
    okText: '删除',
    cancelText: '取消',
    hideCancel: false,
    onOk: async () => {
      try {
        await deleteContract(record.orderId);
        Message.success('删除成功');
        await load();
      } catch (e: any) {
        Message.error(e?.response?.data?.message ?? '删除失败');
      }
    }
  });
}

const downloading = ref(false);
const syncing = ref(false);

async function handleSyncStatus(record: ContractRow) {
  if (syncing.value) return;
  syncing.value = true;
  try {
    const updated = await syncContractStatus(record.orderId);
    if (updated.status === 'SIGNED') {
      Message.success('合同已签署 ✓，状态已更新');
    } else if (updated.status === 'SIGNING') {
      Message.info('客户尚未签署');
    } else {
      Message.warning(`状态已更新：${updated.status}`);
    }
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '查询爱签状态失败');
  } finally {
    syncing.value = false;
  }
}

function contractStatusTag(status?: string) {
  const map: Record<string, { label: string; color: string }> = {
    SIGNING: { label: '签署中', color: 'blue' },
    SIGNED: { label: '已签署', color: 'green' },
    VOID: { label: '已作废', color: 'orangered' },
    FAILED: { label: '失败', color: 'red' },
    EXPIRED: { label: '已过期', color: 'gray' }
  };
  const s = status ? (map[status] ?? { label: status, color: 'gray' }) : { label: '未知', color: 'gray' };
  return h(Tag, { color: s.color }, () => s.label);
}

async function handleDownloadContract(record: ContractRow) {
  if (record.fileUrl) {
    openUrl(record.fileUrl);
    return;
  }
  // 没有fileUrl，从爱签下载
  downloading.value = true;
  try {
    const updated = await downloadContractFile(record.orderId);
    if (updated.fileUrl) {
      openUrl(updated.fileUrl);
      await load();
    } else {
      Message.error('下载失败：未获取到文件');
    }
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '下载合同失败');
  } finally {
    downloading.value = false;
  }
}

function contractTypeText(type?: string) {
  if (type === 'MANUAL') return '历史合同';
  if (type === 'ORDER') return '电子签';
  return type || '-';
}

const columns: TableColumnData[] = [
  { title: '类型', render: ({ record }: { record: any }) => contractTypeText(record.contractType) },
  { title: '订单ID', dataIndex: 'orderId' },
  { title: '合同编号', dataIndex: 'contractNo' },
  {
    title: '商品',
    render: ({ record }: { record: any }) => record.metaObj?.productName || '-'
  },
  {
    title: '承租人',
    render: ({ record }: { record: any }) => record.metaObj?.renterName || '-'
  },
  {
    title: '手机号',
    render: ({ record }: { record: any }) => record.metaObj?.renterPhone || '-'
  },
  {
    title: '租期',
    render: ({ record }: { record: any }) => {
      const meta = record.metaObj || {};
      const start = meta.leaseStart || '-';
      const end = meta.leaseEnd || '-';
      return `${start} ~ ${end}`;
    }
  },
  {
    title: '租金/期',
    render: ({ record }: { record: any }) => record.metaObj?.rentPerPeriod ?? '-'
  },
  {
    title: '状态',
    render: ({ record }: { record: any }) => contractStatusTag(record.status)
  },
  {
    title: '操作',
    render: ({ record }: { record: any }) =>
      h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' }, [
        record.contractType === 'MANUAL'
          ? h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑')
          : null,
        record.signUrl
          ? h(Button, { size: 'small', onClick: () => copyText(record.signUrl) }, () => '复制签署链接')
          : null,
        record.signUrl
          ? h(Button, { size: 'small', onClick: () => openUrl(record.signUrl) }, () => '打开签署链接')
          : null,
        // 下载合同：有fileUrl直接打开，SIGNED状态无fileUrl则从爱签下载
        (record.fileUrl || (record.contractType === 'ORDER' && record.status === 'SIGNED'))
          ? h(Button, { type: 'primary', size: 'small', loading: downloading.value, onClick: () => handleDownloadContract(record) }, () => '下载合同')
          : null,
        // 签署中状态可刷新：主动向爱签查询，已签就自动更新
        record.contractType === 'ORDER' && record.status === 'SIGNING'
          ? h(Button, { size: 'small', onClick: () => handleSyncStatus(record) }, () => '刷新状态')
          : null,
        record.notaryCertUrl
          ? h(Button, { size: 'small', onClick: () => openUrl(record.notaryCertUrl || '') }, () => '公证书')
          : null,
        isSuper()
          ? h(Button, { size: 'small', status: 'danger', onClick: () => handleDelete(record) }, () => '删除')
          : null
      ])
  }
];

onMounted(load);
</script>

<style scoped>
.file-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
}
</style>
