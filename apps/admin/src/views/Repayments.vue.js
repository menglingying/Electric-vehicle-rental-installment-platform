import { h, computed, onMounted, ref } from 'vue';
import { Button, Message, Tag, Popconfirm } from '@arco-design/web-vue';
import { getRepayments, listOrders, markPeriodPaid, getOrderDetail } from '@/services/api';
import { http } from '@/services/http';
import { downloadCsv } from '@/services/download';
const orders = ref([]);
const selectedOrderId = ref('');
const planRows = ref([]);
const repaymentRecords = ref([]);
const orderSummary = ref(null);
const loading = ref(false);
const generating = ref(false);
const searchKeyword = ref('');
const filteredOrders = computed(() => {
    const kw = searchKeyword.value.trim();
    if (!kw)
        return orders.value;
    return orders.value.filter(o => {
        const name = o.realName || '';
        const phone = o.phone || '';
        return name.includes(kw) || phone.includes(kw);
    });
});
const paidCount = computed(() => planRows.value.filter(r => r.paid).length);
const remainingAmount = computed(() => planRows.value.filter(r => !r.paid && r.amount > 0).reduce((sum, r) => sum + r.amount, 0));
function statusText(status) {
    const map = {
        PENDING_REVIEW: '待审核', ACTIVE: '待交付', DELIVERED: '已交付',
        IN_USE: '租赁中', RETURNED: '已归还', SETTLED: '已结清',
        REJECTED: '已驳回', CLOSED: '已关闭'
    };
    return map[status] || status || '-';
}
function contractStatusText(status) {
    const map = {
        SIGNING: '签署中', SIGNED: '已签署', VOID: '已作废', FAILED: '失败', EXPIRED: '已过期'
    };
    return status ? (map[status] ?? status) : '未发起';
}
function isOverdue(dueDate) {
    if (!dueDate)
        return false;
    return new Date(dueDate) < new Date();
}
function getPaidTime(period) {
    const record = repaymentRecords.value.find(r => r.period === period);
    if (!record?.paidAt)
        return '';
    const d = new Date(record.paidAt);
    return d.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}
const tableColumns = [
    { title: '期次', dataIndex: 'period', width: 80, align: 'center' },
    { title: '应还日期', dataIndex: 'dueDate', width: 140 },
    {
        title: '应还金额', width: 120,
        render: ({ record }) => `¥${record.amount}`
    },
    {
        title: '还款状态', width: 120, align: 'center',
        render: ({ record }) => {
            if (record.paid)
                return h(Tag, { color: 'green' }, () => '已还');
            if (record.amount <= 0)
                return h(Tag, { color: 'gray' }, () => '免还');
            if (isOverdue(record.dueDate))
                return h(Tag, { color: 'red' }, () => '逾期未还');
            return h(Tag, { color: 'orangered' }, () => '待还');
        }
    },
    {
        title: '还款时间', width: 180,
        render: ({ record }) => getPaidTime(record.period) || '-'
    },
    {
        title: '操作', width: 140, align: 'center',
        render: ({ record }) => {
            if (record.paid)
                return h('span', { style: 'color:#52c41a' }, '✓ 已还');
            if (record.amount <= 0)
                return h('span', { style: 'color:#8c8c8c' }, '-');
            return h(Popconfirm, { content: `确认标记第${record.period}期（¥${record.amount}）为已还？`, onOk: () => markPaid(record.period) }, { default: () => h(Button, { type: 'primary', size: 'small' }, () => '标记已还') });
        }
    }
];
async function loadOrders() {
    try {
        orders.value = await listOrders();
        if (!selectedOrderId.value && orders.value.length) {
            selectedOrderId.value = orders.value[0].id;
            await loadPlan();
        }
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载订单失败');
    }
}
async function loadPlan() {
    if (!selectedOrderId.value)
        return;
    loading.value = true;
    try {
        const data = await getRepayments(selectedOrderId.value);
        planRows.value = data.repaymentPlan ?? [];
        repaymentRecords.value = data.repaymentRecords ?? [];
        const detail = await getOrderDetail(selectedOrderId.value);
        orderSummary.value = {
            realName: detail.realName,
            phone: detail.phone,
            productName: detail.productName,
            status: detail.status,
            periods: detail.periods,
            cycleDays: detail.cycleDays,
            contractStatus: detail.contract?.status
        };
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载还款计划失败');
    }
    finally {
        loading.value = false;
    }
}
async function onSelect() {
    await loadPlan();
}
async function markPaid(period) {
    try {
        await markPeriodPaid(selectedOrderId.value, period);
        Message.success(`第${period}期已标记还款`);
        await loadPlan();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function handleGeneratePlan() {
    if (!selectedOrderId.value)
        return;
    generating.value = true;
    try {
        const { data: result } = await http.post(`/admin/orders/${selectedOrderId.value}/generate-plan`);
        Message.success(`还款计划已生成，共${result.periods}期`);
        await loadPlan();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '生成还款计划失败');
    }
    finally {
        generating.value = false;
    }
}
onMounted(loadOrders);
async function exportRepayments() {
    try {
        await downloadCsv('/admin/exports/repayments.csv', 'repayments.csv');
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '导出失败');
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索客户姓名 / 手机号",
    allowClear: true,
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索客户姓名 / 手机号",
    allowClear: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.selectedOrderId),
    placeholder: "选择订单",
    ...{ style: {} },
    allowSearch: true,
}));
const __VLS_6 = __VLS_5({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.selectedOrderId),
    placeholder: "选择订单",
    ...{ style: {} },
    allowSearch: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onChange: (__VLS_ctx.onSelect)
};
__VLS_7.slots.default;
for (const [o] of __VLS_getVForSourceType((__VLS_ctx.filteredOrders))) {
    const __VLS_12 = {}.AOption;
    /** @type {[typeof __VLS_components.AOption, typeof __VLS_components.aOption, typeof __VLS_components.AOption, typeof __VLS_components.aOption, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        key: (o.id),
        value: (o.id),
    }));
    const __VLS_14 = __VLS_13({
        key: (o.id),
        value: (o.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    (o.realName || '未实名');
    (o.phone);
    (o.productName);
    (o.periods);
    var __VLS_15;
}
var __VLS_7;
const __VLS_16 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.loadOrders)
};
__VLS_19.slots.default;
var __VLS_19;
const __VLS_24 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.exportRepayments)
};
__VLS_27.slots.default;
var __VLS_27;
if (__VLS_ctx.orderSummary) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_32 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        column: (4),
        size: "small",
        bordered: true,
    }));
    const __VLS_34 = __VLS_33({
        column: (4),
        size: "small",
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    const __VLS_36 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        label: "客户",
    }));
    const __VLS_38 = __VLS_37({
        label: "客户",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    (__VLS_ctx.orderSummary.realName || '-');
    var __VLS_39;
    const __VLS_40 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        label: "手机号",
    }));
    const __VLS_42 = __VLS_41({
        label: "手机号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    (__VLS_ctx.orderSummary.phone);
    var __VLS_43;
    const __VLS_44 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        label: "商品",
    }));
    const __VLS_46 = __VLS_45({
        label: "商品",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    (__VLS_ctx.orderSummary.productName);
    var __VLS_47;
    const __VLS_48 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        label: "状态",
    }));
    const __VLS_50 = __VLS_49({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    (__VLS_ctx.statusText(__VLS_ctx.orderSummary.status));
    var __VLS_51;
    const __VLS_52 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        label: "分期",
    }));
    const __VLS_54 = __VLS_53({
        label: "分期",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (__VLS_ctx.orderSummary.periods);
    (__VLS_ctx.orderSummary.cycleDays);
    var __VLS_55;
    const __VLS_56 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        label: "已还/总期",
    }));
    const __VLS_58 = __VLS_57({
        label: "已还/总期",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.paidCount);
    (__VLS_ctx.planRows.length);
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.remainingAmount);
    var __VLS_63;
    const __VLS_64 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        label: "合同状态",
    }));
    const __VLS_66 = __VLS_65({
        label: "合同状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    (__VLS_ctx.contractStatusText(__VLS_ctx.orderSummary.contractStatus));
    var __VLS_67;
    var __VLS_35;
}
if (!__VLS_ctx.selectedOrderId) {
    const __VLS_68 = {}.AAlert;
    /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ style: {} },
        type: "info",
    }));
    const __VLS_70 = __VLS_69({
        ...{ style: {} },
        type: "info",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    var __VLS_71;
}
else if (__VLS_ctx.planRows.length === 0 && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_72 = {}.AAlert;
    /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        type: "warning",
        ...{ style: {} },
    }));
    const __VLS_74 = __VLS_73({
        type: "warning",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_75.slots.default;
    var __VLS_75;
    const __VLS_76 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.generating),
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.generating),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (__VLS_ctx.handleGeneratePlan)
    };
    __VLS_79.slots.default;
    var __VLS_79;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_84 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    data: (__VLS_ctx.planRows),
    columns: (__VLS_ctx.tableColumns),
    pagination: (false),
    loading: (__VLS_ctx.loading),
    bordered: ({ cell: true }),
}));
const __VLS_86 = __VLS_85({
    data: (__VLS_ctx.planRows),
    columns: (__VLS_ctx.tableColumns),
    pagination: (false),
    loading: (__VLS_ctx.loading),
    bordered: ({ cell: true }),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            selectedOrderId: selectedOrderId,
            planRows: planRows,
            orderSummary: orderSummary,
            loading: loading,
            generating: generating,
            searchKeyword: searchKeyword,
            filteredOrders: filteredOrders,
            paidCount: paidCount,
            remainingAmount: remainingAmount,
            statusText: statusText,
            contractStatusText: contractStatusText,
            tableColumns: tableColumns,
            loadOrders: loadOrders,
            onSelect: onSelect,
            handleGeneratePlan: handleGeneratePlan,
            exportRepayments: exportRepayments,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
