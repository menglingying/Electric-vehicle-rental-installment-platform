import { h, onMounted, ref } from 'vue';
import { Button, Message, Modal, Input } from '@arco-design/web-vue';
import { adjustOrderPrice, approveOrder, closeOrder, deliverOrder, getOrderDetail, listOrders, pickupOrder, rejectOrder, returnOrder, settleOrder } from '@/services/api';
import { downloadCsv } from '@/services/download';
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
// 辅助函数：电池配置文本
function batteryOptionText(option) {
    const map = {
        'WITHOUT_BATTERY': '空车',
        'WITH_BATTERY': '含电池'
    };
    return map[option] || option || '-';
}
// 辅助函数：还款方式文本
function repaymentMethodText(method) {
    const map = {
        'AUTO_DEDUCT': '自动扣款',
        'MANUAL_TRANSFER': '手动转账',
        'OFFLINE': '线下收款'
    };
    return map[method] || method || '-';
}
// 辅助函数：身份证号脱敏
function maskIdCard(idCard) {
    if (!idCard || idCard.length < 10)
        return idCard || '-';
    return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}
function employmentStatusText(code) {
    const map = {
        employed: '\u5168\u804c',
        part_time: '\u517c\u804c',
        freelancer: '\u81ea\u7531\u804c\u4e1a',
        self_employed: '\u4e2a\u4f53\u7ecf\u8425',
        student: '\u5b66\u751f',
        unemployed: '\u5168\u804c',
        retired: '\u9000\u4f11'
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
        parent: '\u7236\u6bcd',
        spouse: '\u914d\u5076',
        child: '\u5b50\u5973',
        colleague: '\u540c\u4e8b',
        friend: '\u670b\u53cb',
        other: '\u5176\u4ed6'
    };
    return map[code] || code || '-';
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
    { title: '商品', dataIndex: 'productName' },
    { title: '电池配置', render: ({ record }) => batteryOptionText(record.batteryOption) },
    { title: '还款方式', render: ({ record }) => repaymentMethodText(record.repaymentMethod) },
    {
        title: 'KYC',
        render: ({ record }) => h('span', { style: record.kycCompleted ? 'color: green' : 'color: orange' }, record.kycCompleted ? '已完成' : '未完成')
    },
    { title: '状态', dataIndex: 'status' },
    { title: '期数', dataIndex: 'periods' },
    { title: '创建时间', dataIndex: 'createdAt' },
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
async function openDetail(id) {
    try {
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
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: "订单管理（人工审核 + 履约）",
}));
const __VLS_2 = __VLS_1({
    title: "订单管理（人工审核 + 履约）",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_4 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.exportOrders)
};
__VLS_7.slots.default;
var __VLS_7;
const __VLS_12 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    data: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}));
const __VLS_14 = __VLS_13({
    data: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
var __VLS_3;
const __VLS_16 = {}.ADrawer;
/** @type {[typeof __VLS_components.ADrawer, typeof __VLS_components.aDrawer, typeof __VLS_components.ADrawer, typeof __VLS_components.aDrawer, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    visible: (__VLS_ctx.detailVisible),
    width: "600",
    title: "订单详情",
    footer: (false),
}));
const __VLS_18 = __VLS_17({
    visible: (__VLS_ctx.detailVisible),
    width: "600",
    title: "订单详情",
    footer: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
if (__VLS_ctx.detail) {
    const __VLS_20 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        column: (1),
        size: "small",
        bordered: true,
    }));
    const __VLS_22 = __VLS_21({
        column: (1),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    const __VLS_24 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        label: "订单ID",
    }));
    const __VLS_26 = __VLS_25({
        label: "订单ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    (__VLS_ctx.detail.id);
    var __VLS_27;
    const __VLS_28 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        label: "手机号",
    }));
    const __VLS_30 = __VLS_29({
        label: "手机号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    (__VLS_ctx.detail.phone);
    var __VLS_31;
    const __VLS_32 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        label: "商品",
    }));
    const __VLS_34 = __VLS_33({
        label: "商品",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    (__VLS_ctx.detail.productName);
    var __VLS_35;
    const __VLS_36 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        label: "状态",
    }));
    const __VLS_38 = __VLS_37({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    (__VLS_ctx.detail.status);
    var __VLS_39;
    const __VLS_40 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        label: "电池配置",
    }));
    const __VLS_42 = __VLS_41({
        label: "电池配置",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    (__VLS_ctx.batteryOptionText(__VLS_ctx.detail.batteryOption));
    var __VLS_43;
    const __VLS_44 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        label: "还款方式",
    }));
    const __VLS_46 = __VLS_45({
        label: "还款方式",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    (__VLS_ctx.repaymentMethodText(__VLS_ctx.detail.repaymentMethod));
    var __VLS_47;
    const __VLS_48 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        label: "期数",
    }));
    const __VLS_50 = __VLS_49({
        label: "期数",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    (__VLS_ctx.detail.periods);
    var __VLS_51;
    const __VLS_52 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        label: "周期",
    }));
    const __VLS_54 = __VLS_53({
        label: "周期",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (__VLS_ctx.detail.cycleDays);
    var __VLS_55;
    const __VLS_56 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        label: "合同状态",
    }));
    const __VLS_58 = __VLS_57({
        label: "合同状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    (__VLS_ctx.detail.contract?.status || '未发起');
    var __VLS_59;
    const __VLS_60 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        label: "收款状态",
    }));
    const __VLS_62 = __VLS_61({
        label: "收款状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    (__VLS_ctx.detail.payment?.status || '未发起');
    var __VLS_63;
    const __VLS_64 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        label: "剩余应还",
    }));
    const __VLS_66 = __VLS_65({
        label: "剩余应还",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    (__VLS_ctx.detail.remainingAmount);
    var __VLS_67;
    var __VLS_23;
    const __VLS_68 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
    const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.detail.kycCompleted) {
        const __VLS_72 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
            color: "green",
        }));
        const __VLS_74 = __VLS_73({
            color: "green",
        }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        __VLS_75.slots.default;
        var __VLS_75;
    }
    else {
        const __VLS_76 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
            color: "orange",
        }));
        const __VLS_78 = __VLS_77({
            color: "orange",
        }, ...__VLS_functionalComponentArgsRest(__VLS_77));
        __VLS_79.slots.default;
        var __VLS_79;
    }
    if (__VLS_ctx.detail.kycCompleted) {
        const __VLS_80 = {}.ADescriptions;
        /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            column: (2),
            size: "small",
            bordered: true,
        }));
        const __VLS_82 = __VLS_81({
            column: (2),
            size: "small",
            bordered: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        const __VLS_84 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
            label: "真实姓名",
        }));
        const __VLS_86 = __VLS_85({
            label: "真实姓名",
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        __VLS_87.slots.default;
        (__VLS_ctx.detail.realName);
        var __VLS_87;
        const __VLS_88 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
            label: "身份证号",
        }));
        const __VLS_90 = __VLS_89({
            label: "身份证号",
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        __VLS_91.slots.default;
        (__VLS_ctx.maskIdCard(__VLS_ctx.detail.idCardNumber));
        var __VLS_91;
        const __VLS_92 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
            label: "就业状态",
        }));
        const __VLS_94 = __VLS_93({
            label: "就业状态",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        __VLS_95.slots.default;
        (__VLS_ctx.employmentStatusText(__VLS_ctx.detail.employmentStatus));
        var __VLS_95;
        const __VLS_96 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            label: "单位/职业",
        }));
        const __VLS_98 = __VLS_97({
            label: "单位/职业",
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        __VLS_99.slots.default;
        (__VLS_ctx.detail.employmentName || __VLS_ctx.detail.occupation || '-');
        var __VLS_99;
        const __VLS_100 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            label: "月收入",
        }));
        const __VLS_102 = __VLS_101({
            label: "月收入",
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        __VLS_103.slots.default;
        (__VLS_ctx.incomeRangeText(__VLS_ctx.detail.incomeRangeCode));
        var __VLS_103;
        const __VLS_104 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
            label: "住家地址",
            span: (2),
        }));
        const __VLS_106 = __VLS_105({
            label: "住家地址",
            span: (2),
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        __VLS_107.slots.default;
        (__VLS_ctx.formatAddress(__VLS_ctx.detail));
        var __VLS_107;
        const __VLS_108 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
            label: "紧急联系人",
        }));
        const __VLS_110 = __VLS_109({
            label: "紧急联系人",
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        __VLS_111.slots.default;
        (__VLS_ctx.detail.contactName);
        var __VLS_111;
        const __VLS_112 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
            label: "联系人电话",
        }));
        const __VLS_114 = __VLS_113({
            label: "联系人电话",
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        __VLS_115.slots.default;
        (__VLS_ctx.detail.contactPhone);
        var __VLS_115;
        const __VLS_116 = {}.ADescriptionsItem;
        /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            label: "与客户关系",
        }));
        const __VLS_118 = __VLS_117({
            label: "与客户关系",
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        __VLS_119.slots.default;
        (__VLS_ctx.contactRelationText(__VLS_ctx.detail.contactRelation));
        var __VLS_119;
        var __VLS_83;
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
            const __VLS_120 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
                src: (__VLS_ctx.detail.idCardFront),
                width: "120",
                height: "80",
                fit: "cover",
            }));
            const __VLS_122 = __VLS_121({
                src: (__VLS_ctx.detail.idCardFront),
                width: "120",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_121));
        }
        if (__VLS_ctx.detail.idCardBack) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_124 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
                src: (__VLS_ctx.detail.idCardBack),
                width: "120",
                height: "80",
                fit: "cover",
            }));
            const __VLS_126 = __VLS_125({
                src: (__VLS_ctx.detail.idCardBack),
                width: "120",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        }
        if (__VLS_ctx.detail.facePhoto) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kyc-image" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "label" },
            });
            const __VLS_128 = {}.AImage;
            /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
            // @ts-ignore
            const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
                src: (__VLS_ctx.detail.facePhoto),
                width: "80",
                height: "80",
                fit: "cover",
            }));
            const __VLS_130 = __VLS_129({
                src: (__VLS_ctx.detail.facePhoto),
                width: "80",
                height: "80",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_129));
        }
    }
    const __VLS_132 = {}.ADivider;
    /** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({}));
    const __VLS_134 = __VLS_133({}, ...__VLS_functionalComponentArgsRest(__VLS_133));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_136 = {}.ATable;
    /** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
    // @ts-ignore
    const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
        data: (__VLS_ctx.detail.statusLogs || []),
        pagination: (false),
        size: "small",
    }));
    const __VLS_138 = __VLS_137({
        data: (__VLS_ctx.detail.statusLogs || []),
        pagination: (false),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    __VLS_139.slots.default;
    const __VLS_140 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        title: "时间",
        dataIndex: "at",
    }));
    const __VLS_142 = __VLS_141({
        title: "时间",
        dataIndex: "at",
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    const __VLS_144 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        title: "动作",
        dataIndex: "action",
    }));
    const __VLS_146 = __VLS_145({
        title: "动作",
        dataIndex: "action",
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
    const __VLS_148 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        title: "状态",
        dataIndex: "status",
    }));
    const __VLS_150 = __VLS_149({
        title: "状态",
        dataIndex: "status",
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    const __VLS_152 = {}.ATableColumn;
    /** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        title: "来源",
        dataIndex: "by",
    }));
    const __VLS_154 = __VLS_153({
        title: "来源",
        dataIndex: "by",
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    var __VLS_139;
}
var __VLS_19;
const __VLS_156 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.adjustVisible),
    title: "订单调价",
}));
const __VLS_158 = __VLS_157({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.adjustVisible),
    title: "订单调价",
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
let __VLS_160;
let __VLS_161;
let __VLS_162;
const __VLS_163 = {
    onOk: (__VLS_ctx.submitAdjust)
};
__VLS_159.slots.default;
const __VLS_164 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    model: (__VLS_ctx.adjustForm),
    layout: "vertical",
}));
const __VLS_166 = __VLS_165({
    model: (__VLS_ctx.adjustForm),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
const __VLS_168 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    label: "租金/期（元）",
    field: "rentPerPeriod",
}));
const __VLS_170 = __VLS_169({
    label: "租金/期（元）",
    field: "rentPerPeriod",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
const __VLS_172 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    modelValue: (__VLS_ctx.adjustForm.rentPerPeriod),
    min: (1),
}));
const __VLS_174 = __VLS_173({
    modelValue: (__VLS_ctx.adjustForm.rentPerPeriod),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
var __VLS_171;
const __VLS_176 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    label: "期数",
    field: "periods",
}));
const __VLS_178 = __VLS_177({
    label: "期数",
    field: "periods",
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
__VLS_179.slots.default;
const __VLS_180 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    modelValue: (__VLS_ctx.adjustForm.periods),
    min: (3),
}));
const __VLS_182 = __VLS_181({
    modelValue: (__VLS_ctx.adjustForm.periods),
    min: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
var __VLS_179;
const __VLS_184 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
    label: "周期（天）",
    field: "cycleDays",
}));
const __VLS_186 = __VLS_185({
    label: "周期（天）",
    field: "cycleDays",
}, ...__VLS_functionalComponentArgsRest(__VLS_185));
__VLS_187.slots.default;
const __VLS_188 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    modelValue: (__VLS_ctx.adjustForm.cycleDays),
    min: (7),
}));
const __VLS_190 = __VLS_189({
    modelValue: (__VLS_ctx.adjustForm.cycleDays),
    min: (7),
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
var __VLS_187;
const __VLS_192 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
    label: "调价原因",
    field: "reason",
}));
const __VLS_194 = __VLS_193({
    label: "调价原因",
    field: "reason",
}, ...__VLS_functionalComponentArgsRest(__VLS_193));
__VLS_195.slots.default;
const __VLS_196 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    modelValue: (__VLS_ctx.adjustForm.reason),
    placeholder: "请输入原因",
}));
const __VLS_198 = __VLS_197({
    modelValue: (__VLS_ctx.adjustForm.reason),
    placeholder: "请输入原因",
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
var __VLS_195;
const __VLS_200 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
    type: "warning",
    showIcon: (true),
    title: "调价仅限审核前，调价后需重签合同。",
}));
const __VLS_202 = __VLS_201({
    type: "warning",
    showIcon: (true),
    title: "调价仅限审核前，调价后需重签合同。",
}, ...__VLS_functionalComponentArgsRest(__VLS_201));
var __VLS_167;
var __VLS_159;
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
            batteryOptionText: batteryOptionText,
            repaymentMethodText: repaymentMethodText,
            maskIdCard: maskIdCard,
            employmentStatusText: employmentStatusText,
            incomeRangeText: incomeRangeText,
            contactRelationText: contactRelationText,
            formatAddress: formatAddress,
            columns: columns,
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
