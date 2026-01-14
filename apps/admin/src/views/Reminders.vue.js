import { h, onMounted, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
import { listReminders, listSmsRecords, sendSms } from '@/services/api';
import { downloadCsv } from '@/services/download';
const kind = ref('all');
const rows = ref([]);
const records = ref([]);
async function load() {
    try {
        rows.value = await listReminders(kind.value);
        records.value = await listSmsRecords();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
async function send(item) {
    try {
        const content = `【还款提醒】订单${item.orderId} 第${item.period}期 ￥${item.amount} 到期日：${item.dueDate}`;
        await sendSms(item.phone, content);
        Message.success('已记录发送');
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
    title: "提醒与短信（预留）",
}));
const __VLS_2 = __VLS_1({
    title: "提醒与短信（预留）",
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
}));
const __VLS_35 = __VLS_34({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_37;
let __VLS_38;
let __VLS_39;
const __VLS_40 = {
    onClick: (__VLS_ctx.exportSms)
};
__VLS_36.slots.default;
var __VLS_36;
const __VLS_41 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    ...{ style: {} },
    type: "warning",
}));
const __VLS_43 = __VLS_42({
    ...{ style: {} },
    type: "warning",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
__VLS_44.slots.default;
var __VLS_44;
const __VLS_45 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    data: (__VLS_ctx.rows),
    pagination: (false),
}));
const __VLS_47 = __VLS_46({
    data: (__VLS_ctx.rows),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
const __VLS_49 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    title: "订单",
    dataIndex: "orderId",
}));
const __VLS_51 = __VLS_50({
    title: "订单",
    dataIndex: "orderId",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
const __VLS_53 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_55 = __VLS_54({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const __VLS_57 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    title: "商品",
    dataIndex: "productName",
}));
const __VLS_59 = __VLS_58({
    title: "商品",
    dataIndex: "productName",
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
const __VLS_61 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    title: "期次",
    dataIndex: "period",
}));
const __VLS_63 = __VLS_62({
    title: "期次",
    dataIndex: "period",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const __VLS_65 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
    title: "到期日",
    dataIndex: "dueDate",
}));
const __VLS_67 = __VLS_66({
    title: "到期日",
    dataIndex: "dueDate",
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
const __VLS_69 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    title: "金额",
    render: (({ record }) => `￥${record.amount}`),
}));
const __VLS_71 = __VLS_70({
    title: "金额",
    render: (({ record }) => `￥${record.amount}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const __VLS_73 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { type: 'primary', size: 'small', onClick: () => __VLS_ctx.send(record) }, () => '发送短信(模拟)')),
}));
const __VLS_75 = __VLS_74({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { type: 'primary', size: 'small', onClick: () => __VLS_ctx.send(record) }, () => '发送短信(模拟)')),
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
var __VLS_48;
const __VLS_77 = {}.ADivider;
/** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({}));
const __VLS_79 = __VLS_78({}, ...__VLS_functionalComponentArgsRest(__VLS_78));
const __VLS_81 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
    title: "发送记录",
    bordered: (false),
}));
const __VLS_83 = __VLS_82({
    title: "发送记录",
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_82));
__VLS_84.slots.default;
const __VLS_85 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
    data: (__VLS_ctx.records),
    pagination: (false),
    size: "small",
}));
const __VLS_87 = __VLS_86({
    data: (__VLS_ctx.records),
    pagination: (false),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_86));
__VLS_88.slots.default;
const __VLS_89 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
    title: "时间",
    dataIndex: "createdAt",
}));
const __VLS_91 = __VLS_90({
    title: "时间",
    dataIndex: "createdAt",
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
const __VLS_93 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_95 = __VLS_94({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_94));
const __VLS_97 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
    title: "内容",
    dataIndex: "content",
}));
const __VLS_99 = __VLS_98({
    title: "内容",
    dataIndex: "content",
}, ...__VLS_functionalComponentArgsRest(__VLS_98));
const __VLS_101 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
    title: "状态",
    dataIndex: "status",
}));
const __VLS_103 = __VLS_102({
    title: "状态",
    dataIndex: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_102));
var __VLS_88;
var __VLS_84;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            h: h,
            Button: Button,
            kind: kind,
            rows: rows,
            records: records,
            load: load,
            send: send,
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
