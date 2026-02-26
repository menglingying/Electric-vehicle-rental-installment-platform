import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { createOrder, getProduct } from '@/services/api';
const route = useRoute();
const router = useRouter();
const product = ref(null);
const periodOptions = [3, 6, 9, 12, 18, 24];
const periods = ref(12);
const cycleDays = ref(30);
const depositRatioPercent = ref(25);
const batteryOption = ref('WITHOUT_BATTERY');
const repaymentMethod = ref('MANUAL_TRANSFER');
const submitting = ref(false);
const planExpanded = ref([]);
const hasBatteryOptions = computed(() => {
    if (!product.value)
        return false;
    return product.value.rentWithoutBattery != null || product.value.rentWithBattery != null;
});
const currentRent = computed(() => {
    if (!product.value)
        return 0;
    if (batteryOption.value === 'WITH_BATTERY' && product.value.rentWithBattery != null) {
        return product.value.rentWithBattery;
    }
    if (batteryOption.value === 'WITHOUT_BATTERY' && product.value.rentWithoutBattery != null) {
        return product.value.rentWithoutBattery;
    }
    return product.value.rentPerCycle;
});
const depositAmount = computed(() => {
    return Math.round((currentRent.value * periods.value * depositRatioPercent.value) / 100);
});
const totalAmount = computed(() => {
    return currentRent.value * periods.value;
});
const repaymentPlan = computed(() => {
    if (!product.value)
        return [];
    const plan = [];
    const today = new Date();
    for (let i = 1; i <= periods.value; i++) {
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + cycleDays.value * i);
        plan.push({
            period: i,
            dueDate: dueDate.toISOString().split('T')[0],
            amount: currentRent.value
        });
    }
    if (depositRatioPercent.value > 0) {
        let remaining = depositAmount.value;
        for (let i = plan.length - 1; i >= 0 && remaining > 0; i--) {
            const offset = Math.min(plan[i].amount, remaining);
            plan[i].amount -= offset;
            remaining -= offset;
        }
    }
    return plan;
});
const galleryImages = computed(() => {
    if (!product.value)
        return [];
    const imgs = (product.value.images ?? []).map((s) => String(s).trim()).filter(Boolean);
    if (imgs.length)
        return imgs;
    return product.value.coverUrl ? [product.value.coverUrl] : [];
});
async function load() {
    try {
        product.value = await getProduct(String(route.params.id));
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '加载失败');
    }
}
async function submit() {
    if (!product.value)
        return;
    submitting.value = true;
    try {
        const order = await createOrder({
            productId: product.value.id,
            periods: periods.value,
            cycleDays: cycleDays.value,
            depositRatio: depositRatioPercent.value / 100,
            batteryOption: batteryOption.value,
            repaymentMethod: repaymentMethod.value
        });
        showSuccessToast('下单成功');
        await router.replace(`/orders/${order.id}/kyc`);
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '下单失败');
    }
    finally {
        submitting.value = false;
    }
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['price-line']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-item']} */ ;
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
    title: "商品详情",
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "商品详情",
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
if (__VLS_ctx.product) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    if (__VLS_ctx.galleryImages.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "gallery" },
        });
        const __VLS_8 = {}.VanSwipe;
        /** @type {[typeof __VLS_components.VanSwipe, typeof __VLS_components.vanSwipe, typeof __VLS_components.VanSwipe, typeof __VLS_components.vanSwipe, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            autoplay: (3500),
            lazyRender: true,
        }));
        const __VLS_10 = __VLS_9({
            autoplay: (3500),
            lazyRender: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        __VLS_11.slots.default;
        for (const [url, idx] of __VLS_getVForSourceType((__VLS_ctx.galleryImages))) {
            const __VLS_12 = {}.VanSwipeItem;
            /** @type {[typeof __VLS_components.VanSwipeItem, typeof __VLS_components.vanSwipeItem, typeof __VLS_components.VanSwipeItem, typeof __VLS_components.vanSwipeItem, ]} */ ;
            // @ts-ignore
            const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
                key: (url + idx),
            }));
            const __VLS_14 = __VLS_13({
                key: (url + idx),
            }, ...__VLS_functionalComponentArgsRest(__VLS_13));
            __VLS_15.slots.default;
            const __VLS_16 = {}.VanImage;
            /** @type {[typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                src: (url),
                width: "100%",
                height: "220",
                fit: "cover",
            }));
            const __VLS_18 = __VLS_17({
                src: (url),
                width: "100%",
                height: "220",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            var __VLS_15;
        }
        var __VLS_11;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
        ...{ style: {} },
    });
    (__VLS_ctx.product.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "price-line" },
    });
    (__VLS_ctx.currentRent);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    if (__VLS_ctx.product.frameConfig) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-line" },
        });
        (__VLS_ctx.product.frameConfig);
    }
}
if (__VLS_ctx.product && __VLS_ctx.hasBatteryOptions) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_20 = {}.VanRadioGroup;
    /** @type {[typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        modelValue: (__VLS_ctx.batteryOption),
        direction: "horizontal",
    }));
    const __VLS_22 = __VLS_21({
        modelValue: (__VLS_ctx.batteryOption),
        direction: "horizontal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_23.slots.default;
    const __VLS_24 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        name: "WITHOUT_BATTERY",
    }));
    const __VLS_26 = __VLS_25({
        name: "WITHOUT_BATTERY",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    (__VLS_ctx.product.rentWithoutBattery || __VLS_ctx.product.rentPerCycle);
    var __VLS_27;
    const __VLS_28 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        name: "WITH_BATTERY",
    }));
    const __VLS_30 = __VLS_29({
        name: "WITH_BATTERY",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    (__VLS_ctx.product.rentWithBattery || __VLS_ctx.product.rentPerCycle);
    var __VLS_31;
    var __VLS_23;
}
if (__VLS_ctx.product) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "period-selector" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.periodOptions))) {
        const __VLS_32 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            ...{ 'onClick': {} },
            key: (p),
            type: (__VLS_ctx.periods === p ? 'primary' : 'default'),
            size: "small",
        }));
        const __VLS_34 = __VLS_33({
            ...{ 'onClick': {} },
            key: (p),
            type: (__VLS_ctx.periods === p ? 'primary' : 'default'),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        let __VLS_36;
        let __VLS_37;
        let __VLS_38;
        const __VLS_39 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.product))
                    return;
                __VLS_ctx.periods = p;
            }
        };
        __VLS_35.slots.default;
        (p);
        var __VLS_35;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-row" },
    });
    const __VLS_40 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.cycleDays),
        modelModifiers: { number: true, },
        type: "digit",
        label: "周期(天)",
        placeholder: "例如 30",
    }));
    const __VLS_42 = __VLS_41({
        modelValue: (__VLS_ctx.cycleDays),
        modelModifiers: { number: true, },
        type: "digit",
        label: "周期(天)",
        placeholder: "例如 30",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-row" },
    });
    const __VLS_44 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        modelValue: (__VLS_ctx.depositRatioPercent),
        modelModifiers: { number: true, },
        type: "digit",
        label: "押金比例(%)",
        placeholder: "例如 25",
    }));
    const __VLS_46 = __VLS_45({
        modelValue: (__VLS_ctx.depositRatioPercent),
        modelModifiers: { number: true, },
        type: "digit",
        label: "押金比例(%)",
        placeholder: "例如 25",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
        ...{ style: {} },
    });
    const __VLS_48 = {}.VanRadioGroup;
    /** @type {[typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        modelValue: (__VLS_ctx.repaymentMethod),
        direction: "horizontal",
    }));
    const __VLS_50 = __VLS_49({
        modelValue: (__VLS_ctx.repaymentMethod),
        direction: "horizontal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    const __VLS_52 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        name: "AUTO_DEDUCT",
    }));
    const __VLS_54 = __VLS_53({
        name: "AUTO_DEDUCT",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    var __VLS_55;
    const __VLS_56 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        name: "MANUAL_TRANSFER",
    }));
    const __VLS_58 = __VLS_57({
        name: "MANUAL_TRANSFER",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    var __VLS_59;
    const __VLS_60 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        name: "OFFLINE",
    }));
    const __VLS_62 = __VLS_61({
        name: "OFFLINE",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    var __VLS_63;
    var __VLS_51;
}
if (__VLS_ctx.product && __VLS_ctx.repaymentPlan.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "plan-summary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "value" },
    });
    (__VLS_ctx.currentRent);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "value" },
    });
    (__VLS_ctx.totalAmount);
    if (__VLS_ctx.depositAmount > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "value" },
        });
        (__VLS_ctx.depositAmount);
    }
    const __VLS_64 = {}.VanCollapse;
    /** @type {[typeof __VLS_components.VanCollapse, typeof __VLS_components.vanCollapse, typeof __VLS_components.VanCollapse, typeof __VLS_components.vanCollapse, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        modelValue: (__VLS_ctx.planExpanded),
    }));
    const __VLS_66 = __VLS_65({
        modelValue: (__VLS_ctx.planExpanded),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    const __VLS_68 = {}.VanCollapseItem;
    /** @type {[typeof __VLS_components.VanCollapseItem, typeof __VLS_components.vanCollapseItem, typeof __VLS_components.VanCollapseItem, typeof __VLS_components.vanCollapseItem, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        title: "查看详细还款计划",
        name: "plan",
    }));
    const __VLS_70 = __VLS_69({
        title: "查看详细还款计划",
        name: "plan",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "plan-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.repaymentPlan))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (item.period),
            ...{ class: "plan-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "period" },
        });
        (item.period);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "date" },
        });
        (item.dueDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "amount" },
        });
        (item.amount);
    }
    var __VLS_71;
    var __VLS_67;
}
if (__VLS_ctx.product) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-line" },
    });
}
const __VLS_72 = {}.VanActionBar;
/** @type {[typeof __VLS_components.VanActionBar, typeof __VLS_components.vanActionBar, typeof __VLS_components.VanActionBar, typeof __VLS_components.vanActionBar, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({}));
const __VLS_74 = __VLS_73({}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.VanActionBarButton;
/** @type {[typeof __VLS_components.VanActionBarButton, typeof __VLS_components.vanActionBarButton, typeof __VLS_components.VanActionBarButton, typeof __VLS_components.vanActionBarButton, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.submitting),
}));
const __VLS_78 = __VLS_77({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
let __VLS_80;
let __VLS_81;
let __VLS_82;
const __VLS_83 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_79.slots.default;
var __VLS_79;
var __VLS_75;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['price-line']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['period-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-list']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['period']} */ ;
/** @type {__VLS_StyleScopedClasses['date']} */ ;
/** @type {__VLS_StyleScopedClasses['amount']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-line']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            product: product,
            periodOptions: periodOptions,
            periods: periods,
            cycleDays: cycleDays,
            depositRatioPercent: depositRatioPercent,
            batteryOption: batteryOption,
            repaymentMethod: repaymentMethod,
            submitting: submitting,
            planExpanded: planExpanded,
            hasBatteryOptions: hasBatteryOptions,
            currentRent: currentRent,
            depositAmount: depositAmount,
            totalAmount: totalAmount,
            repaymentPlan: repaymentPlan,
            galleryImages: galleryImages,
            submit: submit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
