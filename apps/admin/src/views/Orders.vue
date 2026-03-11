<template>
  <div class="panel">
    <div class="panel-title">
      <div>订单管理（人工审核 + 履约）</div>
      <span class="link">状态流转与调价</span>
    </div>
    <div class="section-toolbar">
      <a-button @click="exportOrders">导出订单CSV</a-button>
    </div>
    <div class="table-wrap">
      <a-table :data="rows" :columns="columns" :pagination="false" />
    </div>
  </div>

  <a-drawer v-model:visible="detailVisible" width="600" title="订单详情" :footer="false">
    <template v-if="detail">
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item label="订单ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ detail.phone }}</a-descriptions-item>
        <a-descriptions-item label="商品">{{ detail.productName }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ detail.status }}</a-descriptions-item>
        <a-descriptions-item label="电池配置">{{ batteryOptionText(detail.batteryOption) }}</a-descriptions-item>
        <a-descriptions-item label="还款方式">{{ repaymentMethodText(detail.repaymentMethod) }}</a-descriptions-item>
        <a-descriptions-item label="期数">{{ detail.periods }}期</a-descriptions-item>
        <a-descriptions-item label="周期">{{ detail.cycleDays }}天/期</a-descriptions-item>
        <a-descriptions-item label="合同状态">{{ detail.contract?.status || '未发起' }}</a-descriptions-item>
        <a-descriptions-item label="收款状态">{{ detail.payment?.status || '未发起' }}</a-descriptions-item>
        <a-descriptions-item label="剩余应还">¥{{ detail.remainingAmount }}</a-descriptions-item>
      </a-descriptions>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px">
        KYC实名信息
        <a-tag v-if="detail.kycCompleted" color="green">已完成</a-tag>
        <a-tag v-else color="orange">未完成</a-tag>
      </div>
      <a-descriptions v-if="detail.kycCompleted" :column="2" size="small" bordered>
        <a-descriptions-item label="真实姓名">{{ detail.realName }}</a-descriptions-item>
        <a-descriptions-item label="身份证号">{{ maskIdCard(detail.idCardNumber) }}</a-descriptions-item>
        <a-descriptions-item label="就业状态">{{ employmentStatusText(detail.employmentStatus) }}</a-descriptions-item>
        <a-descriptions-item label="单位/职业">{{ detail.employmentName || detail.occupation || '-' }}</a-descriptions-item>
        <a-descriptions-item label="月收入">{{ incomeRangeText(detail.incomeRangeCode) }}</a-descriptions-item>
        <a-descriptions-item label="住址" :span="2">{{ formatAddress(detail) }}</a-descriptions-item>
        <a-descriptions-item label="联系人1">{{ detail.contactName }}</a-descriptions-item>
        <a-descriptions-item label="联系人1电话">{{ detail.contactPhone }}</a-descriptions-item>
        <a-descriptions-item label="联系人1关系">{{ contactRelationText(detail.contactRelation) }}</a-descriptions-item>
        <a-descriptions-item label="联系人2">{{ detail.contactName2 || '-' }}</a-descriptions-item>
        <a-descriptions-item label="联系人2电话">{{ detail.contactPhone2 || '-' }}</a-descriptions-item>
        <a-descriptions-item label="联系人2关系">{{ contactRelationText(detail.contactRelation2) }}</a-descriptions-item>
        <a-descriptions-item label="联系人3">{{ detail.contactName3 || '-' }}</a-descriptions-item>
        <a-descriptions-item label="联系人3电话">{{ detail.contactPhone3 || '-' }}</a-descriptions-item>
        <a-descriptions-item label="联系人3关系">{{ contactRelationText(detail.contactRelation3) }}</a-descriptions-item>
      </a-descriptions>
      <div v-if="detail.kycCompleted" style="margin-top: 12px; display: flex; gap: 12px">
        <div v-if="detail.idCardFront" class="kyc-image">
          <div class="label">身份证正面</div>
          <a-image :src="detail.idCardFront" width="120" height="80" fit="cover" />
        </div>
        <div v-if="detail.idCardBack" class="kyc-image">
          <div class="label">身份证反面</div>
          <a-image :src="detail.idCardBack" width="120" height="80" fit="cover" />
        </div>
        <div v-if="detail.facePhoto" class="kyc-image">
          <div class="label">人脸自拍</div>
          <a-image :src="detail.facePhoto" width="80" height="80" fit="cover" />
        </div>
      </div>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px">
        爱签实名认证
        <a-tag v-if="detail.asignSerialNo" color="green">已完成</a-tag>
        <a-tag v-else color="orange">未完成</a-tag>
      </div>
      <a-descriptions :column="2" size="small" bordered>
        <a-descriptions-item label="认证流水号">{{ detail.asignSerialNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="认证结果">{{ detail.asignAuthResult || '-' }}</a-descriptions-item>
      </a-descriptions>
      <div v-if="!detail.asignSerialNo && detail.kycCompleted" style="margin-top: 8px">
        <a-alert type="warning" :show-icon="true">
          客户需在H5订单详情页点击"去实名认证"完成爱签人脸认证后，才能生成合同
        </a-alert>
      </div>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px">
        合同信息
        <a-button size="mini" :loading="refreshingDetail" @click="refreshDetail">刷新状态</a-button>
        <span v-if="detail.contract?.status === 'SIGNING' && isPolling" style="font-size:12px; color:#1890ff; font-weight:400">
          ⟳ 自动检测中（每20秒）
        </span>
      </div>
      <a-descriptions :column="2" size="small" bordered>
        <a-descriptions-item label="合同编号">{{ detail.contract?.contractNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="合同状态">
          <span :style="contractStatusStyle(detail.contract?.status)">{{ contractStatusText(detail.contract?.status) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="签署链接" :span="2">
          <span v-if="detail.contract?.signUrl">{{ detail.contract.signUrl }}</span>
          <span v-else>—</span>
        </a-descriptions-item>
        <a-descriptions-item label="签署时间">{{ detail.contract?.signedAt || '-' }}</a-descriptions-item>
        <a-descriptions-item label="签署人">{{ detail.contract?.signedBy || '-' }}</a-descriptions-item>
        <a-descriptions-item label="合同文件" :span="2">
          <span v-if="detail.contract?.fileUrl">{{ detail.contract.fileUrl }}</span>
          <span v-else>—</span>
        </a-descriptions-item>
      </a-descriptions>
      <div v-if="detail.contract?.status === 'SIGNED'" style="margin-top: 8px">
        <a-alert type="success" :show-icon="true">客户已完成签署，合同生效</a-alert>
      </div>
      <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap">
        <a-button
          v-if="detail.status === 'ACTIVE' && canPrepareContract && detail.asignSerialNo"
          type="primary"
          @click="prepareContractForOrder(detail.id)"
        >
          {{ detail.contract ? '重新生成合同' : '生成合同' }}
        </a-button>
        <a-button
          v-if="detail.status === 'ACTIVE' && canPrepareContract && !detail.asignSerialNo"
          type="primary"
          disabled
        >
          生成合同（需先完成爱签认证）
        </a-button>
        <a-button v-if="detail.contract?.signUrl" @click="copyText(detail.contract.signUrl)">复制签署链接</a-button>
        <a-button v-if="detail.contract?.signUrl" @click="showLinkQr('合同签署二维码', detail.contract.signUrl)">签署二维码</a-button>
        <a-button v-if="detail.contract?.status === 'SIGNING'" @click="markSigned(detail.id)">标记已签署</a-button>
        <a-button v-if="detail.contract?.fileUrl" @click="openUrl(detail.contract.fileUrl)">下载合同</a-button>
        <a-button v-else-if="detail.contract?.status === 'SIGNED' && !detail.contract?.fileUrl" :loading="downloadingContract" @click="handleDownloadContract(detail.id)">下载合同</a-button>
        <a-button v-if="detail.contract" status="warning" @click="resetForTest(detail.id)">重置测试</a-button>
      </div>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px">公证信息</div>
      <a-descriptions :column="2" size="small" bordered>
        <a-descriptions-item label="公证状态">{{ notaryStatusText(detail.notaryStatus) }}</a-descriptions-item>
        <a-descriptions-item label="公证单号">{{ detail.notaryOrderNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="出证时间">{{ detail.notaryCertifiedTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="公证员">{{ detail.notaryName || '-' }}</a-descriptions-item>
        <a-descriptions-item v-if="notarySignUrl" label="签署链接" :span="2">
          <a :href="notarySignUrl" target="_blank" style="word-break: break-all">{{ notarySignUrl }}</a>
        </a-descriptions-item>
        <a-descriptions-item label="证书链接" :span="2">
          <span v-if="detail.notaryCertUrl">{{ detail.notaryCertUrl }}</span>
          <span v-else>—</span>
        </a-descriptions-item>
      </a-descriptions>
      <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap">
        <a-button v-if="detail.contract?.status === 'SIGNED' && !detail.notaryOrderNo" type="primary" @click="applyNotaryForOrder(detail.id)">
          发起公证
        </a-button>
        <a-button v-if="detail.notaryStatus === '20'" type="primary" :loading="notarySignLoading" @click="getNotarySignUrl(detail.id)">
          获取签署链接
        </a-button>
        <a-button v-if="notarySignUrl" @click="copyText(notarySignUrl)">复制签署链接</a-button>
        <a-button v-if="notarySignUrl" @click="showLinkQr('公证签署二维码', notarySignUrl)">签署二维码</a-button>
        <a-button v-if="detail.notaryOrderNo" @click="refreshNotaryStatus(detail.id)">刷新状态</a-button>
        <a-button v-if="detail.notaryOrderNo && detail.notaryStatus === '33'" @click="fetchNotaryCert(detail.id)">获取证书链接</a-button>
        <a-button v-if="detail.notaryCertUrl" @click="openUrl(detail.notaryCertUrl)">下载证书</a-button>
      </div>
      <div v-if="detail.notaryStatus === '20'" style="margin-top: 8px">
        <a-alert type="info">客户需点击签署链接完成公证文件签署，签署完成后状态会自动更新</a-alert>
      </div>

      <a-divider />
      <div style="font-weight: 600; margin-bottom: 8px">状态流转日志</div>
      <a-table :data="detail.statusLogs || []" :pagination="false" size="small">
        <a-table-column title="时间" data-index="at" />
        <a-table-column title="动作" data-index="action" />
        <a-table-column title="状态" data-index="status" />
        <a-table-column title="来源" data-index="by" />
      </a-table>
    </template>
  </a-drawer>

  <a-modal v-model:visible="adjustVisible" title="订单调价" @ok="submitAdjust">
    <a-form :model="adjustForm" layout="vertical">
      <a-form-item label="租金/期（元）" field="rentPerPeriod">
        <a-input-number v-model="adjustForm.rentPerPeriod" :min="1" />
      </a-form-item>
      <a-form-item label="期数" field="periods">
        <a-input-number v-model="adjustForm.periods" :min="3" />
      </a-form-item>
      <a-form-item label="周期（天）" field="cycleDays">
        <a-input-number v-model="adjustForm.cycleDays" :min="7" />
      </a-form-item>
      <a-form-item label="调价原因" field="reason">
        <a-input v-model="adjustForm.reason" placeholder="请输入原因" />
      </a-form-item>
      <a-alert type="warning" :show-icon="true" title="调价仅限审核前，调价后需重新签合同。" />
    </a-form>
  </a-modal>

  <a-modal v-model:visible="qrVisible" :title="qrTitle" :footer="false" width="360">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px">
      <img v-if="qrImageUrl" :src="qrImageUrl" alt="签署二维码" style="width: 280px; height: 280px; border: 1px solid #f0f0f0" />
      <a-typography-paragraph v-if="qrLink" copyable style="word-break: break-all; margin-bottom: 0">
        {{ qrLink }}
      </a-typography-paragraph>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { Button, Message, Modal, Input } from '@arco-design/web-vue';
import type { TableColumnData } from '@arco-design/web-vue';
import {
  adjustOrderPrice,
  approveOrder,
  closeOrder,
  deleteOrder,
  deliverOrder,
  getOrderDetail,
  prepareContract,
  markContractSigned,
  downloadContractFile,
  syncContractStatus,
  listOrders,
  pickupOrder,
  rejectOrder,
  resetOrderForTest,
  returnOrder,
  settleOrder,
  applyNotary,
  refreshNotary,
  fetchNotaryCertUrl,
  getNotarySignUrl as getNotarySignUrlApi,
  type Order
} from '@/services/api';
import { downloadCsv } from '@/services/download';
import { isSuper } from '@/services/auth';

const rows = ref<Order[]>([]);
const detailVisible = ref(false);
const detail = ref<any>(null);
const adjustVisible = ref(false);
const adjustForm = ref({
  orderId: '',
  rentPerPeriod: 0,
  periods: 0,
  cycleDays: 0,
  reason: ''
});
const notarySignUrl = ref('');
const notarySignLoading = ref(false);
const downloadingContract = ref(false);
const refreshingDetail = ref(false);

// 自动轮询：抽屉打开且合同处于 SIGNING 状态时，每 20 秒主动查询爱签最新状态
let pollTimer: ReturnType<typeof setInterval> | null = null;
const isPolling = ref(false);

function startPolling() {
  stopPolling();
  isPolling.value = true;
  pollTimer = setInterval(async () => {
    if (!detailVisible.value || detail.value?.contract?.status !== 'SIGNING') {
      stopPolling();
      return;
    }
    if (!detail.value?.contract?.contractNo) return;
    try {
      const updated = await syncContractStatus(detail.value.id);
      if (updated?.status && updated.status !== 'SIGNING') {
        detail.value = await getOrderDetail(detail.value.id);
        stopPolling();
        if (updated.status === 'SIGNED') {
          Message.success('合同已签署 ✓');
        }
      }
    } catch {
      // 静默忽略，等下次轮询
    }
  }, 20000);
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isPolling.value = false;
}

watch(detailVisible, (visible) => {
  if (visible && detail.value?.contract?.status === 'SIGNING') {
    startPolling();
  } else {
    stopPolling();
  }
});

watch(() => detail.value?.contract?.status, (status) => {
  if (status === 'SIGNING' && detailVisible.value) {
    startPolling();
  } else {
    stopPolling();
  }
});

onUnmounted(() => stopPolling());

const canPrepareContract = computed(() => {
  const s = detail.value?.contract?.status;
  return !s || s === 'VOID' || s === 'FAILED' || s === 'EXPIRED';
});

function contractStatusText(status?: string) {
  const map: Record<string, string> = {
    SIGNING: '签署中',
    SIGNED: '已签署 ✓',
    VOID: '已作废',
    FAILED: '失败',
    EXPIRED: '已过期'
  };
  return status ? (map[status] ?? status) : '未发起';
}

function contractStatusStyle(status?: string) {
  const map: Record<string, string> = {
    SIGNING: 'color:#1890ff; font-weight:600',
    SIGNED: 'color:#52c41a; font-weight:600',
    VOID: 'color:#ff7d00; font-weight:600',
    FAILED: 'color:#f53f3f; font-weight:600',
    EXPIRED: 'color:#8c8c8c; font-weight:600'
  };
  return status ? (map[status] ?? 'color:#8c8c8c') : 'color:#8c8c8c';
}
const qrVisible = ref(false);
const qrTitle = ref('签署二维码');
const qrLink = ref('');
const qrImageUrl = computed(() =>
  qrLink.value
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrLink.value)}`
    : ''
);

function batteryOptionText(option: string) {
  const map: Record<string, string> = {
    WITHOUT_BATTERY: '空车',
    WITH_BATTERY: '含电池'
  };
  return map[option] || option || '-';
}

function repaymentMethodText(method: string) {
  const map: Record<string, string> = {
    AUTO_DEDUCT: '自动扣款',
    MANUAL_TRANSFER: '手动转账',
    OFFLINE: '线下收款'
  };
  return map[method] || method || '-';
}

function maskIdCard(idCard: string) {
  if (!idCard || idCard.length < 10) return idCard || '-';
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}

function employmentStatusText(code: string) {
  const map: Record<string, string> = {
    employed: '全职',
    part_time: '兼职',
    freelancer: '自由职业',
    self_employed: '个体经营',
    student: '学生',
    unemployed: '无业',
    retired: '退休'
  };
  return map[code] || '-';
}

function incomeRangeText(code: string) {
  const map: Record<string, string> = {
    '0_1000': '0-1000',
    '1000_2000': '1000-2000',
    '2001_3000': '2001-3000',
    '3001_4000': '3001-4000',
    '4001_5000': '4001-5000',
    '5001_8000': '5001-8000',
    '8001_12000': '8001-12000',
    '12001_20000': '12001-20000',
    '20000_plus': '20000+',
    '12001_plus': '12001+'
  };
  return map[code] || '-';
}

function contactRelationText(code: string) {
  const map: Record<string, string> = {
    parent: '父母',
    spouse: '配偶',
    child: '子女',
    colleague: '同事',
    friend: '朋友',
    other: '其他'
  };
  return map[code] || code || '-';
}

function notaryStatusText(status?: string) {
  if (!status) return '未发起';
  const map: Record<string, string> = {
    '10': '预审中',
    '11': '预审不通过',
    '20': '申办中',
    '21': '申办终止',
    '22': '申办成功',
    '23': '申办完结',
    '31': '受理中',
    '33': '已出证',
    '34': '异常终止',
    FAILED: '发起失败'
  };
  return map[status] || status;
}

function openUrl(url: string) {
  window.open(url, '_blank');
}

async function prepareContractForOrder(orderId: string) {
  let contractNo = '';
  let productFrameNo = '';
  Modal.confirm({
    title: '生成合同',
    content: () =>
      h('div', { style: 'display: flex; flex-direction: column; gap: 12px' }, [
        h(Input, {
          placeholder: '车架号（必填）',
          'onUpdate:modelValue': (v: string) => (productFrameNo = v),
          onChange: (v: string) => (productFrameNo = v)
        }),
        h(Input, {
          placeholder: '合同编号（可选）',
          'onUpdate:modelValue': (v: string) => (contractNo = v),
          onChange: (v: string) => (contractNo = v)
        })
      ]),
    onOk: async () => {
      if (!productFrameNo.trim()) {
        Message.warning('请输入车架号');
        return false;
      }
      try {
        await prepareContract(orderId, { contractNo, productFrameNo });
        Message.success('合同已生成，等待签署');
        await openDetail(orderId);
      } catch (e: any) {
        Message.error(e?.response?.data?.message ?? '生成失败');
      }
    }
  });
}

async function markSigned(orderId: string) {
  try {
    await markContractSigned(orderId, { signedBy: 'admin' });
    Message.success('已标记签署完成');
    await openDetail(orderId);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function handleDownloadContract(orderId: string) {
  downloadingContract.value = true;
  try {
    const updated = await downloadContractFile(orderId);
    if (updated.fileUrl) {
      openUrl(updated.fileUrl);
      await openDetail(orderId);
    } else {
      Message.error('下载失败：未获取到文件');
    }
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '下载合同失败');
  } finally {
    downloadingContract.value = false;
  }
}

function copyText(text: string) {
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => Message.success('已复制')).catch(() => Message.error('复制失败'));
  } else {
    Message.info('浏览器不支持复制，请手动复制');
  }
}

function showLinkQr(title: string, link?: string) {
  if (!link) {
    Message.warning('暂无可用链接');
    return;
  }
  qrTitle.value = title;
  qrLink.value = link;
  qrVisible.value = true;
}

async function applyNotaryForOrder(orderId: string) {
  try {
    await applyNotary(orderId);
    Message.success('已发起公证');
    await openDetail(orderId);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '发起失败');
  }
}

async function refreshNotaryStatus(orderId: string) {
  try {
    await refreshNotary(orderId);
    Message.success('已刷新状态');
    await openDetail(orderId);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '刷新失败');
  }
}

async function fetchNotaryCert(orderId: string) {
  try {
    const res = await fetchNotaryCertUrl(orderId);
    Message.success('已获取证书链接');
    if (res.url) openUrl(res.url);
    await openDetail(orderId);
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '获取失败');
  }
}

async function getNotarySignUrl(orderId: string) {
  notarySignLoading.value = true;
  try {
    const res = await getNotarySignUrlApi(orderId);
    notarySignUrl.value = res.signUrl || '';
    if (notarySignUrl.value) {
      Message.success('签署链接获取成功');
    } else {
      Message.warning('未获取到签署链接');
    }
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '获取签署链接失败');
  } finally {
    notarySignLoading.value = false;
  }
}

function formatAddress(order: any) {
  const parts = [
    order?.homeProvinceName || order?.homeProvinceCode,
    order?.homeCityName || order?.homeCityCode,
    order?.homeDistrictName || order?.homeDistrictCode,
    order?.homeAddressDetail
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : '-';
}

const columns: TableColumnData[] = [
  { title: 'ID', dataIndex: 'id' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '客户姓名', render: ({ record }: { record: any }) => record.realName || '-' },
  { title: '商品', dataIndex: 'productName' },
  { title: '电池配置', render: ({ record }: { record: any }) => batteryOptionText(record.batteryOption) },
  { title: '还款方式', render: ({ record }: { record: any }) => repaymentMethodText(record.repaymentMethod) },
  {
    title: 'KYC',
    render: ({ record }: { record: any }) =>
      h(
        'span',
        { style: record.kycCompleted ? 'color: green' : 'color: orange' },
        record.kycCompleted ? '已完成' : '未完成'
      )
  },
  {
    title: '状态',
    render: ({ record }: { record: any }) => {
      const statusMap: Record<string, { text: string; color: string }> = {
        PENDING_REVIEW: { text: '待审核', color: '#faad14' },
        ACTIVE: { text: '待交付', color: '#1890ff' },
        DELIVERED: { text: '已交付', color: '#52c41a' },
        IN_USE: { text: '租赁中', color: '#722ed1' },
        RETURNED: { text: '已归还', color: '#13c2c2' },
        SETTLED: { text: '已结清', color: '#52c41a' },
        REJECTED: { text: '已驳回', color: '#ff4d4f' },
        CLOSED: { text: '已关闭', color: '#8c8c8c' }
      };
      const s = statusMap[record.status] || { text: record.status, color: '#8c8c8c' };
      return h('span', { style: `color: ${s.color}; font-weight: 500` }, s.text);
    }
  },
  {
    title: '合同状态',
    render: ({ record }: { record: any }) => {
      const status = record?.contract?.status;
      const statusMap: Record<string, { text: string; color: string }> = {
        SIGNING: { text: '签署中', color: '#1890ff' },
        SIGNED: { text: '已签署', color: '#52c41a' },
        VOID: { text: '已作废', color: '#ff7d00' },
        FAILED: { text: '失败', color: '#f53f3f' }
      };
      const s = status ? statusMap[status] || { text: status, color: '#8c8c8c' } : { text: '未生成', color: '#8c8c8c' };
      return h('span', { style: `color: ${s.color}; font-weight: 500` }, s.text);
    }
  },
  { title: '期数', dataIndex: 'periods' },
  {
    title: '创建时间',
    render: ({ record }: { record: any }) => {
      if (!record.createdAt) return '-';
      const d = new Date(record.createdAt);
      return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  },
  {
    title: '操作',
    render: ({ record }: { record: any }) => {
      const status = record.status;
      const buttons: any[] = [];
      buttons.push(h(Button, { size: 'small', onClick: () => openDetail(record.id) }, () => '详情'));
      if (status === 'PENDING_REVIEW') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => approve(record.id) }, () => '通过'));
        buttons.push(h(Button, { status: 'danger', size: 'small', onClick: () => reject(record.id) }, () => '驳回'));
        buttons.push(h(Button, { size: 'small', onClick: () => openAdjust(record.id) }, () => '调价'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'ACTIVE') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => deliver(record.id) }, () => '交付'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'DELIVERED') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => pickup(record.id) }, () => '取车'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'IN_USE') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => doReturn(record.id) }, () => '归还'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      } else if (status === 'RETURNED') {
        buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => settle(record.id) }, () => '结清'));
        buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
      }
      if (status !== 'IN_USE' && isSuper()) {
        buttons.push(h(Button, { status: 'danger', size: 'small', onClick: () => doDelete(record.id) }, () => '删除'));
      }
      return h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' }, buttons);
    }
  }
];

async function load() {
  try {
    rows.value = await listOrders();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载失败');
  }
}

async function approve(id: string) {
  try {
    await approveOrder(id);
    Message.success('已通过');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function reject(id: string) {
  let reason = '';
  Modal.confirm({
    title: '驳回原因',
    content: () =>
      h(Input, {
        placeholder: '请输入原因',
        onInput: (v: string) => (reason = v)
      }),
    onOk: async () => {
      await rejectOrder(id, reason || '资料不完整');
      Message.success('已驳回');
      await load();
    }
  });
}

async function deliver(id: string) {
  try {
    await deliverOrder(id);
    Message.success('已标记交付');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function pickup(id: string) {
  try {
    await pickupOrder(id);
    Message.success('已标记取车');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function doReturn(id: string) {
  try {
    await returnOrder(id);
    Message.success('已标记归还');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function settle(id: string) {
  try {
    await settleOrder(id);
    Message.success('已结清');
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '操作失败');
  }
}

async function close(id: string) {
  Modal.confirm({
    title: '关闭订单',
    content: '确认要关闭该订单吗？',
    onOk: async () => {
      await closeOrder(id);
      Message.success('已关闭');
      await load();
    }
  });
}

async function doDelete(id: string) {
  Modal.confirm({
    title: '删除订单',
    content: '确认要删除该订单吗？此操作不可恢复！',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        await deleteOrder(id);
        Message.success('已删除');
        await load();
      } catch (e: any) {
        Message.error(e?.response?.data?.message ?? '删除失败');
      }
    }
  });
}

async function resetForTest(id: string) {
  Modal.confirm({
    title: '重置测试',
    content: '将订单重置为ACTIVE状态，删除合同记录，方便重新测试。确认吗？',
    okButtonProps: { status: 'warning' },
    onOk: async () => {
      try {
        await resetOrderForTest(id);
        Message.success('已重置，可重新生成合同');
        await openDetail(id);
        await load();
      } catch (e: any) {
        Message.error(e?.response?.data?.message ?? '重置失败');
      }
    }
  });
}

async function openDetail(id: string) {
  try {
    notarySignUrl.value = ''; // 清除之前的签署链接
    detail.value = await getOrderDetail(id);
    detailVisible.value = true;
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载详情失败');
  }
}

async function refreshDetail() {
  if (!detail.value?.id) return;
  refreshingDetail.value = true;
  try {
    // 如果有合同编号，先主动向爱签查询最新状态
    if (detail.value.contract?.contractNo) {
      try {
        await syncContractStatus(detail.value.id);
      } catch (e: any) {
        // 查询爱签失败时不阻断，仅刷新本地数据
        console.warn('同步爱签状态失败:', e?.response?.data?.message ?? e?.message);
      }
    }
    detail.value = await getOrderDetail(detail.value.id);
    const status = detail.value.contract?.status;
    if (status === 'SIGNED') {
      Message.success('合同已签署 ✓');
    } else if (status === 'SIGNING') {
      Message.info('客户尚未签署');
    } else {
      Message.success('已刷新');
    }
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '刷新失败');
  } finally {
    refreshingDetail.value = false;
  }
}

async function openAdjust(id: string) {
  try {
    const order = await getOrderDetail(id);
    const plan = Array.isArray(order?.repaymentPlan) ? order.repaymentPlan : [];
    const rentPerPeriod = plan.reduce((max: number, item: any) => Math.max(max, Number(item.amount || 0)), 0);
    adjustForm.value = {
      orderId: id,
      rentPerPeriod: rentPerPeriod || 0,
      periods: order.periods || 0,
      cycleDays: order.cycleDays || 0,
      reason: ''
    };
    adjustVisible.value = true;
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '加载订单失败');
  }
}

async function submitAdjust() {
  if (!adjustForm.value.orderId) return;
  if (!adjustForm.value.rentPerPeriod) return Message.warning('请输入租金/期');
  if (!adjustForm.value.periods) return Message.warning('请输入期数');
  if (!adjustForm.value.cycleDays) return Message.warning('请输入周期');
  if (!adjustForm.value.reason.trim()) return Message.warning('请输入调价原因');
  try {
    await adjustOrderPrice(adjustForm.value.orderId, {
      rentPerPeriod: adjustForm.value.rentPerPeriod,
      periods: adjustForm.value.periods,
      cycleDays: adjustForm.value.cycleDays,
      reason: adjustForm.value.reason
    });
    Message.success('调价成功');
    adjustVisible.value = false;
    await load();
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '调价失败');
  }
}

onMounted(load);

async function exportOrders() {
  try {
    await downloadCsv('/admin/exports/orders.csv', 'orders.csv');
  } catch (e: any) {
    Message.error(e?.response?.data?.message ?? '导出失败');
  }
}
</script>

<style scoped>
.kyc-image {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kyc-image .label {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 4px;
}
</style>
