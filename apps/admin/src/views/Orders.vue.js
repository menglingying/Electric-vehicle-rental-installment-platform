import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { Button, Message, Modal, Input } from '@arco-design/web-vue';
import { adjustOrderPrice, approveOrder, closeOrder, deleteOrder, deliverOrder, getOrderDetail, prepareContract, markContractSigned, downloadContractFile, syncContractStatus, listOrders, pickupOrder, rejectOrder, resetOrderForTest, returnOrder, settleOrder, applyNotary, refreshNotary, fetchNotaryCertUrl, getNotarySignUrl as getNotarySignUrlApi } from '@/services/api';
import { downloadCsv } from '@/services/download';
import { isSuper } from '@/services/auth';
const rows = ref([]);
const searchKeyword = ref('');
const filteredRows = computed(() => {
    const kw = searchKeyword.value.trim();
    if (!kw)
        return rows.value;
    return rows.value.filter(r => {
        const name = r.realName || '';
        const phone = r.phone || '';
        return name.includes(kw) || phone.includes(kw);
    });
});
function onSearch() {
    // filteredRows computed 自动更新
}
const detailVisible = ref(false);
const detail = ref(null);
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
let pollTimer = null;
const isPolling = ref(false);
function startPolling() {
    stopPolling();
    isPolling.value = true;
    pollTimer = setInterval(async () => {
        if (!detailVisible.value || detail.value?.contract?.status !== 'SIGNING') {
            stopPolling();
            return;
        }
        if (!detail.value?.contract?.contractNo)
            return;
        try {
            const updated = await syncContractStatus(detail.value.id);
            if (updated?.status && updated.status !== 'SIGNING') {
                detail.value = await getOrderDetail(detail.value.id);
                stopPolling();
                if (updated.status === 'SIGNED') {
                    Message.success('合同已签署 ✓');
                }
            }
        }
        catch {
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
    }
    else {
        stopPolling();
    }
});
watch(() => detail.value?.contract?.status, (status) => {
    if (status === 'SIGNING' && detailVisible.value) {
        startPolling();
    }
    else {
        stopPolling();
    }
});
onUnmounted(() => stopPolling());
const canPrepareContract = computed(() => {
    const s = detail.value?.contract?.status;
    return !s || s === 'VOID' || s === 'FAILED' || s === 'EXPIRED';
});
function contractStatusText(status) {
    const map = {
        SIGNING: '签署中',
        SIGNED: '已签署 ✓',
        VOID: '已作废',
        FAILED: '失败',
        EXPIRED: '已过期'
    };
    return status ? (map[status] ?? status) : '未发起';
}
function contractStatusStyle(status) {
    const map = {
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
const qrImageUrl = computed(() => qrLink.value
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrLink.value)}`
    : '');
function batteryOptionText(option) {
    const map = {
        WITHOUT_BATTERY: '空车',
        WITH_BATTERY: '含电池'
    };
    return map[option] || option || '-';
}
function repaymentMethodText(method) {
    const map = {
        AUTO_DEDUCT: '自动扣款',
        MANUAL_TRANSFER: '手动转账',
        OFFLINE: '线下收款'
    };
    return map[method] || method || '-';
}
function maskIdCard(idCard) {
    if (!idCard || idCard.length < 10)
        return idCard || '-';
    return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}
function employmentStatusText(code) {
    const map = {
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
function incomeRangeText(code) {
    const map = {
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
function contactRelationText(code) {
    const map = {
        parent: '父母',
        spouse: '配偶',
        child: '子女',
        colleague: '同事',
        friend: '朋友',
        other: '其他'
    };
    return map[code] || code || '-';
}
function notaryStatusText(status) {
    if (!status)
        return '未发起';
    const map = {
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
function openUrl(url) {
    window.open(url, '_blank');
}
async function prepareContractForOrder(orderId) {
    let contractNo = '';
    let productFrameNo = '';
    Modal.confirm({
        title: '生成合同',
        content: () => h('div', { style: 'display: flex; flex-direction: column; gap: 12px' }, [
            h(Input, {
                placeholder: '车架号（必填）',
                'onUpdate:modelValue': (v) => (productFrameNo = v),
                onChange: (v) => (productFrameNo = v)
            }),
            h(Input, {
                placeholder: '合同编号（可选）',
                'onUpdate:modelValue': (v) => (contractNo = v),
                onChange: (v) => (contractNo = v)
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
            }
            catch (e) {
                Message.error(e?.response?.data?.message ?? '生成失败');
            }
        }
    });
}
async function markSigned(orderId) {
    try {
        await markContractSigned(orderId, { signedBy: 'admin' });
        Message.success('已标记签署完成');
        await openDetail(orderId);
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function handleDownloadContract(orderId) {
    downloadingContract.value = true;
    try {
        const updated = await downloadContractFile(orderId);
        if (updated.fileUrl) {
            openUrl(updated.fileUrl);
            await openDetail(orderId);
        }
        else {
            Message.error('下载失败：未获取到文件');
        }
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '下载合同失败');
    }
    finally {
        downloadingContract.value = false;
    }
}
function copyText(text) {
    if (!text)
        return;
    if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => Message.success('已复制')).catch(() => Message.error('复制失败'));
    }
    else {
        Message.info('浏览器不支持复制，请手动复制');
    }
}
function showLinkQr(title, link) {
    if (!link) {
        Message.warning('暂无可用链接');
        return;
    }
    qrTitle.value = title;
    qrLink.value = link;
    qrVisible.value = true;
}
async function applyNotaryForOrder(orderId) {
    try {
        await applyNotary(orderId);
        Message.success('已发起公证');
        await openDetail(orderId);
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '发起失败');
    }
}
async function refreshNotaryStatus(orderId) {
    try {
        await refreshNotary(orderId);
        Message.success('已刷新状态');
        await openDetail(orderId);
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '刷新失败');
    }
}
async function fetchNotaryCert(orderId) {
    try {
        const res = await fetchNotaryCertUrl(orderId);
        Message.success('已获取证书链接');
        if (res.url)
            openUrl(res.url);
        await openDetail(orderId);
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '获取失败');
    }
}
async function getNotarySignUrl(orderId) {
    notarySignLoading.value = true;
    try {
        const res = await getNotarySignUrlApi(orderId);
        notarySignUrl.value = res.signUrl || '';
        if (notarySignUrl.value) {
            Message.success('签署链接获取成功');
        }
        else {
            Message.warning('未获取到签署链接');
        }
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '获取签署链接失败');
    }
    finally {
        notarySignLoading.value = false;
    }
}
function formatAddress(order) {
    const parts = [
        order?.homeProvinceName || order?.homeProvinceCode,
        order?.homeCityName || order?.homeCityCode,
        order?.homeDistrictName || order?.homeDistrictCode,
        order?.homeAddressDetail
    ].filter(Boolean);
    return parts.length ? parts.join(' ') : '-';
}
const columns = [
    { title: '客户姓名', render: ({ record }) => h('span', { style: 'color:#1890ff;cursor:pointer;font-weight:500' }, record.realName || '未实名') },
    { title: '手机号', dataIndex: 'phone' },
    { title: '商品', dataIndex: 'productName' },
    { title: '电池配置', render: ({ record }) => batteryOptionText(record.batteryOption) },
    { title: '还款方式', render: ({ record }) => repaymentMethodText(record.repaymentMethod) },
    {
        title: 'KYC',
        render: ({ record }) => h('span', { style: record.kycCompleted ? 'color: green' : 'color: orange' }, record.kycCompleted ? '已完成' : '未完成')
    },
    {
        title: '状态',
        render: ({ record }) => {
            const statusMap = {
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
        render: ({ record }) => {
            const status = record?.contract?.status;
            const statusMap = {
                SIGNING: { text: '签署中', color: '#1890ff' },
                SIGNED: { text: '已签署', color: '#52c41a' },
                VOID: { text: '已作废', color: '#ff7d00' },
                FAILED: { text: '失败', color: '#f53f3f' }
            };
            const s = status ? statusMap[status] || { text: status, color: '#8c8c8c' } : { text: '未生成', color: '#8c8c8c' };
            const tag = h('span', { style: `color: ${s.color}; font-weight: 500` }, s.text);
            if (status === 'SIGNING') {
                const syncBtn = h(Button, {
                    size: 'mini',
                    style: 'margin-left:6px',
                    onClick: async (e) => {
                        e.stopPropagation();
                        try {
                            const updated = await syncContractStatus(record.id);
                            if (updated?.status === 'SIGNED') {
                                Message.success('合同已签署 ✓，状态已更新');
                                await load();
                            }
                            else {
                                Message.warning('爱签整体合同还未完结，若客户确已签署请进入详情点击「标记客户已签署」');
                            }
                        }
                        catch {
                            Message.error('查询失败');
                        }
                    }
                }, () => '同步');
                return h('span', {}, [tag, syncBtn]);
            }
            return tag;
        }
    },
    { title: '期数', dataIndex: 'periods' },
    {
        title: '创建时间',
        render: ({ record }) => {
            if (!record.createdAt)
                return '-';
            const d = new Date(record.createdAt);
            return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        }
    },
    {
        title: '操作',
        render: ({ record }) => {
            const status = record.status;
            const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
            const buttons = [];
            buttons.push(h(Button, { size: 'small', onClick: stop(() => openDetail(record.id)) }, () => '详情'));
            if (status === 'PENDING_REVIEW') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: stop(() => approve(record.id)) }, () => '通过'));
                buttons.push(h(Button, { status: 'danger', size: 'small', onClick: stop(() => reject(record.id)) }, () => '驳回'));
                buttons.push(h(Button, { size: 'small', onClick: stop(() => openAdjust(record.id)) }, () => '调价'));
                buttons.push(h(Button, { size: 'small', onClick: stop(() => close(record.id)) }, () => '关闭'));
            }
            else if (status === 'ACTIVE') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: stop(() => deliver(record.id)) }, () => '交付'));
                buttons.push(h(Button, { size: 'small', onClick: stop(() => close(record.id)) }, () => '关闭'));
            }
            else if (status === 'DELIVERED') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: stop(() => pickup(record.id)) }, () => '取车'));
                buttons.push(h(Button, { size: 'small', onClick: stop(() => close(record.id)) }, () => '关闭'));
            }
            else if (status === 'IN_USE') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: stop(() => doReturn(record.id)) }, () => '归还'));
                buttons.push(h(Button, { size: 'small', onClick: stop(() => close(record.id)) }, () => '关闭'));
            }
            else if (status === 'RETURNED') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: stop(() => settle(record.id)) }, () => '结清'));
                buttons.push(h(Button, { size: 'small', onClick: stop(() => close(record.id)) }, () => '关闭'));
            }
            if (status !== 'IN_USE' && isSuper()) {
                buttons.push(h(Button, { status: 'danger', size: 'small', onClick: stop(() => doDelete(record.id)) }, () => '删除'));
            }
            return h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' }, buttons);
        }
    }
];
async function load() {
    try {
        rows.value = await listOrders();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
async function approve(id) {
    try {
        await approveOrder(id);
        Message.success('已通过');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function reject(id) {
    let reason = '';
    Modal.confirm({
        title: '驳回原因',
        content: () => h(Input, {
            placeholder: '请输入原因',
            onInput: (v) => (reason = v)
        }),
        onOk: async () => {
            await rejectOrder(id, reason || '资料不完整');
            Message.success('已驳回');
            await load();
        }
    });
}
async function deliver(id) {
    try {
        await deliverOrder(id);
        Message.success('已标记交付');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function pickup(id) {
    try {
        await pickupOrder(id);
        Message.success('已标记取车');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function doReturn(id) {
    try {
        await returnOrder(id);
        Message.success('已标记归还');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function settle(id) {
    try {
        await settleOrder(id);
        Message.success('已结清');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function close(id) {
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
async function doDelete(id) {
    Modal.confirm({
        title: '删除订单',
        content: '确认要删除该订单吗？此操作不可恢复！',
        okButtonProps: { status: 'danger' },
        onOk: async () => {
            try {
                await deleteOrder(id);
                Message.success('已删除');
                await load();
            }
            catch (e) {
                Message.error(e?.response?.data?.message ?? '删除失败');
            }
        }
    });
}
async function resetForTest(id) {
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
            }
            catch (e) {
                Message.error(e?.response?.data?.message ?? '重置失败');
            }
        }
    });
}
async function openDetail(id) {
    try {
        notarySignUrl.value = ''; // 清除之前的签署链接
        detail.value = await getOrderDetail(id);
        detailVisible.value = true;
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载详情失败');
    }
}
async function refreshDetail() {
    if (!detail.value?.id)
        return;
    refreshingDetail.value = true;
    try {
        // 如果有合同编号，先主动向爱签查询最新状态
        if (detail.value.contract?.contractNo) {
            try {
                await syncContractStatus(detail.value.id);
            }
            catch (e) {
                // 查询爱签失败时不阻断，仅刷新本地数据
                console.warn('同步爱签状态失败:', e?.response?.data?.message ?? e?.message);
            }
        }
        detail.value = await getOrderDetail(detail.value.id);
        const status = detail.value.contract?.status;
        if (status === 'SIGNED') {
            Message.success('合同已签署 ✓');
        }
        else if (status === 'SIGNING') {
            Message.warning('爱签查询仍显示整体未完结，请直接点击上方「✓ 标记客户已签署」手动确认');
        }
        else {
            Message.success('已刷新');
        }
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '刷新失败');
    }
    finally {
        refreshingDetail.value = false;
    }
}
async function openAdjust(id) {
    try {
        const order = await getOrderDetail(id);
        const plan = Array.isArray(order?.repaymentPlan) ? order.repaymentPlan : [];
        const rentPerPeriod = plan.reduce((max, item) => Math.max(max, Number(item.amount || 0)), 0);
        adjustForm.value = {
            orderId: id,
            rentPerPeriod: rentPerPeriod || 0,
            periods: order.periods || 0,
            cycleDays: order.cycleDays || 0,
            reason: ''
        };
        adjustVisible.value = true;
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载订单失败');
    }
}
async function submitAdjust() {
    if (!adjustForm.value.orderId)
        return;
    if (!adjustForm.value.rentPerPeriod)
        return Message.warning('请输入租金/期');
    if (!adjustForm.value.periods)
        return Message.warning('请输入期数');
    if (!adjustForm.value.cycleDays)
        return Message.warning('请输入周期');
    if (!adjustForm.value.reason.trim())
        return Message.warning('请输入调价原因');
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
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '调价失败');
    }
}
onMounted(load);
async function exportOrders() {
    try {
        await downloadCsv('/admin/exports/orders.csv', 'orders.csv');
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '导出失败');
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['kyc-image']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "link" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-toolbar" },
});
const __VLS_0 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onInput': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索客户姓名 / 手机号",
    allowClear: true,
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onInput': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索客户姓名 / 手机号",
    allowClear: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onInput: (__VLS_ctx.onSearch)
};
const __VLS_8 = {
    onClear: (__VLS_ctx.onSearch)
};
var __VLS_3;
const __VLS_9 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onClick': {} },
}));
const __VLS_11 = __VLS_10({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onClick: (__VLS_ctx.exportOrders)
};
__VLS_12.slots.default;
var __VLS_12;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_17 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    ...{ 'onRowClick': {} },
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
    rowClass: "cursor-pointer",
}));
const __VLS_19 = __VLS_18({
    ...{ 'onRowClick': {} },
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
    rowClass: "cursor-pointer",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
let __VLS_21;
let __VLS_22;
let __VLS_23;
const __VLS_24 = {
    onRowClick: ((record) => __VLS_ctx.openDetail(record.id))
};
var __VLS_20;
const __VLS_25 = {}.ADrawer;
/** @type {[typeof __VLS_components.ADrawer, typeof __VLS_components.aDrawer, typeof __VLS_components.ADrawer, typeof __VLS_components.aDrawer, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    visible: (__VLS_ctx.detailVisible),
    width: "600",
    title: "订单详情",
    footer: (false),
}));
const __VLS_27 = __VLS_26({
    visible: (__VLS_ctx.detailVisible),
    width: "600",
    title: "订单详情",
    footer: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
if (__VLS_ctx.detail) {
    const __VLS_29 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        column: (1),
        size: "small",
        bordered: true,
    }));
    const __VLS_31 = __VLS_30({
        column: (1),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    __VLS_32.slots.default;
    const __VLS_33 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        label: "订单ID",
    }));
    const __VLS_35 = __VLS_34({
        label: "订单ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    __VLS_36.slots.default;
    (__VLS_ctx.detail.id);
    var __VLS_36;
    const __VLS_37 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        label: "手机号",
    }));
    const __VLS_39 = __VLS_38({
        label: "手机号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_40.slots.default;
    (__VLS_ctx.detail.phone);
    var __VLS_40;
    const __VLS_41 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        label: "商品",
    }));
    const __VLS_43 = __VLS_42({
        label: "商品",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    __VLS_44.slots.default;
    (__VLS_ctx.detail.productName);
    var __VLS_44;
    const __VLS_45 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        label: "状态",
    }));
    const __VLS_47 = __VLS_46({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    __VLS_48.slots.default;
    (__VLS_ctx.detail.status);
    var __VLS_48;
    const __VLS_49 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        label: "电池配置",
    }));
    const __VLS_51 = __VLS_50({
        label: "电池配置",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    (__VLS_ctx.batteryOptionText(__VLS_ctx.detail.batteryOption));
    var __VLS_52;
    const __VLS_53 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        label: "还款方式",
    }));
    const __VLS_55 = __VLS_54({
        label: "还款方式",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    __VLS_56.slots.default;
    (__VLS_ctx.repaymentMethodText(__VLS_ctx.detail.repaymentMethod));
    var __VLS_56;
    const __VLS_57 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        label: "期数",
    }));
    const __VLS_59 = __VLS_58({
        label: "期数",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    __VLS_60.slots.default;
    (__VLS_ctx.detail.periods);
    var __VLS_60;
    const __VLS_61 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        label: "周期",
    }));
    const __VLS_63 = __VLS_62({
        label: "周期",
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    __VLS_64.slots.default;
    (__VLS_ctx.detail.cycleDays);
    var __VLS_64;
    const __VLS_65 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        label: "合同状态",
    }));
    const __VLS_67 = __VLS_66({
        label: "合同状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    __VLS_68.slots.default;
    (__VLS_ctx.detail.contract?.status || '未发起');
    var __VLS_68;
    const __VLS_69 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        label: "收款状态",
    }));
    const __VLS_71 = __VLS_70({
        label: "收款状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    __VLS_72.slots.default;
    (__VLS_ctx.detail.payment?.status || '未发起');
    var __VLS_72;
    const __VLS_73 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        label: "剩余应还",
    }));
    const __VLS_75 = __VLS_74({
        label: "剩余应还",
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    __VLS_76.slots.default;
    (__VLS_ctx.detail.remainingAmount);
    var __VLS_76;
    var __VLS_32;
    const __VLS_77 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({}));
    const __VLS_79 = __VLS_78({}, ...__VLS_functionalComponentArgsRest(__VLS_78));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.kycCompleted) {
        const __VLS_81 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
            color: "green",
        }));
        const __VLS_83 = __VLS_82({
            color: "green",
        }, ...__VLS_functionalComponentArgsRest(__VLS_82));
        __VLS_84.slots.default;
        var __VLS_84;
    }
    else {
        const __VLS_85 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
            color: "orange",
        }));
        const __VLS_87 = __VLS_86({
            color: "orange",
        }, ...__VLS_functionalComponentArgsRest(__VLS_86));
        __VLS_88.slots.default;
        var __VLS_88;
    }
    if (__VLS_ctx.detail.kycCompleted) {
        const __VLS_89 = {}.ADescriptions;
        /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
        // @ts-ignore
        const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
            column: (2),
            size: "small",
            bordered: true,
        }));
        const __VLS_91 = __VLS_90({
            column: (2),
            size: "small",
            bordered: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_90));
        __VLS_92.slots.default;
        const __VLS_93 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
            label: "真实姓名",
        }));
        const __VLS_95 = __VLS_94({
            label: "真实姓名",
        }, ...__VLS_functionalComponentArgsRest(__VLS_94));
        __VLS_96.slots.default;
        (__VLS_ctx.detail.realName);
        var __VLS_96;
        const __VLS_97 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
            label: "身份证号",
        }));
        const __VLS_99 = __VLS_98({
            label: "身份证号",
        }, ...__VLS_functionalComponentArgsRest(__VLS_98));
        __VLS_100.slots.default;
        (__VLS_ctx.maskIdCard(__VLS_ctx.detail.idCardNumber));
        var __VLS_100;
        const __VLS_101 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
            label: "就业状态",
        }));
        const __VLS_103 = __VLS_102({
            label: "就业状态",
        }, ...__VLS_functionalComponentArgsRest(__VLS_102));
        __VLS_104.slots.default;
        (__VLS_ctx.employmentStatusText(__VLS_ctx.detail.employmentStatus));
        var __VLS_104;
        const __VLS_105 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
            label: "单位/职业",
        }));
        const __VLS_107 = __VLS_106({
            label: "单位/职业",
        }, ...__VLS_functionalComponentArgsRest(__VLS_106));
        __VLS_108.slots.default;
        (__VLS_ctx.detail.employmentName || __VLS_ctx.detail.occupation || '-');
        var __VLS_108;
        const __VLS_109 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
            label: "月收入",
        }));
        const __VLS_111 = __VLS_110({
            label: "月收入",
        }, ...__VLS_functionalComponentArgsRest(__VLS_110));
        __VLS_112.slots.default;
        (__VLS_ctx.incomeRangeText(__VLS_ctx.detail.incomeRangeCode));
        var __VLS_112;
        const __VLS_113 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
            label: "住址",
            span: (2),
        }));
        const __VLS_115 = __VLS_114({
            label: "住址",
            span: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_114));
        __VLS_116.slots.default;
        (__VLS_ctx.formatAddress(__VLS_ctx.detail));
        var __VLS_116;
        const __VLS_117 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
            label: "联系人1",
        }));
        const __VLS_119 = __VLS_118({
            label: "联系人1",
        }, ...__VLS_functionalComponentArgsRest(__VLS_118));
        __VLS_120.slots.default;
        (__VLS_ctx.detail.contactName);
        var __VLS_120;
        const __VLS_121 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({
            label: "联系人1电话",
        }));
        const __VLS_123 = __VLS_122({
            label: "联系人1电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_122));
        __VLS_124.slots.default;
        (__VLS_ctx.detail.contactPhone);
        var __VLS_124;
        const __VLS_125 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_126 = __VLS_asFunctionalComponent(__VLS_125, new __VLS_125({
            label: "联系人1关系",
        }));
        const __VLS_127 = __VLS_126({
            label: "联系人1关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_126));
        __VLS_128.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation));
        var __VLS_128;
        const __VLS_129 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({
            label: "联系人2",
        }));
        const __VLS_131 = __VLS_130({
            label: "联系人2",
        }, ...__VLS_functionalComponentArgsRest(__VLS_130));
        __VLS_132.slots.default;
        (__VLS_ctx.detail.contactName2 || '-');
        var __VLS_132;
        const __VLS_133 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
            label: "联系人2电话",
        }));
        const __VLS_135 = __VLS_134({
            label: "联系人2电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_134));
        __VLS_136.slots.default;
        (__VLS_ctx.detail.contactPhone2 || '-');
        var __VLS_136;
        const __VLS_137 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_138 = __VLS_asFunctionalComponent(__VLS_137, new __VLS_137({
            label: "联系人2关系",
        }));
        const __VLS_139 = __VLS_138({
            label: "联系人2关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_138));
        __VLS_140.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation2));
        var __VLS_140;
        const __VLS_141 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_142 = __VLS_asFunctionalComponent(__VLS_141, new __VLS_141({
            label: "联系人3",
        }));
        const __VLS_143 = __VLS_142({
            label: "联系人3",
        }, ...__VLS_functionalComponentArgsRest(__VLS_142));
        __VLS_144.slots.default;
        (__VLS_ctx.detail.contactName3 || '-');
        var __VLS_144;
        const __VLS_145 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_146 = __VLS_asFunctionalComponent(__VLS_145, new __VLS_145({
            label: "联系人3电话",
        }));
        const __VLS_147 = __VLS_146({
            label: "联系人3电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_146));
        __VLS_148.slots.default;
        (__VLS_ctx.detail.contactPhone3 || '-');
        var __VLS_148;
        const __VLS_149 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_150 = __VLS_asFunctionalComponent(__VLS_149, new __VLS_149({
            label: "联系人3关系",
        }));
        const __VLS_151 = __VLS_150({
            label: "联系人3关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_150));
        __VLS_152.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation3));
        var __VLS_152;
        var __VLS_92;
    }
    if (__VLS_ctx.detail.kycCompleted) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        if (__VLS_ctx.detail.idCardFront) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_153 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_154 = __VLS_asFunctionalComponent(__VLS_153, new __VLS_153({
                src: (__VLS_ctx.detail.idCardFront),
                width: "120",
                height: "80",
                fit: "cover",
            }));
            const __VLS_155 = __VLS_154({
                src: (__VLS_ctx.detail.idCardFront),
                width: "120",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_154));
        }
        if (__VLS_ctx.detail.idCardBack) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_157 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_158 = __VLS_asFunctionalComponent(__VLS_157, new __VLS_157({
                src: (__VLS_ctx.detail.idCardBack),
                width: "120",
                height: "80",
                fit: "cover",
            }));
            const __VLS_159 = __VLS_158({
                src: (__VLS_ctx.detail.idCardBack),
                width: "120",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_158));
        }
        if (__VLS_ctx.detail.facePhoto) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_161 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_162 = __VLS_asFunctionalComponent(__VLS_161, new __VLS_161({
                src: (__VLS_ctx.detail.facePhoto),
                width: "80",
                height: "80",
                fit: "cover",
            }));
            const __VLS_163 = __VLS_162({
                src: (__VLS_ctx.detail.facePhoto),
                width: "80",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_162));
        }
    }
    const __VLS_165 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_166 = __VLS_asFunctionalComponent(__VLS_165, new __VLS_165({}));
    const __VLS_167 = __VLS_166({}, ...__VLS_functionalComponentArgsRest(__VLS_166));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.asignSerialNo) {
        const __VLS_169 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_170 = __VLS_asFunctionalComponent(__VLS_169, new __VLS_169({
            color: "green",
        }));
        const __VLS_171 = __VLS_170({
            color: "green",
        }, ...__VLS_functionalComponentArgsRest(__VLS_170));
        __VLS_172.slots.default;
        var __VLS_172;
    }
    else {
        const __VLS_173 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_174 = __VLS_asFunctionalComponent(__VLS_173, new __VLS_173({
            color: "orange",
        }));
        const __VLS_175 = __VLS_174({
            color: "orange",
        }, ...__VLS_functionalComponentArgsRest(__VLS_174));
        __VLS_176.slots.default;
        var __VLS_176;
    }
    const __VLS_177 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_178 = __VLS_asFunctionalComponent(__VLS_177, new __VLS_177({
        column: (2),
        size: "small",
        bordered: true,
    }));
    const __VLS_179 = __VLS_178({
        column: (2),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_178));
    __VLS_180.slots.default;
    const __VLS_181 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_182 = __VLS_asFunctionalComponent(__VLS_181, new __VLS_181({
        label: "认证流水号",
    }));
    const __VLS_183 = __VLS_182({
        label: "认证流水号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_182));
    __VLS_184.slots.default;
    (__VLS_ctx.detail.asignSerialNo || '-');
    var __VLS_184;
    const __VLS_185 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_186 = __VLS_asFunctionalComponent(__VLS_185, new __VLS_185({
        label: "认证结果",
    }));
    const __VLS_187 = __VLS_186({
        label: "认证结果",
    }, ...__VLS_functionalComponentArgsRest(__VLS_186));
    __VLS_188.slots.default;
    (__VLS_ctx.detail.asignAuthResult || '-');
    var __VLS_188;
    var __VLS_180;
    if (!__VLS_ctx.detail.asignSerialNo && __VLS_ctx.detail.kycCompleted) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_189 = {}.AAlert;
        /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
        // @ts-ignore
        const __VLS_190 = __VLS_asFunctionalComponent(__VLS_189, new __VLS_189({
            type: "warning",
            showIcon: (true),
        }));
        const __VLS_191 = __VLS_190({
            type: "warning",
            showIcon: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_190));
        __VLS_192.slots.default;
        var __VLS_192;
    }
    const __VLS_193 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_194 = __VLS_asFunctionalComponent(__VLS_193, new __VLS_193({}));
    const __VLS_195 = __VLS_194({}, ...__VLS_functionalComponentArgsRest(__VLS_194));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_197 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_198 = __VLS_asFunctionalComponent(__VLS_197, new __VLS_197({
        ...{ 'onClick': {} },
        size: "mini",
        loading: (__VLS_ctx.refreshingDetail),
    }));
    const __VLS_199 = __VLS_198({
        ...{ 'onClick': {} },
        size: "mini",
        loading: (__VLS_ctx.refreshingDetail),
    }, ...__VLS_functionalComponentArgsRest(__VLS_198));
    let __VLS_201;
    let __VLS_202;
    let __VLS_203;
    const __VLS_204 = {
        onClick: (__VLS_ctx.refreshDetail)
    };
    __VLS_200.slots.default;
    var __VLS_200;
    if (__VLS_ctx.detail.contract?.status === 'SIGNING' && __VLS_ctx.isPolling) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: {} },
        });
    }
    if (__VLS_ctx.detail.contract?.status === 'SIGNING') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_205 = {}.AAlert;
        /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
        // @ts-ignore
        const __VLS_206 = __VLS_asFunctionalComponent(__VLS_205, new __VLS_205({
            type: "warning",
            showIcon: (true),
            ...{ style: {} },
        }));
        const __VLS_207 = __VLS_206({
            type: "warning",
            showIcon: (true),
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_206));
        __VLS_208.slots.default;
        {
            const { message: __VLS_thisSlot } = __VLS_208.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        }
        var __VLS_208;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_209 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_210 = __VLS_asFunctionalComponent(__VLS_209, new __VLS_209({
            ...{ 'onClick': {} },
            type: "primary",
            size: "small",
            loading: (__VLS_ctx.refreshingDetail),
        }));
        const __VLS_211 = __VLS_210({
            ...{ 'onClick': {} },
            type: "primary",
            size: "small",
            loading: (__VLS_ctx.refreshingDetail),
        }, ...__VLS_functionalComponentArgsRest(__VLS_210));
        let __VLS_213;
        let __VLS_214;
        let __VLS_215;
        const __VLS_216 = {
            onClick: (__VLS_ctx.refreshDetail)
        };
        __VLS_212.slots.default;
        var __VLS_212;
        const __VLS_217 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_218 = __VLS_asFunctionalComponent(__VLS_217, new __VLS_217({
            ...{ 'onClick': {} },
            status: "success",
            size: "small",
        }));
        const __VLS_219 = __VLS_218({
            ...{ 'onClick': {} },
            status: "success",
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_218));
        let __VLS_221;
        let __VLS_222;
        let __VLS_223;
        const __VLS_224 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.status === 'SIGNING'))
                    return;
                __VLS_ctx.markSigned(__VLS_ctx.detail.id);
            }
        };
        __VLS_220.slots.default;
        var __VLS_220;
    }
    const __VLS_225 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_226 = __VLS_asFunctionalComponent(__VLS_225, new __VLS_225({
        column: (2),
        size: "small",
        bordered: true,
    }));
    const __VLS_227 = __VLS_226({
        column: (2),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_226));
    __VLS_228.slots.default;
    const __VLS_229 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_230 = __VLS_asFunctionalComponent(__VLS_229, new __VLS_229({
        label: "合同编号",
    }));
    const __VLS_231 = __VLS_230({
        label: "合同编号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_230));
    __VLS_232.slots.default;
    (__VLS_ctx.detail.contract?.contractNo || '-');
    var __VLS_232;
    const __VLS_233 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_234 = __VLS_asFunctionalComponent(__VLS_233, new __VLS_233({
        label: "合同状态",
    }));
    const __VLS_235 = __VLS_234({
        label: "合同状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_234));
    __VLS_236.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: (__VLS_ctx.contractStatusStyle(__VLS_ctx.detail.contract?.status)) },
    });
    (__VLS_ctx.contractStatusText(__VLS_ctx.detail.contract?.status));
    if (__VLS_ctx.detail.contract?.customerSigned && __VLS_ctx.detail.contract?.status === 'SIGNING') {
        const __VLS_237 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_238 = __VLS_asFunctionalComponent(__VLS_237, new __VLS_237({
            color: "green",
            ...{ style: {} },
        }));
        const __VLS_239 = __VLS_238({
            color: "green",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_238));
        __VLS_240.slots.default;
        var __VLS_240;
    }
    var __VLS_236;
    const __VLS_241 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_242 = __VLS_asFunctionalComponent(__VLS_241, new __VLS_241({
        label: "签署链接",
        span: (2),
    }));
    const __VLS_243 = __VLS_242({
        label: "签署链接",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_242));
    __VLS_244.slots.default;
    if (__VLS_ctx.detail.contract?.signUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.detail.contract.signUrl);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_244;
    const __VLS_245 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_246 = __VLS_asFunctionalComponent(__VLS_245, new __VLS_245({
        label: "签署时间",
    }));
    const __VLS_247 = __VLS_246({
        label: "签署时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_246));
    __VLS_248.slots.default;
    (__VLS_ctx.detail.contract?.signedAt || '-');
    var __VLS_248;
    const __VLS_249 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_250 = __VLS_asFunctionalComponent(__VLS_249, new __VLS_249({
        label: "签署人",
    }));
    const __VLS_251 = __VLS_250({
        label: "签署人",
    }, ...__VLS_functionalComponentArgsRest(__VLS_250));
    __VLS_252.slots.default;
    (__VLS_ctx.detail.contract?.signedBy || '-');
    var __VLS_252;
    const __VLS_253 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_254 = __VLS_asFunctionalComponent(__VLS_253, new __VLS_253({
        label: "合同文件",
        span: (2),
    }));
    const __VLS_255 = __VLS_254({
        label: "合同文件",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_254));
    __VLS_256.slots.default;
    if (__VLS_ctx.detail.contract?.fileUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.detail.contract.fileUrl);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_256;
    var __VLS_228;
    if (__VLS_ctx.detail.contract?.status === 'SIGNED') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_257 = {}.AAlert;
        /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
        // @ts-ignore
        const __VLS_258 = __VLS_asFunctionalComponent(__VLS_257, new __VLS_257({
            type: "success",
            showIcon: (true),
        }));
        const __VLS_259 = __VLS_258({
            type: "success",
            showIcon: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_258));
        __VLS_260.slots.default;
        var __VLS_260;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.status === 'ACTIVE' && __VLS_ctx.canPrepareContract && __VLS_ctx.detail.asignSerialNo) {
        const __VLS_261 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_262 = __VLS_asFunctionalComponent(__VLS_261, new __VLS_261({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_263 = __VLS_262({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_262));
        let __VLS_265;
        let __VLS_266;
        let __VLS_267;
        const __VLS_268 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.status === 'ACTIVE' && __VLS_ctx.canPrepareContract && __VLS_ctx.detail.asignSerialNo))
                    return;
                __VLS_ctx.prepareContractForOrder(__VLS_ctx.detail.id);
            }
        };
        __VLS_264.slots.default;
        (__VLS_ctx.detail.contract ? '重新生成合同' : '生成合同');
        var __VLS_264;
    }
    if (__VLS_ctx.detail.status === 'ACTIVE' && __VLS_ctx.canPrepareContract && !__VLS_ctx.detail.asignSerialNo) {
        const __VLS_269 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_270 = __VLS_asFunctionalComponent(__VLS_269, new __VLS_269({
            type: "primary",
            disabled: true,
        }));
        const __VLS_271 = __VLS_270({
            type: "primary",
            disabled: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_270));
        __VLS_272.slots.default;
        var __VLS_272;
    }
    if (__VLS_ctx.detail.contract?.signUrl) {
        const __VLS_273 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_274 = __VLS_asFunctionalComponent(__VLS_273, new __VLS_273({
            ...{ 'onClick': {} },
        }));
        const __VLS_275 = __VLS_274({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_274));
        let __VLS_277;
        let __VLS_278;
        let __VLS_279;
        const __VLS_280 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.signUrl))
                    return;
                __VLS_ctx.copyText(__VLS_ctx.detail.contract.signUrl);
            }
        };
        __VLS_276.slots.default;
        var __VLS_276;
    }
    if (__VLS_ctx.detail.contract?.signUrl) {
        const __VLS_281 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_282 = __VLS_asFunctionalComponent(__VLS_281, new __VLS_281({
            ...{ 'onClick': {} },
        }));
        const __VLS_283 = __VLS_282({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_282));
        let __VLS_285;
        let __VLS_286;
        let __VLS_287;
        const __VLS_288 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.signUrl))
                    return;
                __VLS_ctx.showLinkQr('合同签署二维码', __VLS_ctx.detail.contract.signUrl);
            }
        };
        __VLS_284.slots.default;
        var __VLS_284;
    }
    if (__VLS_ctx.detail.contract?.status === 'SIGNING') {
        const __VLS_289 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_290 = __VLS_asFunctionalComponent(__VLS_289, new __VLS_289({
            ...{ 'onClick': {} },
        }));
        const __VLS_291 = __VLS_290({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_290));
        let __VLS_293;
        let __VLS_294;
        let __VLS_295;
        const __VLS_296 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.status === 'SIGNING'))
                    return;
                __VLS_ctx.markSigned(__VLS_ctx.detail.id);
            }
        };
        __VLS_292.slots.default;
        var __VLS_292;
    }
    if (__VLS_ctx.detail.contract?.fileUrl) {
        const __VLS_297 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_298 = __VLS_asFunctionalComponent(__VLS_297, new __VLS_297({
            ...{ 'onClick': {} },
        }));
        const __VLS_299 = __VLS_298({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_298));
        let __VLS_301;
        let __VLS_302;
        let __VLS_303;
        const __VLS_304 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.fileUrl))
                    return;
                __VLS_ctx.openUrl(__VLS_ctx.detail.contract.fileUrl);
            }
        };
        __VLS_300.slots.default;
        var __VLS_300;
    }
    else if (__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.contract?.fileUrl) {
        const __VLS_305 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_306 = __VLS_asFunctionalComponent(__VLS_305, new __VLS_305({
            ...{ 'onClick': {} },
            loading: (__VLS_ctx.downloadingContract),
        }));
        const __VLS_307 = __VLS_306({
            ...{ 'onClick': {} },
            loading: (__VLS_ctx.downloadingContract),
        }, ...__VLS_functionalComponentArgsRest(__VLS_306));
        let __VLS_309;
        let __VLS_310;
        let __VLS_311;
        const __VLS_312 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!!(__VLS_ctx.detail.contract?.fileUrl))
                    return;
                if (!(__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.contract?.fileUrl))
                    return;
                __VLS_ctx.handleDownloadContract(__VLS_ctx.detail.id);
            }
        };
        __VLS_308.slots.default;
        var __VLS_308;
    }
    if (__VLS_ctx.detail.contract) {
        const __VLS_313 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_314 = __VLS_asFunctionalComponent(__VLS_313, new __VLS_313({
            ...{ 'onClick': {} },
            status: "warning",
        }));
        const __VLS_315 = __VLS_314({
            ...{ 'onClick': {} },
            status: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_314));
        let __VLS_317;
        let __VLS_318;
        let __VLS_319;
        const __VLS_320 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract))
                    return;
                __VLS_ctx.resetForTest(__VLS_ctx.detail.id);
            }
        };
        __VLS_316.slots.default;
        var __VLS_316;
    }
    const __VLS_321 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_322 = __VLS_asFunctionalComponent(__VLS_321, new __VLS_321({}));
    const __VLS_323 = __VLS_322({}, ...__VLS_functionalComponentArgsRest(__VLS_322));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_325 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_326 = __VLS_asFunctionalComponent(__VLS_325, new __VLS_325({
        column: (2),
        size: "small",
        bordered: true,
    }));
    const __VLS_327 = __VLS_326({
        column: (2),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_326));
    __VLS_328.slots.default;
    const __VLS_329 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_330 = __VLS_asFunctionalComponent(__VLS_329, new __VLS_329({
        label: "公证状态",
    }));
    const __VLS_331 = __VLS_330({
        label: "公证状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_330));
    __VLS_332.slots.default;
    (__VLS_ctx.notaryStatusText(__VLS_ctx.detail.notaryStatus));
    var __VLS_332;
    const __VLS_333 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_334 = __VLS_asFunctionalComponent(__VLS_333, new __VLS_333({
        label: "公证单号",
    }));
    const __VLS_335 = __VLS_334({
        label: "公证单号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_334));
    __VLS_336.slots.default;
    (__VLS_ctx.detail.notaryOrderNo || '-');
    var __VLS_336;
    const __VLS_337 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_338 = __VLS_asFunctionalComponent(__VLS_337, new __VLS_337({
        label: "出证时间",
    }));
    const __VLS_339 = __VLS_338({
        label: "出证时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_338));
    __VLS_340.slots.default;
    (__VLS_ctx.detail.notaryCertifiedTime || '-');
    var __VLS_340;
    const __VLS_341 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_342 = __VLS_asFunctionalComponent(__VLS_341, new __VLS_341({
        label: "公证员",
    }));
    const __VLS_343 = __VLS_342({
        label: "公证员",
    }, ...__VLS_functionalComponentArgsRest(__VLS_342));
    __VLS_344.slots.default;
    (__VLS_ctx.detail.notaryName || '-');
    var __VLS_344;
    if (__VLS_ctx.notarySignUrl) {
        const __VLS_345 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_346 = __VLS_asFunctionalComponent(__VLS_345, new __VLS_345({
            label: "签署链接",
            span: (2),
        }));
        const __VLS_347 = __VLS_346({
            label: "签署链接",
            span: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_346));
        __VLS_348.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (__VLS_ctx.notarySignUrl),
            target: "_blank",
            ...{ style: {} },
        });
        (__VLS_ctx.notarySignUrl);
        var __VLS_348;
    }
    const __VLS_349 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_350 = __VLS_asFunctionalComponent(__VLS_349, new __VLS_349({
        label: "证书链接",
        span: (2),
    }));
    const __VLS_351 = __VLS_350({
        label: "证书链接",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_350));
    __VLS_352.slots.default;
    if (__VLS_ctx.detail.notaryCertUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.detail.notaryCertUrl);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_352;
    var __VLS_328;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.notaryOrderNo) {
        const __VLS_353 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_354 = __VLS_asFunctionalComponent(__VLS_353, new __VLS_353({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_355 = __VLS_354({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_354));
        let __VLS_357;
        let __VLS_358;
        let __VLS_359;
        const __VLS_360 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.notaryOrderNo))
                    return;
                __VLS_ctx.applyNotaryForOrder(__VLS_ctx.detail.id);
            }
        };
        __VLS_356.slots.default;
        var __VLS_356;
    }
    if (__VLS_ctx.detail.notaryStatus === '20') {
        const __VLS_361 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_362 = __VLS_asFunctionalComponent(__VLS_361, new __VLS_361({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.notarySignLoading),
        }));
        const __VLS_363 = __VLS_362({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.notarySignLoading),
        }, ...__VLS_functionalComponentArgsRest(__VLS_362));
        let __VLS_365;
        let __VLS_366;
        let __VLS_367;
        const __VLS_368 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryStatus === '20'))
                    return;
                __VLS_ctx.getNotarySignUrl(__VLS_ctx.detail.id);
            }
        };
        __VLS_364.slots.default;
        var __VLS_364;
    }
    if (__VLS_ctx.notarySignUrl) {
        const __VLS_369 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_370 = __VLS_asFunctionalComponent(__VLS_369, new __VLS_369({
            ...{ 'onClick': {} },
        }));
        const __VLS_371 = __VLS_370({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_370));
        let __VLS_373;
        let __VLS_374;
        let __VLS_375;
        const __VLS_376 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.notarySignUrl))
                    return;
                __VLS_ctx.copyText(__VLS_ctx.notarySignUrl);
            }
        };
        __VLS_372.slots.default;
        var __VLS_372;
    }
    if (__VLS_ctx.notarySignUrl) {
        const __VLS_377 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_378 = __VLS_asFunctionalComponent(__VLS_377, new __VLS_377({
            ...{ 'onClick': {} },
        }));
        const __VLS_379 = __VLS_378({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_378));
        let __VLS_381;
        let __VLS_382;
        let __VLS_383;
        const __VLS_384 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.notarySignUrl))
                    return;
                __VLS_ctx.showLinkQr('公证签署二维码', __VLS_ctx.notarySignUrl);
            }
        };
        __VLS_380.slots.default;
        var __VLS_380;
    }
    if (__VLS_ctx.detail.notaryOrderNo) {
        const __VLS_385 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_386 = __VLS_asFunctionalComponent(__VLS_385, new __VLS_385({
            ...{ 'onClick': {} },
        }));
        const __VLS_387 = __VLS_386({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_386));
        let __VLS_389;
        let __VLS_390;
        let __VLS_391;
        const __VLS_392 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryOrderNo))
                    return;
                __VLS_ctx.refreshNotaryStatus(__VLS_ctx.detail.id);
            }
        };
        __VLS_388.slots.default;
        var __VLS_388;
    }
    if (__VLS_ctx.detail.notaryOrderNo && __VLS_ctx.detail.notaryStatus === '33') {
        const __VLS_393 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_394 = __VLS_asFunctionalComponent(__VLS_393, new __VLS_393({
            ...{ 'onClick': {} },
        }));
        const __VLS_395 = __VLS_394({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_394));
        let __VLS_397;
        let __VLS_398;
        let __VLS_399;
        const __VLS_400 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryOrderNo && __VLS_ctx.detail.notaryStatus === '33'))
                    return;
                __VLS_ctx.fetchNotaryCert(__VLS_ctx.detail.id);
            }
        };
        __VLS_396.slots.default;
        var __VLS_396;
    }
    if (__VLS_ctx.detail.notaryCertUrl) {
        const __VLS_401 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_402 = __VLS_asFunctionalComponent(__VLS_401, new __VLS_401({
            ...{ 'onClick': {} },
        }));
        const __VLS_403 = __VLS_402({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_402));
        let __VLS_405;
        let __VLS_406;
        let __VLS_407;
        const __VLS_408 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryCertUrl))
                    return;
                __VLS_ctx.openUrl(__VLS_ctx.detail.notaryCertUrl);
            }
        };
        __VLS_404.slots.default;
        var __VLS_404;
    }
    if (__VLS_ctx.detail.notaryStatus === '20') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_409 = {}.AAlert;
        /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
        // @ts-ignore
        const __VLS_410 = __VLS_asFunctionalComponent(__VLS_409, new __VLS_409({
            type: "info",
        }));
        const __VLS_411 = __VLS_410({
            type: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_410));
        __VLS_412.slots.default;
        var __VLS_412;
    }
    const __VLS_413 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_414 = __VLS_asFunctionalComponent(__VLS_413, new __VLS_413({}));
    const __VLS_415 = __VLS_414({}, ...__VLS_functionalComponentArgsRest(__VLS_414));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_417 = {}.ATable;
    /** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
    // @ts-ignore
    const __VLS_418 = __VLS_asFunctionalComponent(__VLS_417, new __VLS_417({
        data: (__VLS_ctx.detail.statusLogs || []),
        pagination: (false),
        size: "small",
    }));
    const __VLS_419 = __VLS_418({
        data: (__VLS_ctx.detail.statusLogs || []),
        pagination: (false),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_418));
    __VLS_420.slots.default;
    const __VLS_421 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_422 = __VLS_asFunctionalComponent(__VLS_421, new __VLS_421({
        title: "时间",
        dataIndex: "at",
    }));
    const __VLS_423 = __VLS_422({
        title: "时间",
        dataIndex: "at",
    }, ...__VLS_functionalComponentArgsRest(__VLS_422));
    const __VLS_425 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_426 = __VLS_asFunctionalComponent(__VLS_425, new __VLS_425({
        title: "动作",
        dataIndex: "action",
    }));
    const __VLS_427 = __VLS_426({
        title: "动作",
        dataIndex: "action",
    }, ...__VLS_functionalComponentArgsRest(__VLS_426));
    const __VLS_429 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_430 = __VLS_asFunctionalComponent(__VLS_429, new __VLS_429({
        title: "状态",
        dataIndex: "status",
    }));
    const __VLS_431 = __VLS_430({
        title: "状态",
        dataIndex: "status",
    }, ...__VLS_functionalComponentArgsRest(__VLS_430));
    const __VLS_433 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_434 = __VLS_asFunctionalComponent(__VLS_433, new __VLS_433({
        title: "来源",
        dataIndex: "by",
    }));
    const __VLS_435 = __VLS_434({
        title: "来源",
        dataIndex: "by",
    }, ...__VLS_functionalComponentArgsRest(__VLS_434));
    var __VLS_420;
}
var __VLS_28;
const __VLS_437 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_438 = __VLS_asFunctionalComponent(__VLS_437, new __VLS_437({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.adjustVisible),
    title: "订单调价",
}));
const __VLS_439 = __VLS_438({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.adjustVisible),
    title: "订单调价",
}, ...__VLS_functionalComponentArgsRest(__VLS_438));
let __VLS_441;
let __VLS_442;
let __VLS_443;
const __VLS_444 = {
    onOk: (__VLS_ctx.submitAdjust)
};
__VLS_440.slots.default;
const __VLS_445 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_446 = __VLS_asFunctionalComponent(__VLS_445, new __VLS_445({
    model: (__VLS_ctx.adjustForm),
    layout: "vertical",
}));
const __VLS_447 = __VLS_446({
    model: (__VLS_ctx.adjustForm),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_446));
__VLS_448.slots.default;
const __VLS_449 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_450 = __VLS_asFunctionalComponent(__VLS_449, new __VLS_449({
    label: "租金/期（元）",
    field: "rentPerPeriod",
}));
const __VLS_451 = __VLS_450({
    label: "租金/期（元）",
    field: "rentPerPeriod",
}, ...__VLS_functionalComponentArgsRest(__VLS_450));
__VLS_452.slots.default;
const __VLS_453 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_454 = __VLS_asFunctionalComponent(__VLS_453, new __VLS_453({
    modelValue: (__VLS_ctx.adjustForm.rentPerPeriod),
    min: (1),
}));
const __VLS_455 = __VLS_454({
    modelValue: (__VLS_ctx.adjustForm.rentPerPeriod),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_454));
var __VLS_452;
const __VLS_457 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_458 = __VLS_asFunctionalComponent(__VLS_457, new __VLS_457({
    label: "期数",
    field: "periods",
}));
const __VLS_459 = __VLS_458({
    label: "期数",
    field: "periods",
}, ...__VLS_functionalComponentArgsRest(__VLS_458));
__VLS_460.slots.default;
const __VLS_461 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_462 = __VLS_asFunctionalComponent(__VLS_461, new __VLS_461({
    modelValue: (__VLS_ctx.adjustForm.periods),
    min: (3),
}));
const __VLS_463 = __VLS_462({
    modelValue: (__VLS_ctx.adjustForm.periods),
    min: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_462));
var __VLS_460;
const __VLS_465 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_466 = __VLS_asFunctionalComponent(__VLS_465, new __VLS_465({
    label: "周期（天）",
    field: "cycleDays",
}));
const __VLS_467 = __VLS_466({
    label: "周期（天）",
    field: "cycleDays",
}, ...__VLS_functionalComponentArgsRest(__VLS_466));
__VLS_468.slots.default;
const __VLS_469 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_470 = __VLS_asFunctionalComponent(__VLS_469, new __VLS_469({
    modelValue: (__VLS_ctx.adjustForm.cycleDays),
    min: (7),
}));
const __VLS_471 = __VLS_470({
    modelValue: (__VLS_ctx.adjustForm.cycleDays),
    min: (7),
}, ...__VLS_functionalComponentArgsRest(__VLS_470));
var __VLS_468;
const __VLS_473 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_474 = __VLS_asFunctionalComponent(__VLS_473, new __VLS_473({
    label: "调价原因",
    field: "reason",
}));
const __VLS_475 = __VLS_474({
    label: "调价原因",
    field: "reason",
}, ...__VLS_functionalComponentArgsRest(__VLS_474));
__VLS_476.slots.default;
const __VLS_477 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_478 = __VLS_asFunctionalComponent(__VLS_477, new __VLS_477({
    modelValue: (__VLS_ctx.adjustForm.reason),
    placeholder: "请输入原因",
}));
const __VLS_479 = __VLS_478({
    modelValue: (__VLS_ctx.adjustForm.reason),
    placeholder: "请输入原因",
}, ...__VLS_functionalComponentArgsRest(__VLS_478));
var __VLS_476;
const __VLS_481 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_482 = __VLS_asFunctionalComponent(__VLS_481, new __VLS_481({
    type: "warning",
    showIcon: (true),
    title: "调价仅限审核前，调价后需重新签合同。",
}));
const __VLS_483 = __VLS_482({
    type: "warning",
    showIcon: (true),
    title: "调价仅限审核前，调价后需重新签合同。",
}, ...__VLS_functionalComponentArgsRest(__VLS_482));
var __VLS_448;
var __VLS_440;
const __VLS_485 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_486 = __VLS_asFunctionalComponent(__VLS_485, new __VLS_485({
    visible: (__VLS_ctx.qrVisible),
    title: (__VLS_ctx.qrTitle),
    footer: (false),
    width: "360",
}));
const __VLS_487 = __VLS_486({
    visible: (__VLS_ctx.qrVisible),
    title: (__VLS_ctx.qrTitle),
    footer: (false),
    width: "360",
}, ...__VLS_functionalComponentArgsRest(__VLS_486));
__VLS_488.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
if (__VLS_ctx.qrImageUrl) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.qrImageUrl),
        alt: "签署二维码",
        ...{ style: {} },
    });
}
if (__VLS_ctx.qrLink) {
    const __VLS_489 = {}.ATypographyParagraph;
    /** @type {[typeof __VLS_components.ATypographyParagraph, typeof __VLS_components.aTypographyParagraph, typeof __VLS_components.ATypographyParagraph, typeof __VLS_components.aTypographyParagraph, ]} */ ;
    // @ts-ignore
    const __VLS_490 = __VLS_asFunctionalComponent(__VLS_489, new __VLS_489({
        copyable: true,
        ...{ style: {} },
    }));
    const __VLS_491 = __VLS_490({
        copyable: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_490));
    __VLS_492.slots.default;
    (__VLS_ctx.qrLink);
    var __VLS_492;
}
var __VLS_488;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['kyc-image']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['kyc-image']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['kyc-image']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            searchKeyword: searchKeyword,
            filteredRows: filteredRows,
            onSearch: onSearch,
            detailVisible: detailVisible,
            detail: detail,
            adjustVisible: adjustVisible,
            adjustForm: adjustForm,
            notarySignUrl: notarySignUrl,
            notarySignLoading: notarySignLoading,
            downloadingContract: downloadingContract,
            refreshingDetail: refreshingDetail,
            isPolling: isPolling,
            canPrepareContract: canPrepareContract,
            contractStatusText: contractStatusText,
            contractStatusStyle: contractStatusStyle,
            qrVisible: qrVisible,
            qrTitle: qrTitle,
            qrLink: qrLink,
            qrImageUrl: qrImageUrl,
            batteryOptionText: batteryOptionText,
            repaymentMethodText: repaymentMethodText,
            maskIdCard: maskIdCard,
            employmentStatusText: employmentStatusText,
            incomeRangeText: incomeRangeText,
            contactRelationText: contactRelationText,
            notaryStatusText: notaryStatusText,
            openUrl: openUrl,
            prepareContractForOrder: prepareContractForOrder,
            markSigned: markSigned,
            handleDownloadContract: handleDownloadContract,
            copyText: copyText,
            showLinkQr: showLinkQr,
            applyNotaryForOrder: applyNotaryForOrder,
            refreshNotaryStatus: refreshNotaryStatus,
            fetchNotaryCert: fetchNotaryCert,
            getNotarySignUrl: getNotarySignUrl,
            formatAddress: formatAddress,
            columns: columns,
            resetForTest: resetForTest,
            openDetail: openDetail,
            refreshDetail: refreshDetail,
            submitAdjust: submitAdjust,
            exportOrders: exportOrders,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
