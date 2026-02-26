import { onMounted, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { listReminders, listSmsRecords, sendReminderSms } from '@/services/api';
import { downloadCsv } from '@/services/download';
const kind = ref('all');
const rows = ref([]);
const records = ref([]);
const selectedIds = ref([]);
async function load() {
    try {
        rows.value = await listReminders(kind.value);
        records.value = await listSmsRecords();
        selectedIds.value = [];
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
async function sendOne(item) {
    try {
        const result = await sendReminderSms([item.id]);
        if (result.success > 0) {
            Message.success('短信发送成功');
        }
        else {
            Message.error('短信发送失败');
        }
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '发送失败');
    }
}
async function sendSelected() {
    if (selectedIds.value.length === 0)
        return;
    try {
        const result = await sendReminderSms(selectedIds.value);
        Message.success(`发送完成：成功 ${result.success}，失败 ${result.fail}`);
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '发送失败');
    }
}
onMounted(load);
async function exportSms() {
    try {
        await downloadCsv('/admin/exports/sms.csv', 'sms.csv');
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
    modelValue: (__VLS_ctx.kind),
    type: "button",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.kind),
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
    value: "all",
}));
const __VLS_10 = __VLS_9({
    value: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
var __VLS_11;
const __VLS_12 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    value: "due_today",
}));
const __VLS_14 = __VLS_13({
    value: "due_today",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
const __VLS_16 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    value: "due_soon",
}));
const __VLS_18 = __VLS_17({
    value: "due_soon",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
var __VLS_3;
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
    onClick: (__VLS_ctx.load)
};
__VLS_23.slots.default;
var __VLS_23;
const __VLS_28 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedIds.length === 0),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedIds.length === 0),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.sendSelected)
};
__VLS_31.slots.default;
(__VLS_ctx.selectedIds.length);
var __VLS_31;
const __VLS_36 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onClick': {} },
}));
const __VLS_38 = __VLS_37({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onClick: (__VLS_ctx.exportSms)
};
__VLS_39.slots.default;
var __VLS_39;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_44 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedIds),
    rowKey: "id",
}));
const __VLS_46 = __VLS_45({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedIds),
    rowKey: "id",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    title: "订单",
    dataIndex: "orderId",
}));
const __VLS_50 = __VLS_49({
    title: "订单",
    dataIndex: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_54 = __VLS_53({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_56 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    title: "商品",
    dataIndex: "productName",
}));
const __VLS_58 = __VLS_57({
    title: "商品",
    dataIndex: "productName",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    title: "期次",
    dataIndex: "period",
}));
const __VLS_62 = __VLS_61({
    title: "期次",
    dataIndex: "period",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    title: "到期日期",
    dataIndex: "dueDate",
}));
const __VLS_66 = __VLS_65({
    title: "到期日期",
    dataIndex: "dueDate",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const __VLS_68 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    title: "金额",
    render: (({ record }) => `¥${(record.amount / 100).toFixed(2)}`),
}));
const __VLS_70 = __VLS_69({
    title: "金额",
    render: (({ record }) => `¥${(record.amount / 100).toFixed(2)}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    title: "操作",
}));
const __VLS_74 = __VLS_73({
    title: "操作",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
{
    const { cell: __VLS_thisSlot } = __VLS_75.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_76 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (...[$event]) => {
            __VLS_ctx.sendOne(record);
        }
    };
    __VLS_79.slots.default;
    var __VLS_79;
}
var __VLS_75;
var __VLS_47;
const __VLS_84 = {}.ADivider;
/** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({}));
const __VLS_86 = __VLS_85({}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_88 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    data: (__VLS_ctx.records),
    pagination: (false),
    size: "small",
}));
const __VLS_90 = __VLS_89({
    data: (__VLS_ctx.records),
    pagination: (false),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
const __VLS_92 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    title: "时间",
    dataIndex: "createdAt",
}));
const __VLS_94 = __VLS_93({
    title: "时间",
    dataIndex: "createdAt",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
const __VLS_96 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_98 = __VLS_97({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
const __VLS_100 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    title: "内容",
    dataIndex: "content",
}));
const __VLS_102 = __VLS_101({
    title: "内容",
    dataIndex: "content",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
const __VLS_104 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    title: "状态",
    dataIndex: "status",
}));
const __VLS_106 = __VLS_105({
    title: "状态",
    dataIndex: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
const __VLS_108 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    title: "类型",
    dataIndex: "bizType",
}));
const __VLS_110 = __VLS_109({
    title: "类型",
    dataIndex: "bizType",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
var __VLS_91;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            kind: kind,
            rows: rows,
            records: records,
            selectedIds: selectedIds,
            load: load,
            sendOne: sendOne,
            sendSelected: sendSelected,
            exportSms: exportSms,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
