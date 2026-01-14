import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, startContract, startPayment } from '@/services/api';
const route = useRoute();
const router = useRouter();
const order = ref(null);
const contractLoading = ref(false);
const paymentLoading = ref(false);
function statusText(status) {
    switch (status) {
        case 'PENDING_REVIEW':
            return '待审核';
        case 'ACTIVE':
            return '待交付';
        case 'DELIVERED':
            return '已交付';
        case 'IN_USE':
            return '租赁中';
        case 'RETURNED':
            return '已归还';
        case 'SETTLED':
            return '已结清';
        case 'REJECTED':
            return '已驳回';
        case 'CLOSED':
            return '已关闭';
        default:
            return status;
    }
}
function contractStatusText(status) {
    if (!status)
        return '未发起';
    if (status === 'SIGNING')
        return '签署中';
    if (status === 'SIGNED')
        return '已签署';
    if (status === 'FAILED')
        return '失败';
    return status;
}
function batteryOptionText(option) {
    if (option === 'WITHOUT_BATTERY')
        return '空车';
    if (option === 'WITH_BATTERY')
        return '含电池';
    return option || '-';
}
function repaymentMethodText(method) {
    if (method === 'AUTO_DEDUCT')
        return '自动扣款';
    if (method === 'MANUAL_TRANSFER')
        return '手动转账';
    if (method === 'OFFLINE')
        return '线下收款';
    return method || '-';
}
function goToKyc() {
    router.push(`/orders/${order.value?.id}/kyc`);
}
async function onStartContract() {
    if (!order.value)
        return;
    contractLoading.value = true;
    try {
        const c = await startContract(order.value.id);
        showSuccessToast('已生成签署链接（预留）');
        // 预留：对接真实供应商后跳转签署页
        window.open(c.signUrl, '_blank');
        await load();
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '发起失败');
    }
    finally {
        contractLoading.value = false;
    }
}
async function onStartPayment() {
    if (!order.value)
        return;
    paymentLoading.value = true;
    try {
        const pay = await startPayment(order.value.id);
        showSuccessToast('已生成收银台链接（预留）');
        window.open(pay.cashierUrl, '_blank');
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '操作失败');
    }
    finally {
        paymentLoading.value = false;
    }
}
async function load() {
    try {
        order.value = await getOrder(String(route.params.id));
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '加载失败');
    }
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page" },
});
const __VLS_0 = {}.VanNavBar;
/** @type {[typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClickLeft': {} },
    title: "订单详情",
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "订单详情",
    leftArrow: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClickLeft: (...[$event]) => {
        __VLS_ctx.router.back();
    }
};
var __VLS_3;
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    (__VLS_ctx.order.productName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sub" },
    });
    (__VLS_ctx.statusText(__VLS_ctx.order.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sub" },
    });
    (__VLS_ctx.order.periods);
    (__VLS_ctx.order.cycleDays);
    if (__VLS_ctx.order.batteryOption) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.batteryOptionText(__VLS_ctx.order.batteryOption));
    }
    if (__VLS_ctx.order.repaymentMethod) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.repaymentMethodText(__VLS_ctx.order.repaymentMethod));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sub" },
    });
    (__VLS_ctx.order.createdAt);
    if (__VLS_ctx.order.approvedAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.order.approvedAt);
    }
    if (__VLS_ctx.order.deliveredAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.order.deliveredAt);
    }
    if (__VLS_ctx.order.pickedUpAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.order.pickedUpAt);
    }
    if (__VLS_ctx.order.returnedAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.order.returnedAt);
    }
    if (__VLS_ctx.order.settledAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.order.settledAt);
    }
}
if (__VLS_ctx.order && !__VLS_ctx.order.kycCompleted) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card kyc-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sub" },
    });
    const __VLS_8 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
        ...{ style: {} },
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        type: "primary",
        size: "small",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.goToKyc)
    };
    __VLS_11.slots.default;
    var __VLS_11;
}
else if (__VLS_ctx.order && __VLS_ctx.order.kycCompleted) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card kyc-done" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    if (__VLS_ctx.order.realName) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sub" },
        });
        (__VLS_ctx.order.realName);
    }
}
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sub" },
    });
    (__VLS_ctx.contractStatusText(__VLS_ctx.order.contract?.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_16 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        type: "primary",
        block: true,
        loading: (__VLS_ctx.contractLoading),
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        type: "primary",
        block: true,
        loading: (__VLS_ctx.contractLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.onStartContract)
    };
    __VLS_19.slots.default;
    var __VLS_19;
}
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sub" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_24 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        type: "default",
        block: true,
        loading: (__VLS_ctx.paymentLoading),
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        type: "default",
        block: true,
        loading: (__VLS_ctx.paymentLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (__VLS_ctx.onStartPayment)
    };
    __VLS_27.slots.default;
    var __VLS_27;
}
if (__VLS_ctx.order?.repaymentPlan) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    for (const [p, idx] of __VLS_getVForSourceType((__VLS_ctx.order.repaymentPlan))) {
        const __VLS_32 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            key: (idx),
            title: (`第${p.period}期`),
            label: (`应还日：${p.dueDate} · ${p.paid ? '已还' : '未还'}`),
            value: (`￥${p.amount}`),
        }));
        const __VLS_34 = __VLS_33({
            key: (idx),
            title: (`第${p.period}期`),
            label: (`应还日：${p.dueDate} · ${p.paid ? '已还' : '未还'}`),
            value: (`￥${p.amount}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint" },
    });
}
if (__VLS_ctx.order?.repaymentRecords?.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "title" },
    });
    for (const [r, idx] of __VLS_getVForSourceType((__VLS_ctx.order.repaymentRecords))) {
        const __VLS_36 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            key: (idx),
            title: (`第${r.period}期`),
            label: (`时间：${r.paidAt}`),
            value: (`￥${r.amount}`),
        }));
        const __VLS_38 = __VLS_37({
            key: (idx),
            title: (`第${r.period}期`),
            label: (`时间：${r.paidAt}`),
            value: (`￥${r.amount}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['kyc-card']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['kyc-done']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['sub']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            order: order,
            contractLoading: contractLoading,
            paymentLoading: paymentLoading,
            statusText: statusText,
            contractStatusText: contractStatusText,
            batteryOptionText: batteryOptionText,
            repaymentMethodText: repaymentMethodText,
            goToKyc: goToKyc,
            onStartContract: onStartContract,
            onStartPayment: onStartPayment,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
