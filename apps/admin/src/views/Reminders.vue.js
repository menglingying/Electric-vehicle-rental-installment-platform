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
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: "还款提醒",
}));
const __VLS_2 = __VLS_1({
    title: "还款提醒",
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
    modelValue: (__VLS_ctx.kind),
    type: "button",
}));
const __VLS_7 = __VLS_6({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.kind),
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
    value: "all",
}));
const __VLS_15 = __VLS_14({
    value: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
var __VLS_16;
const __VLS_17 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    value: "due_today",
}));
const __VLS_19 = __VLS_18({
    value: "due_today",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
var __VLS_20;
const __VLS_21 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    value: "due_soon",
}));
const __VLS_23 = __VLS_22({
    value: "due_soon",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
var __VLS_24;
var __VLS_8;
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
    onClick: (__VLS_ctx.load)
};
__VLS_28.slots.default;
var __VLS_28;
const __VLS_33 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedIds.length === 0),
}));
const __VLS_35 = __VLS_34({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (__VLS_ctx.selectedIds.length === 0),
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_37;
let __VLS_38;
let __VLS_39;
const __VLS_40 = {
    onClick: (__VLS_ctx.sendSelected)
};
__VLS_36.slots.default;
(__VLS_ctx.selectedIds.length);
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
    onClick: (__VLS_ctx.exportSms)
};
__VLS_44.slots.default;
var __VLS_44;
const __VLS_49 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedIds),
    rowKey: "id",
}));
const __VLS_51 = __VLS_50({
    data: (__VLS_ctx.rows),
    pagination: (false),
    rowSelection: ({ type: 'checkbox', showCheckedAll: true }),
    selectedKeys: (__VLS_ctx.selectedIds),
    rowKey: "id",
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
    title: "期次",
    dataIndex: "period",
}));
const __VLS_67 = __VLS_66({
    title: "期次",
    dataIndex: "period",
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
const __VLS_69 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    title: "到期日",
    dataIndex: "dueDate",
}));
const __VLS_71 = __VLS_70({
    title: "到期日",
    dataIndex: "dueDate",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const __VLS_73 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    title: "金额",
    render: (({ record }) => `￥${(record.amount / 100).toFixed(2)}`),
}));
const __VLS_75 = __VLS_74({
    title: "金额",
    render: (({ record }) => `￥${(record.amount / 100).toFixed(2)}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
const __VLS_77 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
    title: "操作",
}));
const __VLS_79 = __VLS_78({
    title: "操作",
}, ...__VLS_functionalComponentArgsRest(__VLS_78));
__VLS_80.slots.default;
{
    const { cell: __VLS_thisSlot } = __VLS_80.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_81 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }));
    const __VLS_83 = __VLS_82({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    let __VLS_85;
    let __VLS_86;
    let __VLS_87;
    const __VLS_88 = {
        onClick: (...[$event]) => {
            __VLS_ctx.sendOne(record);
        }
    };
    __VLS_84.slots.default;
    var __VLS_84;
}
var __VLS_80;
var __VLS_52;
const __VLS_89 = {}.ADivider;
/** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({}));
const __VLS_91 = __VLS_90({}, ...__VLS_functionalComponentArgsRest(__VLS_90));
const __VLS_93 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
    title: "发送记录",
    bordered: (false),
}));
const __VLS_95 = __VLS_94({
    title: "发送记录",
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_94));
__VLS_96.slots.default;
const __VLS_97 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
    data: (__VLS_ctx.records),
    pagination: (false),
    size: "small",
}));
const __VLS_99 = __VLS_98({
    data: (__VLS_ctx.records),
    pagination: (false),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_98));
__VLS_100.slots.default;
const __VLS_101 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
    title: "时间",
    dataIndex: "createdAt",
}));
const __VLS_103 = __VLS_102({
    title: "时间",
    dataIndex: "createdAt",
}, ...__VLS_functionalComponentArgsRest(__VLS_102));
const __VLS_105 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_107 = __VLS_106({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_106));
const __VLS_109 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
    title: "内容",
    dataIndex: "content",
}));
const __VLS_111 = __VLS_110({
    title: "内容",
    dataIndex: "content",
}, ...__VLS_functionalComponentArgsRest(__VLS_110));
const __VLS_113 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
    title: "状态",
    dataIndex: "status",
}));
const __VLS_115 = __VLS_114({
    title: "状态",
    dataIndex: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_114));
const __VLS_117 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
    title: "类型",
    dataIndex: "bizType",
}));
const __VLS_119 = __VLS_118({
    title: "类型",
    dataIndex: "bizType",
}, ...__VLS_functionalComponentArgsRest(__VLS_118));
var __VLS_100;
var __VLS_96;
var __VLS_3;
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
