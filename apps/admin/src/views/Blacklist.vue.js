import { h, onMounted, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
import { addBlacklist, listBlacklist, removeBlacklist } from '@/services/api';
const rows = ref([]);
const phone = ref('');
const reason = ref('');
async function load() {
    try {
        rows.value = await listBlacklist();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
async function add() {
    if (!phone.value)
        return Message.warning('请输入手机号');
    try {
        await addBlacklist(phone.value, reason.value || '风险客户');
        phone.value = '';
        reason.value = '';
        Message.success('已加入');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
async function remove(p) {
    try {
        await removeBlacklist(p);
        Message.success('已移除');
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '操作失败');
    }
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: "黑名单",
}));
const __VLS_2 = __VLS_1({
    title: "黑名单",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_5 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    modelValue: (__VLS_ctx.phone),
    placeholder: "手机号",
    ...{ style: {} },
}));
const __VLS_7 = __VLS_6({
    modelValue: (__VLS_ctx.phone),
    placeholder: "手机号",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const __VLS_9 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    modelValue: (__VLS_ctx.reason),
    placeholder: "原因",
    ...{ style: {} },
}));
const __VLS_11 = __VLS_10({
    modelValue: (__VLS_ctx.reason),
    placeholder: "原因",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const __VLS_13 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_15 = __VLS_14({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
let __VLS_17;
let __VLS_18;
let __VLS_19;
const __VLS_20 = {
    onClick: (__VLS_ctx.add)
};
__VLS_16.slots.default;
var __VLS_16;
const __VLS_21 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    data: (__VLS_ctx.rows),
    pagination: (false),
}));
const __VLS_23 = __VLS_22({
    data: (__VLS_ctx.rows),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
const __VLS_25 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_27 = __VLS_26({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
const __VLS_29 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    title: "原因",
    dataIndex: "reason",
}));
const __VLS_31 = __VLS_30({
    title: "原因",
    dataIndex: "reason",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const __VLS_33 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    title: "创建时间",
    dataIndex: "createdAt",
}));
const __VLS_35 = __VLS_34({
    title: "创建时间",
    dataIndex: "createdAt",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const __VLS_37 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { status: 'danger', size: 'small', onClick: () => __VLS_ctx.remove(record.phone) }, () => '移除')),
}));
const __VLS_39 = __VLS_38({
    title: "操作",
    render: (({ record }) => __VLS_ctx.h(__VLS_ctx.Button, { status: 'danger', size: 'small', onClick: () => __VLS_ctx.remove(record.phone) }, () => '移除')),
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
var __VLS_24;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            h: h,
            Button: Button,
            rows: rows,
            phone: phone,
            reason: reason,
            add: add,
            remove: remove,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
