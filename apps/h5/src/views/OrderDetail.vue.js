import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, startAsignAuth, startPayment, getNotarySignUrl } from '@/services/api';
const route = useRoute();
const router = useRouter();
const order = ref(null);
const paymentLoading = ref(false);
const asignLoading = ref(false);
const notarySignLoading = ref(false);
const loading = ref(false);
const paymentAllowedStatuses = new Set(['ACTIVE', 'DELIVERED', 'IN_USE', 'RETURNED']);
const shouldShowKycPrompt = computed(() => !!order.value && !order.value.kycCompleted && order.value.status === 'PENDING_REVIEW');
const shouldShowKycBlocked = computed(() => !!order.value && !order.value.kycCompleted && order.value.status !== 'PENDING_REVIEW');
const kycBlockedReason = computed(() => {
    if (!order.value)
        return '';
    if (order.value.status === 'REJECTED')
        return '订单已驳回，暂不支持补充资料';
    if (order.value.status === 'CLOSED')
        return '订单已关闭，暂不支持补充资料';
    if (order.value.status === 'SETTLED')
        return '订单已结清，暂不支持补充资料';
    if (order.value.status === 'ACTIVE' ||
        order.value.status === 'DELIVERED' ||
        order.value.status === 'IN_USE' ||
        order.value.status === 'RETURNED') {
        return '订单已进入履约流程，暂不支持补充资料';
    }
    return '';
});
const canSignContract = computed(() => {
    if (!order.value?.contract)
        return false;
    return order.value.contract.status === 'SIGNING' && !!order.value.contract.signUrl;
});
const contractFileUrl = computed(() => order.value?.contract?.fileUrl);
const contractHint = computed(() => {
    if (!order.value)
        return '';
    if (!order.value.contract)
        return '合同待生成（审核通过后生成）';
    if (order.value.contract.status === 'SIGNING' && !order.value.contract.signUrl) {
        return '签署链接待生成，请联系平台';
    }
    if (order.value.contract.status === 'SIGNED')
        return '合同已签署';
    if (order.value.contract.status === 'VOID')
        return '合同已作废';
    if (order.value.contract.contractType === 'MANUAL')
        return '历史合同已录入';
    return '';
});
const canStartPayment = computed(() => !!order.value && paymentAllowedStatuses.has(order.value.status));
const paymentBlockedReason = computed(() => buildBlockedReason(order.value?.status, '收款'));
// 状态20=申办中时，可以签署公证
const canSignNotary = computed(() => !!order.value && order.value.notaryStatus === '20');
function buildBlockedReason(status, target) {
    if (!status)
        return '';
    if (status === 'PENDING_REVIEW')
        return `订单待审核，暂不支持发起${target}`;
    if (status === 'REJECTED')
        return `订单已驳回，暂不支持发起${target}`;
    if (status === 'CLOSED')
        return `订单已关闭，暂不支持发起${target}`;
    if (status === 'SETTLED')
        return `订单已结清，无需发起${target}`;
    return `当前状态暂不支持发起${target}`;
}
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
function contractStatusText(status, type) {
    if (type === 'MANUAL')
        return '历史合同';
    if (!status)
        return '未发起';
    if (status === 'SIGNING')
        return '签署中';
    if (status === 'SIGNED')
        return '已签署';
    if (status === 'FAILED')
        return '失败';
    if (status === 'VOID')
        return '已作废';
    return status;
}
function notaryStatusText(status) {
    if (!status)
        return '未发起';
    if (status === '10')
        return '预审中';
    if (status === '11')
        return '预审不通过';
    if (status === '20')
        return '申办中';
    if (status === '21')
        return '申办终止';
    if (status === '22')
        return '申办成功';
    if (status === '23')
        return '申办完结';
    if (status === '31')
        return '受理中';
    if (status === '33')
        return '已出证';
    if (status === '34')
        return '异常终止';
    if (status === 'FAILED')
        return '发起失败';
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
function onOpenSignUrl() {
    if (!order.value?.contract?.signUrl)
        return;
    window.open(order.value.contract.signUrl, '_blank');
}
function onOpenContractFile() {
    if (!order.value?.contract?.fileUrl)
        return;
    window.open(order.value.contract.fileUrl, '_blank');
}
function onOpenNotaryCert() {
    if (!order.value?.notaryCertUrl)
        return;
    window.open(order.value.notaryCertUrl, '_blank');
}
async function onSignNotary() {
    if (!order.value)
        return;
    notarySignLoading.value = true;
    try {
        const result = await getNotarySignUrl(order.value.id);
        if (!result.signUrl) {
            showFailToast('签署链接获取失败');
            return;
        }
        // 直接跳转到签署页面
        window.location.href = result.signUrl;
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '获取签署链接失败');
    }
    finally {
        notarySignLoading.value = false;
    }
}
async function onStartPayment() {
    if (!order.value)
        return;
    paymentLoading.value = true;
    try {
        const pay = await startPayment(order.value.id);
        showSuccessToast('已生成收银台链接');
        window.open(pay.cashierUrl, '_blank');
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '操作失败');
    }
    finally {
        paymentLoading.value = false;
    }
}
async function onStartAsignAuth() {
    if (!order.value)
        return;
    asignLoading.value = true;
    try {
        const result = await startAsignAuth(order.value.id);
        if (!result.authUrl) {
            showFailToast('爱签认证链接获取失败');
            return;
        }
        showSuccessToast('已生成实名认证链接');
        window.open(result.authUrl, '_blank');
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '操作失败');
    }
    finally {
        asignLoading.value = false;
    }
}
async function load(options) {
    if (loading.value)
        return;
    loading.value = true;
    try {
        order.value = await getOrder(String(route.params.id), options);
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '加载失败');
    }
    finally {
        loading.value = false;
    }
}
function refreshIfVisible() {
    if (document.visibilityState === 'visible') {
        void load({ bypassCache: true });
    }
}
onMounted(() => {
    void load({ bypassCache: true });
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
});
onUnmounted(() => {
    document.removeEventListener('visibilitychange', refreshIfVisible);
    window.removeEventListener('focus', refreshIfVisible);
});
watch(() => route.params.id, (next, prev) => {
    if (next && next !== prev) {
        void load({ bypassCache: true });
    }
});
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
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.order.productName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.statusText(__VLS_ctx.order.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.order.periods);
    (__VLS_ctx.order.cycleDays);
    if (__VLS_ctx.order.batteryOption) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.batteryOptionText(__VLS_ctx.order.batteryOption));
    }
    if (__VLS_ctx.order.repaymentMethod) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.repaymentMethodText(__VLS_ctx.order.repaymentMethod));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.order.createdAt);
    if (__VLS_ctx.order.approvedAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.approvedAt);
    }
    if (__VLS_ctx.order.deliveredAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.deliveredAt);
    }
    if (__VLS_ctx.order.pickedUpAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.pickedUpAt);
    }
    if (__VLS_ctx.order.returnedAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.returnedAt);
    }
    if (__VLS_ctx.order.settledAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.settledAt);
    }
}
if (__VLS_ctx.shouldShowKycPrompt) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
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
else if (__VLS_ctx.shouldShowKycBlocked) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.kycBlockedReason);
}
else if (__VLS_ctx.order && __VLS_ctx.order.kycCompleted) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    if (__VLS_ctx.order.realName) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.realName);
    }
}
if (__VLS_ctx.order && __VLS_ctx.order.kycCompleted) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.order.asignSerialNo ? '已完成' : '未完成');
    if (!__VLS_ctx.order.asignSerialNo) {
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
            loading: (__VLS_ctx.asignLoading),
        }));
        const __VLS_18 = __VLS_17({
            ...{ 'onClick': {} },
            type: "primary",
            block: true,
            loading: (__VLS_ctx.asignLoading),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        let __VLS_20;
        let __VLS_21;
        let __VLS_22;
        const __VLS_23 = {
            onClick: (__VLS_ctx.onStartAsignAuth)
        };
        __VLS_19.slots.default;
        var __VLS_19;
    }
}
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.contractStatusText(__VLS_ctx.order.contract?.status, __VLS_ctx.order.contract?.contractType));
    if (__VLS_ctx.contractHint) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.contractHint);
    }
    if (__VLS_ctx.canSignContract || __VLS_ctx.contractFileUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        if (__VLS_ctx.canSignContract) {
            const __VLS_24 = {}.VanButton;
            /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
                ...{ 'onClick': {} },
                type: "primary",
                block: true,
            }));
            const __VLS_26 = __VLS_25({
                ...{ 'onClick': {} },
                type: "primary",
                block: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
            let __VLS_28;
            let __VLS_29;
            let __VLS_30;
            const __VLS_31 = {
                onClick: (__VLS_ctx.onOpenSignUrl)
            };
            __VLS_27.slots.default;
            var __VLS_27;
        }
        if (__VLS_ctx.contractFileUrl) {
            const __VLS_32 = {}.VanButton;
            /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
            // @ts-ignore
            const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
                ...{ 'onClick': {} },
                type: "default",
                block: true,
            }));
            const __VLS_34 = __VLS_33({
                ...{ 'onClick': {} },
                type: "default",
                block: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_33));
            let __VLS_36;
            let __VLS_37;
            let __VLS_38;
            const __VLS_39 = {
                onClick: (__VLS_ctx.onOpenContractFile)
            };
            __VLS_35.slots.default;
            var __VLS_35;
        }
    }
}
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    (__VLS_ctx.notaryStatusText(__VLS_ctx.order.notaryStatus));
    if (__VLS_ctx.order.notaryOrderNo) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.notaryOrderNo);
    }
    if (__VLS_ctx.order.notaryName) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.notaryName);
    }
    if (__VLS_ctx.order.notaryCertifiedTime) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.order.notaryCertifiedTime);
    }
    if (__VLS_ctx.canSignNotary) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_40 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            ...{ 'onClick': {} },
            type: "primary",
            block: true,
            loading: (__VLS_ctx.notarySignLoading),
        }));
        const __VLS_42 = __VLS_41({
            ...{ 'onClick': {} },
            type: "primary",
            block: true,
            loading: (__VLS_ctx.notarySignLoading),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        let __VLS_44;
        let __VLS_45;
        let __VLS_46;
        const __VLS_47 = {
            onClick: (__VLS_ctx.onSignNotary)
        };
        __VLS_43.slots.default;
        var __VLS_43;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
            ...{ style: {} },
        });
    }
    if (__VLS_ctx.order.notaryCertUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_48 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
            ...{ 'onClick': {} },
            type: "default",
            block: true,
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onClick': {} },
            type: "default",
            block: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_52;
        let __VLS_53;
        let __VLS_54;
        const __VLS_55 = {
            onClick: (__VLS_ctx.onOpenNotaryCert)
        };
        __VLS_51.slots.default;
        var __VLS_51;
    }
}
if (__VLS_ctx.order) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
    if (__VLS_ctx.canStartPayment) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_56 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
            ...{ 'onClick': {} },
            type: "default",
            block: true,
            loading: (__VLS_ctx.paymentLoading),
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onClick': {} },
            type: "default",
            block: true,
            loading: (__VLS_ctx.paymentLoading),
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_60;
        let __VLS_61;
        let __VLS_62;
        const __VLS_63 = {
            onClick: (__VLS_ctx.onStartPayment)
        };
        __VLS_59.slots.default;
        var __VLS_59;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.paymentBlockedReason);
    }
}
if (__VLS_ctx.order?.repaymentPlan) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    for (const [p, idx] of __VLS_getVForSourceType((__VLS_ctx.order.repaymentPlan))) {
        const __VLS_64 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            key: (idx),
            title: (`第${p.period}期`),
            label: (`应还日：${p.dueDate} · ${p.paid ? '已还' : '未还'}`),
            value: (`¥${p.amount}`),
        }));
        const __VLS_66 = __VLS_65({
            key: (idx),
            title: (`第${p.period}期`),
            label: (`应还日：${p.dueDate} · ${p.paid ? '已还' : '未还'}`),
            value: (`¥${p.amount}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
}
if (__VLS_ctx.order?.repaymentRecords?.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    for (const [r, idx] of __VLS_getVForSourceType((__VLS_ctx.order.repaymentRecords))) {
        const __VLS_68 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
            key: (idx),
            title: (`第${r.period}期`),
            label: (`时间：${r.paidAt}`),
            value: (`¥${r.amount}`),
        }));
        const __VLS_70 = __VLS_69({
            key: (idx),
            title: (`第${r.period}期`),
            label: (`时间：${r.paidAt}`),
            value: (`¥${r.amount}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    }
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            order: order,
            paymentLoading: paymentLoading,
            asignLoading: asignLoading,
            notarySignLoading: notarySignLoading,
            shouldShowKycPrompt: shouldShowKycPrompt,
            shouldShowKycBlocked: shouldShowKycBlocked,
            kycBlockedReason: kycBlockedReason,
            canSignContract: canSignContract,
            contractFileUrl: contractFileUrl,
            contractHint: contractHint,
            canStartPayment: canStartPayment,
            paymentBlockedReason: paymentBlockedReason,
            canSignNotary: canSignNotary,
            statusText: statusText,
            contractStatusText: contractStatusText,
            notaryStatusText: notaryStatusText,
            batteryOptionText: batteryOptionText,
            repaymentMethodText: repaymentMethodText,
            goToKyc: goToKyc,
            onOpenSignUrl: onOpenSignUrl,
            onOpenContractFile: onOpenContractFile,
            onOpenNotaryCert: onOpenNotaryCert,
            onSignNotary: onSignNotary,
            onStartPayment: onStartPayment,
            onStartAsignAuth: onStartAsignAuth,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
