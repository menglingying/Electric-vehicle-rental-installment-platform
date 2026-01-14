import { h, onMounted, ref } from 'vue';
import { Message, Tag } from '@arco-design/web-vue';
import { listOverdue } from '@/services/api';
import { downloadCsv } from '@/services/download';
const tier = ref('1-3');
const rows = ref([]);
function renderOverduePeriods({ record }) {
    const items = record.overduePeriods ?? [];
    return h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap' }, items.map((x) => h(Tag, { color: 'orangered' }, () => `第${x.period}期 ${x.overdueDays}天`)));
}
async function load() {
    try {
        rows.value = await listOverdue(tier.value);
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
onMounted(load);
async function exportOverdue() {
    try {
        await downloadCsv('/admin/exports/overdue.csv', 'overdue.csv');
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
    title: "逾期分层",
}));
const __VLS_2 = __VLS_1({
    title: "逾期分层",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_5 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.tier),
    type: "button",
}));
const __VLS_7 = __VLS_6({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.tier),
    type: "button",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
let __VLS_11;
const __VLS_12 = {
    onChange: (__VLS_ctx.load)
};
__VLS_8.slots.default;
const __VLS_13 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    value: "1-3",
}));
const __VLS_15 = __VLS_14({
    value: "1-3",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
var __VLS_16;
const __VLS_17 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    value: "3-10",
}));
const __VLS_19 = __VLS_18({
    value: "3-10",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
var __VLS_20;
const __VLS_21 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    value: "10-30",
}));
const __VLS_23 = __VLS_22({
    value: "10-30",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
var __VLS_24;
const __VLS_25 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    value: "30+",
}));
const __VLS_27 = __VLS_26({
    value: "30+",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
var __VLS_28;
const __VLS_29 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    value: "all",
}));
const __VLS_31 = __VLS_30({
    value: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
var __VLS_32;
var __VLS_8;
const __VLS_33 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ...{ 'onClick': {} },
}));
const __VLS_35 = __VLS_34({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_37;
let __VLS_38;
let __VLS_39;
const __VLS_40 = {
    onClick: (__VLS_ctx.load)
};
__VLS_36.slots.default;
var __VLS_36;
const __VLS_41 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    ...{ 'onClick': {} },
}));
const __VLS_43 = __VLS_42({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
let __VLS_45;
let __VLS_46;
let __VLS_47;
const __VLS_48 = {
    onClick: (__VLS_ctx.exportOverdue)
};
__VLS_44.slots.default;
var __VLS_44;
const __VLS_49 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    data: (__VLS_ctx.rows),
    pagination: (false),
}));
const __VLS_51 = __VLS_50({
    data: (__VLS_ctx.rows),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
__VLS_52.slots.default;
const __VLS_53 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    title: "订单",
    dataIndex: "orderId",
}));
const __VLS_55 = __VLS_54({
    title: "订单",
    dataIndex: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const __VLS_57 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_59 = __VLS_58({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
const __VLS_61 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    title: "商品",
    dataIndex: "productName",
}));
const __VLS_63 = __VLS_62({
    title: "商品",
    dataIndex: "productName",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const __VLS_65 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
    title: "状态",
    dataIndex: "status",
}));
const __VLS_67 = __VLS_66({
    title: "状态",
    dataIndex: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
const __VLS_69 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    title: "最大逾期天数",
    dataIndex: "maxOverdueDays",
}));
const __VLS_71 = __VLS_70({
    title: "最大逾期天数",
    dataIndex: "maxOverdueDays",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const __VLS_73 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    title: "逾期期次",
    render: (__VLS_ctx.renderOverduePeriods),
}));
const __VLS_75 = __VLS_74({
    title: "逾期期次",
    render: (__VLS_ctx.renderOverduePeriods),
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
var __VLS_52;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            tier: tier,
            rows: rows,
            renderOverduePeriods: renderOverduePeriods,
            load: load,
            exportOverdue: exportOverdue,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
