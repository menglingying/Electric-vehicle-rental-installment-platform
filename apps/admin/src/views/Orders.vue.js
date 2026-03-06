import { computed, h, onMounted, ref } from 'vue';
import { Button, Message, Modal, Input } from '@arco-design/web-vue';
import { adjustOrderPrice, approveOrder, closeOrder, deleteOrder, deliverOrder, getOrderDetail, prepareContract, markContractSigned, downloadContractFile, listOrders, pickupOrder, rejectOrder, resetOrderForTest, returnOrder, settleOrder, applyNotary, refreshNotary, fetchNotaryCertUrl, getNotarySignUrl as getNotarySignUrlApi } from '@/services/api';
import { downloadCsv } from '@/services/download';
import { isSuper } from '@/services/auth';
const rows = ref([]);
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
    { title: 'ID', dataIndex: 'id' },
    { title: '手机号', dataIndex: 'phone' },
    { title: '客户姓名', render: ({ record }) => record.realName || '-' },
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
            return h('span', { style: `color: ${s.color}; font-weight: 500` }, s.text);
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
            const buttons = [];
            buttons.push(h(Button, { size: 'small', onClick: () => openDetail(record.id) }, () => '详情'));
            if (status === 'PENDING_REVIEW') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => approve(record.id) }, () => '通过'));
                buttons.push(h(Button, { status: 'danger', size: 'small', onClick: () => reject(record.id) }, () => '驳回'));
                buttons.push(h(Button, { size: 'small', onClick: () => openAdjust(record.id) }, () => '调价'));
                buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
            }
            else if (status === 'ACTIVE') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => deliver(record.id) }, () => '交付'));
                buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
            }
            else if (status === 'DELIVERED') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => pickup(record.id) }, () => '取车'));
                buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
            }
            else if (status === 'IN_USE') {
                buttons.push(h(Button, { type: 'primary', size: 'small', onClick: () => doReturn(record.id) }, () => '归还'));
                buttons.push(h(Button, { size: 'small', onClick: () => close(record.id) }, () => '关闭'));
            }
            else if (status === 'RETURNED') {
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
const __VLS_0 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.exportOrders)
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_8 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    data: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}));
const __VLS_10 = __VLS_9({
    data: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const __VLS_12 = {}.ADrawer;
/** @type {[typeof __VLS_components.ADrawer, typeof __VLS_components.aDrawer, typeof __VLS_components.ADrawer, typeof __VLS_components.aDrawer, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    visible: (__VLS_ctx.detailVisible),
    width: "600",
    title: "订单详情",
    footer: (false),
}));
const __VLS_14 = __VLS_13({
    visible: (__VLS_ctx.detailVisible),
    width: "600",
    title: "订单详情",
    footer: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
if (__VLS_ctx.detail) {
    const __VLS_16 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        column: (1),
        size: "small",
        bordered: true,
    }));
    const __VLS_18 = __VLS_17({
        column: (1),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    const __VLS_20 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        label: "订单ID",
    }));
    const __VLS_22 = __VLS_21({
        label: "订单ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    (__VLS_ctx.detail.id);
    var __VLS_23;
    const __VLS_24 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        label: "手机号",
    }));
    const __VLS_26 = __VLS_25({
        label: "手机号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    (__VLS_ctx.detail.phone);
    var __VLS_27;
    const __VLS_28 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        label: "商品",
    }));
    const __VLS_30 = __VLS_29({
        label: "商品",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    (__VLS_ctx.detail.productName);
    var __VLS_31;
    const __VLS_32 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        label: "状态",
    }));
    const __VLS_34 = __VLS_33({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    (__VLS_ctx.detail.status);
    var __VLS_35;
    const __VLS_36 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        label: "电池配置",
    }));
    const __VLS_38 = __VLS_37({
        label: "电池配置",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    (__VLS_ctx.batteryOptionText(__VLS_ctx.detail.batteryOption));
    var __VLS_39;
    const __VLS_40 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        label: "还款方式",
    }));
    const __VLS_42 = __VLS_41({
        label: "还款方式",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    (__VLS_ctx.repaymentMethodText(__VLS_ctx.detail.repaymentMethod));
    var __VLS_43;
    const __VLS_44 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        label: "期数",
    }));
    const __VLS_46 = __VLS_45({
        label: "期数",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    (__VLS_ctx.detail.periods);
    var __VLS_47;
    const __VLS_48 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        label: "周期",
    }));
    const __VLS_50 = __VLS_49({
        label: "周期",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    (__VLS_ctx.detail.cycleDays);
    var __VLS_51;
    const __VLS_52 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        label: "合同状态",
    }));
    const __VLS_54 = __VLS_53({
        label: "合同状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (__VLS_ctx.detail.contract?.status || '未发起');
    var __VLS_55;
    const __VLS_56 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        label: "收款状态",
    }));
    const __VLS_58 = __VLS_57({
        label: "收款状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    (__VLS_ctx.detail.payment?.status || '未发起');
    var __VLS_59;
    const __VLS_60 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        label: "剩余应还",
    }));
    const __VLS_62 = __VLS_61({
        label: "剩余应还",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    (__VLS_ctx.detail.remainingAmount);
    var __VLS_63;
    var __VLS_19;
    const __VLS_64 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({}));
    const __VLS_66 = __VLS_65({}, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.kycCompleted) {
        const __VLS_68 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
            color: "green",
        }));
        const __VLS_70 = __VLS_69({
            color: "green",
        }, ...__VLS_functionalComponentArgsRest(__VLS_69));
        __VLS_71.slots.default;
        var __VLS_71;
    }
    else {
        const __VLS_72 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
            color: "orange",
        }));
        const __VLS_74 = __VLS_73({
            color: "orange",
        }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        __VLS_75.slots.default;
        var __VLS_75;
    }
    if (__VLS_ctx.detail.kycCompleted) {
        const __VLS_76 = {}.ADescriptions;
        /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
            column: (2),
            size: "small",
            bordered: true,
        }));
        const __VLS_78 = __VLS_77({
            column: (2),
            size: "small",
            bordered: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_77));
        __VLS_79.slots.default;
        const __VLS_80 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            label: "真实姓名",
        }));
        const __VLS_82 = __VLS_81({
            label: "真实姓名",
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        (__VLS_ctx.detail.realName);
        var __VLS_83;
        const __VLS_84 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
            label: "身份证号",
        }));
        const __VLS_86 = __VLS_85({
            label: "身份证号",
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        __VLS_87.slots.default;
        (__VLS_ctx.maskIdCard(__VLS_ctx.detail.idCardNumber));
        var __VLS_87;
        const __VLS_88 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
            label: "就业状态",
        }));
        const __VLS_90 = __VLS_89({
            label: "就业状态",
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        __VLS_91.slots.default;
        (__VLS_ctx.employmentStatusText(__VLS_ctx.detail.employmentStatus));
        var __VLS_91;
        const __VLS_92 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
            label: "单位/职业",
        }));
        const __VLS_94 = __VLS_93({
            label: "单位/职业",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        __VLS_95.slots.default;
        (__VLS_ctx.detail.employmentName || __VLS_ctx.detail.occupation || '-');
        var __VLS_95;
        const __VLS_96 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            label: "月收入",
        }));
        const __VLS_98 = __VLS_97({
            label: "月收入",
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        __VLS_99.slots.default;
        (__VLS_ctx.incomeRangeText(__VLS_ctx.detail.incomeRangeCode));
        var __VLS_99;
        const __VLS_100 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            label: "住址",
            span: (2),
        }));
        const __VLS_102 = __VLS_101({
            label: "住址",
            span: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        __VLS_103.slots.default;
        (__VLS_ctx.formatAddress(__VLS_ctx.detail));
        var __VLS_103;
        const __VLS_104 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
            label: "联系人1",
        }));
        const __VLS_106 = __VLS_105({
            label: "联系人1",
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        __VLS_107.slots.default;
        (__VLS_ctx.detail.contactName);
        var __VLS_107;
        const __VLS_108 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
            label: "联系人1电话",
        }));
        const __VLS_110 = __VLS_109({
            label: "联系人1电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        __VLS_111.slots.default;
        (__VLS_ctx.detail.contactPhone);
        var __VLS_111;
        const __VLS_112 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
            label: "联系人1关系",
        }));
        const __VLS_114 = __VLS_113({
            label: "联系人1关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        __VLS_115.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation));
        var __VLS_115;
        const __VLS_116 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            label: "联系人2",
        }));
        const __VLS_118 = __VLS_117({
            label: "联系人2",
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        __VLS_119.slots.default;
        (__VLS_ctx.detail.contactName2 || '-');
        var __VLS_119;
        const __VLS_120 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
            label: "联系人2电话",
        }));
        const __VLS_122 = __VLS_121({
            label: "联系人2电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_121));
        __VLS_123.slots.default;
        (__VLS_ctx.detail.contactPhone2 || '-');
        var __VLS_123;
        const __VLS_124 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            label: "联系人2关系",
        }));
        const __VLS_126 = __VLS_125({
            label: "联系人2关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        __VLS_127.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation2));
        var __VLS_127;
        const __VLS_128 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
            label: "联系人3",
        }));
        const __VLS_130 = __VLS_129({
            label: "联系人3",
        }, ...__VLS_functionalComponentArgsRest(__VLS_129));
        __VLS_131.slots.default;
        (__VLS_ctx.detail.contactName3 || '-');
        var __VLS_131;
        const __VLS_132 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
            label: "联系人3电话",
        }));
        const __VLS_134 = __VLS_133({
            label: "联系人3电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_133));
        __VLS_135.slots.default;
        (__VLS_ctx.detail.contactPhone3 || '-');
        var __VLS_135;
        const __VLS_136 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
            label: "联系人3关系",
        }));
        const __VLS_138 = __VLS_137({
            label: "联系人3关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_137));
        __VLS_139.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation3));
        var __VLS_139;
        var __VLS_79;
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
            const __VLS_140 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
                src: (__VLS_ctx.detail.idCardFront),
                width: "120",
                height: "80",
                fit: "cover",
            }));
            const __VLS_142 = __VLS_141({
                src: (__VLS_ctx.detail.idCardFront),
                width: "120",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        }
        if (__VLS_ctx.detail.idCardBack) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_144 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
                src: (__VLS_ctx.detail.idCardBack),
                width: "120",
                height: "80",
                fit: "cover",
            }));
            const __VLS_146 = __VLS_145({
                src: (__VLS_ctx.detail.idCardBack),
                width: "120",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_145));
        }
        if (__VLS_ctx.detail.facePhoto) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_148 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
                src: (__VLS_ctx.detail.facePhoto),
                width: "80",
                height: "80",
                fit: "cover",
            }));
            const __VLS_150 = __VLS_149({
                src: (__VLS_ctx.detail.facePhoto),
                width: "80",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_149));
        }
    }
    const __VLS_152 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({}));
    const __VLS_154 = __VLS_153({}, ...__VLS_functionalComponentArgsRest(__VLS_153));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.asignSerialNo) {
        const __VLS_156 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
            color: "green",
        }));
        const __VLS_158 = __VLS_157({
            color: "green",
        }, ...__VLS_functionalComponentArgsRest(__VLS_157));
        __VLS_159.slots.default;
        var __VLS_159;
    }
    else {
        const __VLS_160 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
            color: "orange",
        }));
        const __VLS_162 = __VLS_161({
            color: "orange",
        }, ...__VLS_functionalComponentArgsRest(__VLS_161));
        __VLS_163.slots.default;
        var __VLS_163;
    }
    const __VLS_164 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        column: (2),
        size: "small",
        bordered: true,
    }));
    const __VLS_166 = __VLS_165({
        column: (2),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    __VLS_167.slots.default;
    const __VLS_168 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
        label: "认证流水号",
    }));
    const __VLS_170 = __VLS_169({
        label: "认证流水号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_169));
    __VLS_171.slots.default;
    (__VLS_ctx.detail.asignSerialNo || '-');
    var __VLS_171;
    const __VLS_172 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
        label: "认证结果",
    }));
    const __VLS_174 = __VLS_173({
        label: "认证结果",
    }, ...__VLS_functionalComponentArgsRest(__VLS_173));
    __VLS_175.slots.default;
    (__VLS_ctx.detail.asignAuthResult || '-');
    var __VLS_175;
    var __VLS_167;
    if (!__VLS_ctx.detail.asignSerialNo && __VLS_ctx.detail.kycCompleted) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_176 = {}.AAlert;
        /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
        // @ts-ignore
        const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
            type: "warning",
            showIcon: (true),
        }));
        const __VLS_178 = __VLS_177({
            type: "warning",
            showIcon: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_177));
        __VLS_179.slots.default;
        var __VLS_179;
    }
    const __VLS_180 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({}));
    const __VLS_182 = __VLS_181({}, ...__VLS_functionalComponentArgsRest(__VLS_181));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_184 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
        column: (2),
        size: "small",
        bordered: true,
    }));
    const __VLS_186 = __VLS_185({
        column: (2),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_185));
    __VLS_187.slots.default;
    const __VLS_188 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
        label: "合同编号",
    }));
    const __VLS_190 = __VLS_189({
        label: "合同编号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_189));
    __VLS_191.slots.default;
    (__VLS_ctx.detail.contract?.contractNo || '-');
    var __VLS_191;
    const __VLS_192 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
        label: "合同状态",
    }));
    const __VLS_194 = __VLS_193({
        label: "合同状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_193));
    __VLS_195.slots.default;
    (__VLS_ctx.detail.contract?.status || '未发起');
    var __VLS_195;
    const __VLS_196 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
        label: "签署链接",
        span: (2),
    }));
    const __VLS_198 = __VLS_197({
        label: "签署链接",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_197));
    __VLS_199.slots.default;
    if (__VLS_ctx.detail.contract?.signUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.detail.contract.signUrl);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_199;
    const __VLS_200 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
        label: "签署时间",
    }));
    const __VLS_202 = __VLS_201({
        label: "签署时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_201));
    __VLS_203.slots.default;
    (__VLS_ctx.detail.contract?.signedAt || '-');
    var __VLS_203;
    const __VLS_204 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
        label: "签署人",
    }));
    const __VLS_206 = __VLS_205({
        label: "签署人",
    }, ...__VLS_functionalComponentArgsRest(__VLS_205));
    __VLS_207.slots.default;
    (__VLS_ctx.detail.contract?.signedBy || '-');
    var __VLS_207;
    const __VLS_208 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
        label: "合同文件",
        span: (2),
    }));
    const __VLS_210 = __VLS_209({
        label: "合同文件",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_209));
    __VLS_211.slots.default;
    if (__VLS_ctx.detail.contract?.fileUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.detail.contract.fileUrl);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_211;
    var __VLS_187;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.status === 'ACTIVE' && !__VLS_ctx.detail.contract && __VLS_ctx.detail.asignSerialNo) {
        const __VLS_212 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_214 = __VLS_213({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_213));
        let __VLS_216;
        let __VLS_217;
        let __VLS_218;
        const __VLS_219 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.status === 'ACTIVE' && !__VLS_ctx.detail.contract && __VLS_ctx.detail.asignSerialNo))
                    return;
                __VLS_ctx.prepareContractForOrder(__VLS_ctx.detail.id);
            }
        };
        __VLS_215.slots.default;
        var __VLS_215;
    }
    if (__VLS_ctx.detail.status === 'ACTIVE' && !__VLS_ctx.detail.contract && !__VLS_ctx.detail.asignSerialNo) {
        const __VLS_220 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
            type: "primary",
            disabled: true,
        }));
        const __VLS_222 = __VLS_221({
            type: "primary",
            disabled: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_221));
        __VLS_223.slots.default;
        var __VLS_223;
    }
    if (__VLS_ctx.detail.contract?.signUrl) {
        const __VLS_224 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
            ...{ 'onClick': {} },
        }));
        const __VLS_226 = __VLS_225({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_225));
        let __VLS_228;
        let __VLS_229;
        let __VLS_230;
        const __VLS_231 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.signUrl))
                    return;
                __VLS_ctx.copyText(__VLS_ctx.detail.contract.signUrl);
            }
        };
        __VLS_227.slots.default;
        var __VLS_227;
    }
    if (__VLS_ctx.detail.contract?.signUrl) {
        const __VLS_232 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
            ...{ 'onClick': {} },
        }));
        const __VLS_234 = __VLS_233({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_233));
        let __VLS_236;
        let __VLS_237;
        let __VLS_238;
        const __VLS_239 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.signUrl))
                    return;
                __VLS_ctx.showLinkQr('合同签署二维码', __VLS_ctx.detail.contract.signUrl);
            }
        };
        __VLS_235.slots.default;
        var __VLS_235;
    }
    if (__VLS_ctx.detail.contract?.status === 'SIGNING') {
        const __VLS_240 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
            ...{ 'onClick': {} },
        }));
        const __VLS_242 = __VLS_241({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_241));
        let __VLS_244;
        let __VLS_245;
        let __VLS_246;
        const __VLS_247 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.status === 'SIGNING'))
                    return;
                __VLS_ctx.markSigned(__VLS_ctx.detail.id);
            }
        };
        __VLS_243.slots.default;
        var __VLS_243;
    }
    if (__VLS_ctx.detail.contract?.fileUrl) {
        const __VLS_248 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
            ...{ 'onClick': {} },
        }));
        const __VLS_250 = __VLS_249({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_249));
        let __VLS_252;
        let __VLS_253;
        let __VLS_254;
        const __VLS_255 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.fileUrl))
                    return;
                __VLS_ctx.openUrl(__VLS_ctx.detail.contract.fileUrl);
            }
        };
        __VLS_251.slots.default;
        var __VLS_251;
    }
    else if (__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.contract?.fileUrl) {
        const __VLS_256 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_257 = __VLS_asFunctionalComponent(__VLS_256, new __VLS_256({
            ...{ 'onClick': {} },
            loading: (__VLS_ctx.downloadingContract),
        }));
        const __VLS_258 = __VLS_257({
            ...{ 'onClick': {} },
            loading: (__VLS_ctx.downloadingContract),
        }, ...__VLS_functionalComponentArgsRest(__VLS_257));
        let __VLS_260;
        let __VLS_261;
        let __VLS_262;
        const __VLS_263 = {
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
        __VLS_259.slots.default;
        var __VLS_259;
    }
    if (__VLS_ctx.detail.contract) {
        const __VLS_264 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_265 = __VLS_asFunctionalComponent(__VLS_264, new __VLS_264({
            ...{ 'onClick': {} },
            status: "warning",
        }));
        const __VLS_266 = __VLS_265({
            ...{ 'onClick': {} },
            status: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_265));
        let __VLS_268;
        let __VLS_269;
        let __VLS_270;
        const __VLS_271 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract))
                    return;
                __VLS_ctx.resetForTest(__VLS_ctx.detail.id);
            }
        };
        __VLS_267.slots.default;
        var __VLS_267;
    }
    const __VLS_272 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_273 = __VLS_asFunctionalComponent(__VLS_272, new __VLS_272({}));
    const __VLS_274 = __VLS_273({}, ...__VLS_functionalComponentArgsRest(__VLS_273));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_276 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_277 = __VLS_asFunctionalComponent(__VLS_276, new __VLS_276({
        column: (2),
        size: "small",
        bordered: true,
    }));
    const __VLS_278 = __VLS_277({
        column: (2),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_277));
    __VLS_279.slots.default;
    const __VLS_280 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_281 = __VLS_asFunctionalComponent(__VLS_280, new __VLS_280({
        label: "公证状态",
    }));
    const __VLS_282 = __VLS_281({
        label: "公证状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_281));
    __VLS_283.slots.default;
    (__VLS_ctx.notaryStatusText(__VLS_ctx.detail.notaryStatus));
    var __VLS_283;
    const __VLS_284 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_285 = __VLS_asFunctionalComponent(__VLS_284, new __VLS_284({
        label: "公证单号",
    }));
    const __VLS_286 = __VLS_285({
        label: "公证单号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_285));
    __VLS_287.slots.default;
    (__VLS_ctx.detail.notaryOrderNo || '-');
    var __VLS_287;
    const __VLS_288 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_289 = __VLS_asFunctionalComponent(__VLS_288, new __VLS_288({
        label: "出证时间",
    }));
    const __VLS_290 = __VLS_289({
        label: "出证时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_289));
    __VLS_291.slots.default;
    (__VLS_ctx.detail.notaryCertifiedTime || '-');
    var __VLS_291;
    const __VLS_292 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_293 = __VLS_asFunctionalComponent(__VLS_292, new __VLS_292({
        label: "公证员",
    }));
    const __VLS_294 = __VLS_293({
        label: "公证员",
    }, ...__VLS_functionalComponentArgsRest(__VLS_293));
    __VLS_295.slots.default;
    (__VLS_ctx.detail.notaryName || '-');
    var __VLS_295;
    if (__VLS_ctx.notarySignUrl) {
        const __VLS_296 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_297 = __VLS_asFunctionalComponent(__VLS_296, new __VLS_296({
            label: "签署链接",
            span: (2),
        }));
        const __VLS_298 = __VLS_297({
            label: "签署链接",
            span: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_297));
        __VLS_299.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (__VLS_ctx.notarySignUrl),
            target: "_blank",
            ...{ style: {} },
        });
        (__VLS_ctx.notarySignUrl);
        var __VLS_299;
    }
    const __VLS_300 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_301 = __VLS_asFunctionalComponent(__VLS_300, new __VLS_300({
        label: "证书链接",
        span: (2),
    }));
    const __VLS_302 = __VLS_301({
        label: "证书链接",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_301));
    __VLS_303.slots.default;
    if (__VLS_ctx.detail.notaryCertUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.detail.notaryCertUrl);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    var __VLS_303;
    var __VLS_279;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.notaryOrderNo) {
        const __VLS_304 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_305 = __VLS_asFunctionalComponent(__VLS_304, new __VLS_304({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_306 = __VLS_305({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_305));
        let __VLS_308;
        let __VLS_309;
        let __VLS_310;
        const __VLS_311 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.contract?.status === 'SIGNED' && !__VLS_ctx.detail.notaryOrderNo))
                    return;
                __VLS_ctx.applyNotaryForOrder(__VLS_ctx.detail.id);
            }
        };
        __VLS_307.slots.default;
        var __VLS_307;
    }
    if (__VLS_ctx.detail.notaryStatus === '20') {
        const __VLS_312 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_313 = __VLS_asFunctionalComponent(__VLS_312, new __VLS_312({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.notarySignLoading),
        }));
        const __VLS_314 = __VLS_313({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.notarySignLoading),
        }, ...__VLS_functionalComponentArgsRest(__VLS_313));
        let __VLS_316;
        let __VLS_317;
        let __VLS_318;
        const __VLS_319 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryStatus === '20'))
                    return;
                __VLS_ctx.getNotarySignUrl(__VLS_ctx.detail.id);
            }
        };
        __VLS_315.slots.default;
        var __VLS_315;
    }
    if (__VLS_ctx.notarySignUrl) {
        const __VLS_320 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_321 = __VLS_asFunctionalComponent(__VLS_320, new __VLS_320({
            ...{ 'onClick': {} },
        }));
        const __VLS_322 = __VLS_321({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_321));
        let __VLS_324;
        let __VLS_325;
        let __VLS_326;
        const __VLS_327 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.notarySignUrl))
                    return;
                __VLS_ctx.copyText(__VLS_ctx.notarySignUrl);
            }
        };
        __VLS_323.slots.default;
        var __VLS_323;
    }
    if (__VLS_ctx.notarySignUrl) {
        const __VLS_328 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_329 = __VLS_asFunctionalComponent(__VLS_328, new __VLS_328({
            ...{ 'onClick': {} },
        }));
        const __VLS_330 = __VLS_329({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_329));
        let __VLS_332;
        let __VLS_333;
        let __VLS_334;
        const __VLS_335 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.notarySignUrl))
                    return;
                __VLS_ctx.showLinkQr('公证签署二维码', __VLS_ctx.notarySignUrl);
            }
        };
        __VLS_331.slots.default;
        var __VLS_331;
    }
    if (__VLS_ctx.detail.notaryOrderNo) {
        const __VLS_336 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_337 = __VLS_asFunctionalComponent(__VLS_336, new __VLS_336({
            ...{ 'onClick': {} },
        }));
        const __VLS_338 = __VLS_337({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_337));
        let __VLS_340;
        let __VLS_341;
        let __VLS_342;
        const __VLS_343 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryOrderNo))
                    return;
                __VLS_ctx.refreshNotaryStatus(__VLS_ctx.detail.id);
            }
        };
        __VLS_339.slots.default;
        var __VLS_339;
    }
    if (__VLS_ctx.detail.notaryOrderNo && __VLS_ctx.detail.notaryStatus === '33') {
        const __VLS_344 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_345 = __VLS_asFunctionalComponent(__VLS_344, new __VLS_344({
            ...{ 'onClick': {} },
        }));
        const __VLS_346 = __VLS_345({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_345));
        let __VLS_348;
        let __VLS_349;
        let __VLS_350;
        const __VLS_351 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryOrderNo && __VLS_ctx.detail.notaryStatus === '33'))
                    return;
                __VLS_ctx.fetchNotaryCert(__VLS_ctx.detail.id);
            }
        };
        __VLS_347.slots.default;
        var __VLS_347;
    }
    if (__VLS_ctx.detail.notaryCertUrl) {
        const __VLS_352 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_353 = __VLS_asFunctionalComponent(__VLS_352, new __VLS_352({
            ...{ 'onClick': {} },
        }));
        const __VLS_354 = __VLS_353({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_353));
        let __VLS_356;
        let __VLS_357;
        let __VLS_358;
        const __VLS_359 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.detail))
                    return;
                if (!(__VLS_ctx.detail.notaryCertUrl))
                    return;
                __VLS_ctx.openUrl(__VLS_ctx.detail.notaryCertUrl);
            }
        };
        __VLS_355.slots.default;
        var __VLS_355;
    }
    if (__VLS_ctx.detail.notaryStatus === '20') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_360 = {}.AAlert;
        /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
        // @ts-ignore
        const __VLS_361 = __VLS_asFunctionalComponent(__VLS_360, new __VLS_360({
            type: "info",
        }));
        const __VLS_362 = __VLS_361({
            type: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_361));
        __VLS_363.slots.default;
        var __VLS_363;
    }
    const __VLS_364 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_365 = __VLS_asFunctionalComponent(__VLS_364, new __VLS_364({}));
    const __VLS_366 = __VLS_365({}, ...__VLS_functionalComponentArgsRest(__VLS_365));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_368 = {}.ATable;
    /** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
    // @ts-ignore
    const __VLS_369 = __VLS_asFunctionalComponent(__VLS_368, new __VLS_368({
        data: (__VLS_ctx.detail.statusLogs || []),
        pagination: (false),
        size: "small",
    }));
    const __VLS_370 = __VLS_369({
        data: (__VLS_ctx.detail.statusLogs || []),
        pagination: (false),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_369));
    __VLS_371.slots.default;
    const __VLS_372 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_373 = __VLS_asFunctionalComponent(__VLS_372, new __VLS_372({
        title: "时间",
        dataIndex: "at",
    }));
    const __VLS_374 = __VLS_373({
        title: "时间",
        dataIndex: "at",
    }, ...__VLS_functionalComponentArgsRest(__VLS_373));
    const __VLS_376 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_377 = __VLS_asFunctionalComponent(__VLS_376, new __VLS_376({
        title: "动作",
        dataIndex: "action",
    }));
    const __VLS_378 = __VLS_377({
        title: "动作",
        dataIndex: "action",
    }, ...__VLS_functionalComponentArgsRest(__VLS_377));
    const __VLS_380 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_381 = __VLS_asFunctionalComponent(__VLS_380, new __VLS_380({
        title: "状态",
        dataIndex: "status",
    }));
    const __VLS_382 = __VLS_381({
        title: "状态",
        dataIndex: "status",
    }, ...__VLS_functionalComponentArgsRest(__VLS_381));
    const __VLS_384 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_385 = __VLS_asFunctionalComponent(__VLS_384, new __VLS_384({
        title: "来源",
        dataIndex: "by",
    }));
    const __VLS_386 = __VLS_385({
        title: "来源",
        dataIndex: "by",
    }, ...__VLS_functionalComponentArgsRest(__VLS_385));
    var __VLS_371;
}
var __VLS_15;
const __VLS_388 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_389 = __VLS_asFunctionalComponent(__VLS_388, new __VLS_388({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.adjustVisible),
    title: "订单调价",
}));
const __VLS_390 = __VLS_389({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.adjustVisible),
    title: "订单调价",
}, ...__VLS_functionalComponentArgsRest(__VLS_389));
let __VLS_392;
let __VLS_393;
let __VLS_394;
const __VLS_395 = {
    onOk: (__VLS_ctx.submitAdjust)
};
__VLS_391.slots.default;
const __VLS_396 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_397 = __VLS_asFunctionalComponent(__VLS_396, new __VLS_396({
    model: (__VLS_ctx.adjustForm),
    layout: "vertical",
}));
const __VLS_398 = __VLS_397({
    model: (__VLS_ctx.adjustForm),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_397));
__VLS_399.slots.default;
const __VLS_400 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_401 = __VLS_asFunctionalComponent(__VLS_400, new __VLS_400({
    label: "租金/期（元）",
    field: "rentPerPeriod",
}));
const __VLS_402 = __VLS_401({
    label: "租金/期（元）",
    field: "rentPerPeriod",
}, ...__VLS_functionalComponentArgsRest(__VLS_401));
__VLS_403.slots.default;
const __VLS_404 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_405 = __VLS_asFunctionalComponent(__VLS_404, new __VLS_404({
    modelValue: (__VLS_ctx.adjustForm.rentPerPeriod),
    min: (1),
}));
const __VLS_406 = __VLS_405({
    modelValue: (__VLS_ctx.adjustForm.rentPerPeriod),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_405));
var __VLS_403;
const __VLS_408 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_409 = __VLS_asFunctionalComponent(__VLS_408, new __VLS_408({
    label: "期数",
    field: "periods",
}));
const __VLS_410 = __VLS_409({
    label: "期数",
    field: "periods",
}, ...__VLS_functionalComponentArgsRest(__VLS_409));
__VLS_411.slots.default;
const __VLS_412 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_413 = __VLS_asFunctionalComponent(__VLS_412, new __VLS_412({
    modelValue: (__VLS_ctx.adjustForm.periods),
    min: (3),
}));
const __VLS_414 = __VLS_413({
    modelValue: (__VLS_ctx.adjustForm.periods),
    min: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_413));
var __VLS_411;
const __VLS_416 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_417 = __VLS_asFunctionalComponent(__VLS_416, new __VLS_416({
    label: "周期（天）",
    field: "cycleDays",
}));
const __VLS_418 = __VLS_417({
    label: "周期（天）",
    field: "cycleDays",
}, ...__VLS_functionalComponentArgsRest(__VLS_417));
__VLS_419.slots.default;
const __VLS_420 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_421 = __VLS_asFunctionalComponent(__VLS_420, new __VLS_420({
    modelValue: (__VLS_ctx.adjustForm.cycleDays),
    min: (7),
}));
const __VLS_422 = __VLS_421({
    modelValue: (__VLS_ctx.adjustForm.cycleDays),
    min: (7),
}, ...__VLS_functionalComponentArgsRest(__VLS_421));
var __VLS_419;
const __VLS_424 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_425 = __VLS_asFunctionalComponent(__VLS_424, new __VLS_424({
    label: "调价原因",
    field: "reason",
}));
const __VLS_426 = __VLS_425({
    label: "调价原因",
    field: "reason",
}, ...__VLS_functionalComponentArgsRest(__VLS_425));
__VLS_427.slots.default;
const __VLS_428 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_429 = __VLS_asFunctionalComponent(__VLS_428, new __VLS_428({
    modelValue: (__VLS_ctx.adjustForm.reason),
    placeholder: "请输入原因",
}));
const __VLS_430 = __VLS_429({
    modelValue: (__VLS_ctx.adjustForm.reason),
    placeholder: "请输入原因",
}, ...__VLS_functionalComponentArgsRest(__VLS_429));
var __VLS_427;
const __VLS_432 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_433 = __VLS_asFunctionalComponent(__VLS_432, new __VLS_432({
    type: "warning",
    showIcon: (true),
    title: "调价仅限审核前，调价后需重新签合同。",
}));
const __VLS_434 = __VLS_433({
    type: "warning",
    showIcon: (true),
    title: "调价仅限审核前，调价后需重新签合同。",
}, ...__VLS_functionalComponentArgsRest(__VLS_433));
var __VLS_399;
var __VLS_391;
const __VLS_436 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_437 = __VLS_asFunctionalComponent(__VLS_436, new __VLS_436({
    visible: (__VLS_ctx.qrVisible),
    title: (__VLS_ctx.qrTitle),
    footer: (false),
    width: "360",
}));
const __VLS_438 = __VLS_437({
    visible: (__VLS_ctx.qrVisible),
    title: (__VLS_ctx.qrTitle),
    footer: (false),
    width: "360",
}, ...__VLS_functionalComponentArgsRest(__VLS_437));
__VLS_439.slots.default;
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
    const __VLS_440 = {}.ATypographyParagraph;
    /** @type {[typeof __VLS_components.ATypographyParagraph, typeof __VLS_components.aTypographyParagraph, typeof __VLS_components.ATypographyParagraph, typeof __VLS_components.aTypographyParagraph, ]} */ ;
    // @ts-ignore
    const __VLS_441 = __VLS_asFunctionalComponent(__VLS_440, new __VLS_440({
        copyable: true,
        ...{ style: {} },
    }));
    const __VLS_442 = __VLS_441({
        copyable: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_441));
    __VLS_443.slots.default;
    (__VLS_ctx.qrLink);
    var __VLS_443;
}
var __VLS_439;
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
            rows: rows,
            detailVisible: detailVisible,
            detail: detail,
            adjustVisible: adjustVisible,
            adjustForm: adjustForm,
            notarySignUrl: notarySignUrl,
            notarySignLoading: notarySignLoading,
            downloadingContract: downloadingContract,
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
