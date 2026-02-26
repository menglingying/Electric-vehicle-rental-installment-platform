import { h, onMounted, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
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
const __VLS_0 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.selectedOrderId),
    placeholder: "选择订单",
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.selectedOrderId),
    placeholder: "选择订单",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (__VLS_ctx.onSelect)
};
__VLS_3.slots.default;
for (const [o] of __VLS_getVForSourceType((__VLS_ctx.orders))) {
    const __VLS_8 = {}.AOption;
    /** @type {[typeof __VLS_components.AOption, typeof __VLS_components.aOption, typeof __VLS_components.AOption, typeof __VLS_components.aOption, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        key: (o.id),
        value: (o.id),
    }));
    const __VLS_10 = __VLS_9({
        key: (o.id),
        value: (o.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    (o.id);
    (o.phone);
    (o.productName);
    var __VLS_11;
}
var __VLS_3;
const __VLS_12 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.loadOrders)
};
__VLS_15.slots.default;
var __VLS_15;
const __VLS_20 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (__VLS_ctx.exportRepayments)
};
__VLS_23.slots.default;
var __VLS_23;
const __VLS_28 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ style: {} },
    type: "info",
}));
const __VLS_30 = __VLS_29({
    ...{ style: {} },
    type: "info",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
var __VLS_31;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_32 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    data: (__VLS_ctx.planRows),
    pagination: (false),
}));
const __VLS_34 = __VLS_33({
    data: (__VLS_ctx.planRows),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    title: "期次",
    dataIndex: "period",
}));
const __VLS_38 = __VLS_37({
    title: "期次",
    dataIndex: "period",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const __VLS_40 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    title: "应还日期",
    dataIndex: "dueDate",
}));
const __VLS_42 = __VLS_41({
    title: "应还日期",
    dataIndex: "dueDate",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    title: "金额",
    render: (({ record }) => `¥${record.amount}`),
}));
const __VLS_46 = __VLS_45({
    title: "金额",
    render: (({ record }) => `¥${record.amount}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const __VLS_48 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    title: "状态",
    render: (({ record }) => (record.paid ? '已还' : '未还')),
}));
const __VLS_50 = __VLS_49({
    title: "状态",
    render: (({ record }) => (record.paid ? '已还' : '未还')),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { type: 'primary', size: 'small', disabled: record.paid || record.amount <= 0, onClick: () => __VLS_ctx.markPaid(record.period) }, () => '标记已还')),
}));
const __VLS_54 = __VLS_53({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { type: 'primary', size: 'small', disabled: record.paid || record.amount <= 0, onClick: () => __VLS_ctx.markPaid(record.period) }, () => '标记已还')),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_35;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            h: h,
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
