import { computed, onMounted, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { listOverdue, sendOverdueSms } from '@/services/api';
import { downloadCsv } from '@/services/download';
const tier = ref('1-3');
const rows = ref([]);
const selectedKeys = ref([]);
const selectedRows = computed(() => rows.value.filter((r) => selectedKeys.value.includes(r.orderId)));
async function load() {
    try {
        rows.value = await listOverdue(tier.value);
        selectedKeys.value = [];
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
function buildSendItems(record) {
    return (record.overduePeriods ?? []).map((p) => ({
        orderId: record.orderId,
        period: p.period,
        amount: p.amount,
        overdueDays: p.overdueDays
    }));
}
async function sendOne(record) {
    try {
        const items = buildSendItems(record);
        const result = await sendOverdueSms(items);
        if (result.success > 0) {
            Message.success(`催收短信发送成功：${result.success}条`);
        }
        else {
            Message.error('催收短信发送失败');
        }
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '发送失败');
    }
}
async function sendSelected() {
    if (selectedRows.value.length === 0)
        return;
    try {
        const items = [];
        for (const record of selectedRows.value) {
            items.push(...buildSendItems(record));
        }
        const result = await sendOverdueSms(items);
        Message.success(`发送完成：成功 ${result.success}，失败 ${result.fail}`);
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '发送失败');
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
const __VLS_0 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.tier),
    type: "button",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.tier),
    type: "button",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (__VLS_ctx.load)
};
__VLS_3.slots.default;
const __VLS_8 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    value: "1-3",
}));
const __VLS_10 = __VLS_9({
    value: "1-3",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
var __VLS_11;
const __VLS_12 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    value: "3-10",
}));
const __VLS_14 = __VLS_13({
    value: "3-10",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
const __VLS_16 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    value: "10-30",
}));
const __VLS_18 = __VLS_17({
    value: "10-30",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
const __VLS_20 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    value: "30+",
}));
const __VLS_22 = __VLS_21({
    value: "30+",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
const __VLS_24 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    value: "all",
}));
const __VLS_26 = __VLS_25({
    value: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
var __VLS_27;
var __VLS_3;
const __VLS_28 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.load)
};
__VLS_31.slots.default;
var __VLS_31;
const __VLS_36 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedRows.length === 0),
}));
const __VLS_38 = __VLS_37({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedRows.length === 0),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onClick: (__VLS_ctx.sendSelected)
};
__VLS_39.slots.default;
(__VLS_ctx.selectedRows.length);
var __VLS_39;
const __VLS_44 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ 'onClick': {} },
}));
const __VLS_46 = __VLS_45({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_48;
let __VLS_49;
let __VLS_50;
const __VLS_51 = {
    onClick: (__VLS_ctx.exportOverdue)
};
__VLS_47.slots.default;
var __VLS_47;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_52 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedKeys),
    rowKey: "orderId",
}));
const __VLS_54 = __VLS_53({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedKeys),
    rowKey: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    title: "订单",
    dataIndex: "orderId",
}));
const __VLS_58 = __VLS_57({
    title: "订单",
    dataIndex: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_62 = __VLS_61({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    title: "商品",
    dataIndex: "productName",
}));
const __VLS_66 = __VLS_65({
    title: "商品",
    dataIndex: "productName",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const __VLS_68 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    title: "状态",
    dataIndex: "status",
}));
const __VLS_70 = __VLS_69({
    title: "状态",
    dataIndex: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    title: "最大逾期天数",
    dataIndex: "maxOverdueDays",
}));
const __VLS_74 = __VLS_73({
    title: "最大逾期天数",
    dataIndex: "maxOverdueDays",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
const __VLS_76 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    title: "逾期期次",
}));
const __VLS_78 = __VLS_77({
    title: "逾期期次",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
{
    const { cell: __VLS_thisSlot } = __VLS_79.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    for (const [x] of __VLS_getVForSourceType((record.overduePeriods))) {
        const __VLS_80 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            key: (x.period),
            color: "orangered",
        }));
        const __VLS_82 = __VLS_81({
            key: (x.period),
            color: "orangered",
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        (x.period);
        (x.overdueDays);
        var __VLS_83;
    }
}
var __VLS_79;
const __VLS_84 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    title: "操作",
}));
const __VLS_86 = __VLS_85({
    title: "操作",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
{
    const { cell: __VLS_thisSlot } = __VLS_87.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_88 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }));
    const __VLS_90 = __VLS_89({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    let __VLS_92;
    let __VLS_93;
    let __VLS_94;
    const __VLS_95 = {
        onClick: (...[$event]) => {
            __VLS_ctx.sendOne(record);
        }
    };
    __VLS_91.slots.default;
    var __VLS_91;
}
var __VLS_87;
var __VLS_55;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            tier: tier,
            rows: rows,
            selectedKeys: selectedKeys,
            selectedRows: selectedRows,
            load: load,
            sendOne: sendOne,
            sendSelected: sendSelected,
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
