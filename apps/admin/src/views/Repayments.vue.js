import { h, onMounted, ref } from 'vue';
import { Alert as AAlert, Button, Message } from '@arco-design/web-vue';
import { getRepayments, listOrders, markPeriodPaid } from '@/services/api';
import { downloadCsv } from '@/services/download';
const orders = ref([]);
const selectedOrderId = ref('');
const planRows = ref([]);
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
    try {
        const data = await getRepayments(selectedOrderId.value);
        planRows.value = data.repaymentPlan ?? [];
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载还款计划失败');
    }
}
async function onSelect() {
    await loadPlan();
}
async function markPaid(period) {
    try {
        await markPeriodPaid(selectedOrderId.value, period);
        Message.success('已标记');
        await loadPlan();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
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
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: "还款管理",
}));
const __VLS_2 = __VLS_1({
    title: "还款管理",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_5 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.selectedOrderId),
    placeholder: "选择订单",
    ...{ style: {} },
}));
const __VLS_7 = __VLS_6({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.selectedOrderId),
    placeholder: "选择订单",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
let __VLS_11;
const __VLS_12 = {
    onChange: (__VLS_ctx.onSelect)
};
__VLS_8.slots.default;
for (const [o] of __VLS_getVForSourceType((__VLS_ctx.orders))) {
    const __VLS_13 = {}.AOption;
    /** @type {[typeof __VLS_components.AOption, typeof __VLS_components.aOption, typeof __VLS_components.AOption, typeof __VLS_components.aOption, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        key: (o.id),
        value: (o.id),
    }));
    const __VLS_15 = __VLS_14({
        key: (o.id),
        value: (o.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    __VLS_16.slots.default;
    (o.id);
    (o.phone);
    (o.productName);
    var __VLS_16;
}
var __VLS_8;
const __VLS_17 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    ...{ 'onClick': {} },
}));
const __VLS_19 = __VLS_18({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
let __VLS_21;
let __VLS_22;
let __VLS_23;
const __VLS_24 = {
    onClick: (__VLS_ctx.loadOrders)
};
__VLS_20.slots.default;
var __VLS_20;
const __VLS_25 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    ...{ 'onClick': {} },
}));
const __VLS_27 = __VLS_26({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
let __VLS_29;
let __VLS_30;
let __VLS_31;
const __VLS_32 = {
    onClick: (__VLS_ctx.exportRepayments)
};
__VLS_28.slots.default;
var __VLS_28;
const __VLS_33 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ...{ style: {} },
    type: "info",
}));
const __VLS_35 = __VLS_34({
    ...{ style: {} },
    type: "info",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
var __VLS_36;
const __VLS_37 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    data: (__VLS_ctx.planRows),
    pagination: (false),
}));
const __VLS_39 = __VLS_38({
    data: (__VLS_ctx.planRows),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_40.slots.default;
const __VLS_41 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    title: "期次",
    dataIndex: "period",
}));
const __VLS_43 = __VLS_42({
    title: "期次",
    dataIndex: "period",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const __VLS_45 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    title: "应还日",
    dataIndex: "dueDate",
}));
const __VLS_47 = __VLS_46({
    title: "应还日",
    dataIndex: "dueDate",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
const __VLS_49 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    title: "金额",
    render: (({ record }) => `￥${record.amount}`),
}));
const __VLS_51 = __VLS_50({
    title: "金额",
    render: (({ record }) => `￥${record.amount}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
const __VLS_53 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    title: "状态",
    render: (({ record }) => (record.paid ? '已还' : '未还')),
}));
const __VLS_55 = __VLS_54({
    title: "状态",
    render: (({ record }) => (record.paid ? '已还' : '未还')),
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const __VLS_57 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { type: 'primary', size: 'small', disabled: record.paid || record.amount <= 0, onClick: () => __VLS_ctx.markPaid(record.period) }, () => '标记已还')),
}));
const __VLS_59 = __VLS_58({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { type: 'primary', size: 'small', disabled: record.paid || record.amount <= 0, onClick: () => __VLS_ctx.markPaid(record.period) }, () => '标记已还')),
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
var __VLS_40;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            h: h,
            AAlert: AAlert,
            Button: Button,
            orders: orders,
            selectedOrderId: selectedOrderId,
            planRows: planRows,
            loadOrders: loadOrders,
            onSelect: onSelect,
            markPaid: markPaid,
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
