import { h, onMounted, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
import { addBlacklist, listBlacklist, removeBlacklist } from '@/services/api';
import { isSuper } from '@/services/auth';
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
    modelValue: (__VLS_ctx.phone),
    placeholder: "手机号",
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.phone),
    placeholder: "手机号",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    modelValue: (__VLS_ctx.reason),
    placeholder: "原因",
    ...{ style: {} },
}));
const __VLS_6 = __VLS_5({
    modelValue: (__VLS_ctx.reason),
    placeholder: "原因",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
const __VLS_8 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.add)
};
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_16 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    data: (__VLS_ctx.rows),
    pagination: (false),
}));
const __VLS_18 = __VLS_17({
    data: (__VLS_ctx.rows),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    title: "手机号",
    dataIndex: "phone",
}));
const __VLS_22 = __VLS_21({
    title: "手机号",
    dataIndex: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    title: "原因",
    dataIndex: "reason",
}));
const __VLS_26 = __VLS_25({
    title: "原因",
    dataIndex: "reason",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    title: "创建时间",
    dataIndex: "createdAt",
}));
const __VLS_30 = __VLS_29({
    title: "创建时间",
    dataIndex: "createdAt",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.ATableColumn;
/** @type {[typeof __VLS_components.ATableColumn, typeof __VLS_components.aTableColumn, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    title: "操作",
    render: (({ record }) => __VLS_ctx.isSuper()
        ? __VLS_ctx.h(__VLS_ctx.Button, { status: 'danger', size: 'small', onClick: () => __VLS_ctx.remove(record.phone) }, () => '移除')
        : null),
}));
const __VLS_34 = __VLS_33({
    title: "操作",
    render: (({ record }) => __VLS_ctx.isSuper()
        ? __VLS_ctx.h(__VLS_ctx.Button, { status: 'danger', size: 'small', onClick: () => __VLS_ctx.remove(record.phone) }, () => '移除')
        : null),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
var __VLS_19;
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
            isSuper: isSuper,
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
