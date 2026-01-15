import { computed, onMounted, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { listOverdue, sendOverdueSms } from '@/services/api';
import { downloadCsv } from '@/services/download';
const tier = ref('1-3');
const rows = ref([]);
const selectedKeys = ref([]);
const selectedRows = computed(() => rows.value.filter(r => selectedKeys.value.includes(r.orderId)));
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
    type: "primary",
    disabled: (__VLS_ctx.selectedRows.length === 0),
}));
const __VLS_43 = __VLS_42({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedRows.length === 0),
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
let __VLS_45;
let __VLS_46;
let __VLS_47;
const __VLS_48 = {
    onClick: (__VLS_ctx.sendSelected)
};
__VLS_44.slots.default;
(__VLS_ctx.selectedRows.length);
var __VLS_44;
const __VLS_49 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    ...{ 'onClick': {} },
}));
const __VLS_51 = __VLS_50({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
let __VLS_53;
let __VLS_54;
let __VLS_55;
const __VLS_56 = {
    onClick: (__VLS_ctx.exportOverdue)
};
__VLS_52.slots.default;
var __VLS_52;
const __VLS_57 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedKeys),
    rowKey: "orderId",
}));
const __VLS_59 = __VLS_58({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedKeys),
    rowKey: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
__VLS_60.slots.default;
const __VLS_61 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    title: "订单",
    dataIndex: "orderId",
}));
const __VLS_63 = __VLS_62({
    title: "订单",
    dataIndex: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const __VLS_65 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_67 = __VLS_66({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
const __VLS_69 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    title: "商品",
    dataIndex: "productName",
}));
const __VLS_71 = __VLS_70({
    title: "商品",
    dataIndex: "productName",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const __VLS_73 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    title: "状态",
    dataIndex: "status",
}));
const __VLS_75 = __VLS_74({
    title: "状态",
    dataIndex: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
const __VLS_77 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
    title: "最大逾期天数",
    dataIndex: "maxOverdueDays",
}));
const __VLS_79 = __VLS_78({
    title: "最大逾期天数",
    dataIndex: "maxOverdueDays",
}, ...__VLS_functionalComponentArgsRest(__VLS_78));
const __VLS_81 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
    title: "逾期期次",
}));
const __VLS_83 = __VLS_82({
    title: "逾期期次",
}, ...__VLS_functionalComponentArgsRest(__VLS_82));
__VLS_84.slots.default;
{
    const { cell: __VLS_thisSlot } = __VLS_84.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    for (const [x] of __VLS_getVForSourceType((record.overduePeriods))) {
        const __VLS_85 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
            key: (x.period),
            color: "orangered",
        }));
        const __VLS_87 = __VLS_86({
            key: (x.period),
            color: "orangered",
        }, ...__VLS_functionalComponentArgsRest(__VLS_86));
        __VLS_88.slots.default;
        (x.period);
        (x.overdueDays);
        var __VLS_88;
    }
}
var __VLS_84;
const __VLS_89 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
    title: "操作",
}));
const __VLS_91 = __VLS_90({
    title: "操作",
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
__VLS_92.slots.default;
{
    const { cell: __VLS_thisSlot } = __VLS_92.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_93 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }));
    const __VLS_95 = __VLS_94({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    let __VLS_97;
    let __VLS_98;
    let __VLS_99;
    const __VLS_100 = {
        onClick: (...[$event]) => {
            __VLS_ctx.sendOne(record);
        }
    };
    __VLS_96.slots.default;
    var __VLS_96;
}
var __VLS_92;
var __VLS_60;
var __VLS_3;
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
