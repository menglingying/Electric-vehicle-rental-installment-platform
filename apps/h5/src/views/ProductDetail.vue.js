import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { createOrder, getProduct } from '@/services/api';
const route = useRoute();
const router = useRouter();
const product = ref(null);
// 期数选项
const periodOptions = [3, 6, 9, 12, 18, 24];
const periods = ref(12);
const cycleDays = ref(30);
const depositRatioPercent = ref(25);
const batteryOption = ref('WITHOUT_BATTERY');
const repaymentMethod = ref('MANUAL_TRANSFER');
const submitting = ref(false);
const planExpanded = ref([]);
// 是否有电池选项
const hasBatteryOptions = computed(() => {
    if (!product.value)
        return false;
    return product.value.rentWithoutBattery != null || product.value.rentWithBattery != null;
});
// 当前租金（根据电池选项）
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
// 押金金额
const depositAmount = computed(() => {
    return Math.round(currentRent.value * periods.value * depositRatioPercent.value / 100);
});
// 分期总额
const totalAmount = computed(() => {
    return currentRent.value * periods.value;
});
// 还款计划
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
    // 押金抵扣最后几期
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
        // 跳转到KYC资料补充页面
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
    const __VLS_8 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        inset: true,
    }));
    const __VLS_10 = __VLS_9({
        inset: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    if (__VLS_ctx.galleryImages.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "gallery" },
        });
        const __VLS_12 = {}.VanSwipe;
        /** @type {[typeof __VLS_components.VanSwipe, typeof __VLS_components.vanSwipe, typeof __VLS_components.VanSwipe, typeof __VLS_components.vanSwipe, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            autoplay: (3500),
            lazyRender: true,
        }));
        const __VLS_14 = __VLS_13({
            autoplay: (3500),
            lazyRender: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_15.slots.default;
        for (const [url, idx] of __VLS_getVForSourceType((__VLS_ctx.galleryImages))) {
            const __VLS_16 = {}.VanSwipeItem;
            /** @type {[typeof __VLS_components.VanSwipeItem, typeof __VLS_components.vanSwipeItem, typeof __VLS_components.VanSwipeItem, typeof __VLS_components.vanSwipeItem, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                key: (url + idx),
            }));
            const __VLS_18 = __VLS_17({
                key: (url + idx),
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            __VLS_19.slots.default;
            const __VLS_20 = {}.VanImage;
            /** @type {[typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                src: (url),
                width: "100%",
                height: "220",
                fit: "cover",
            }));
            const __VLS_22 = __VLS_21({
                src: (url),
                width: "100%",
                height: "220",
                fit: "cover",
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            var __VLS_19;
        }
        var __VLS_15;
    }
    const __VLS_24 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        title: (__VLS_ctx.product.name),
        label: (`租金/期：￥${__VLS_ctx.currentRent}`),
    }));
    const __VLS_26 = __VLS_25({
        title: (__VLS_ctx.product.name),
        label: (`租金/期：￥${__VLS_ctx.currentRent}`),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    if (__VLS_ctx.product.frameConfig) {
        const __VLS_28 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            title: "车架",
            value: (__VLS_ctx.product.frameConfig),
        }));
        const __VLS_30 = __VLS_29({
            title: "车架",
            value: (__VLS_ctx.product.frameConfig),
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    }
    var __VLS_11;
}
if (__VLS_ctx.product && __VLS_ctx.hasBatteryOptions) {
    const __VLS_32 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_34 = __VLS_33({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    const __VLS_36 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        title: "电池配置",
    }));
    const __VLS_38 = __VLS_37({
        title: "电池配置",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const __VLS_40 = {}.VanRadioGroup;
    /** @type {[typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.batteryOption),
        direction: "horizontal",
        ...{ style: {} },
    }));
    const __VLS_42 = __VLS_41({
        modelValue: (__VLS_ctx.batteryOption),
        direction: "horizontal",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    const __VLS_44 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        name: "WITHOUT_BATTERY",
    }));
    const __VLS_46 = __VLS_45({
        name: "WITHOUT_BATTERY",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    (__VLS_ctx.product.rentWithoutBattery || __VLS_ctx.product.rentPerCycle);
    var __VLS_47;
    const __VLS_48 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        name: "WITH_BATTERY",
    }));
    const __VLS_50 = __VLS_49({
        name: "WITH_BATTERY",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    (__VLS_ctx.product.rentWithBattery || __VLS_ctx.product.rentPerCycle);
    var __VLS_51;
    var __VLS_43;
    var __VLS_35;
}
if (__VLS_ctx.product) {
    const __VLS_52 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_54 = __VLS_53({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    const __VLS_56 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        title: "分期期数",
    }));
    const __VLS_58 = __VLS_57({
        title: "分期期数",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "period-selector" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.periodOptions))) {
        const __VLS_60 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
            ...{ 'onClick': {} },
            key: (p),
            type: (__VLS_ctx.periods === p ? 'primary' : 'default'),
            size: "small",
        }));
        const __VLS_62 = __VLS_61({
            ...{ 'onClick': {} },
            key: (p),
            type: (__VLS_ctx.periods === p ? 'primary' : 'default'),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        let __VLS_64;
        let __VLS_65;
        let __VLS_66;
        const __VLS_67 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.product))
                    return;
                __VLS_ctx.periods = p;
            }
        };
        __VLS_63.slots.default;
        (p);
        var __VLS_63;
    }
    var __VLS_55;
}
if (__VLS_ctx.product) {
    const __VLS_68 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_70 = __VLS_69({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    const __VLS_72 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        title: "还款方式",
    }));
    const __VLS_74 = __VLS_73({
        title: "还款方式",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    const __VLS_76 = {}.VanRadioGroup;
    /** @type {[typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        modelValue: (__VLS_ctx.repaymentMethod),
        direction: "horizontal",
        ...{ style: {} },
    }));
    const __VLS_78 = __VLS_77({
        modelValue: (__VLS_ctx.repaymentMethod),
        direction: "horizontal",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_79.slots.default;
    const __VLS_80 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        name: "AUTO_DEDUCT",
    }));
    const __VLS_82 = __VLS_81({
        name: "AUTO_DEDUCT",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_83.slots.default;
    var __VLS_83;
    const __VLS_84 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        name: "MANUAL_TRANSFER",
    }));
    const __VLS_86 = __VLS_85({
        name: "MANUAL_TRANSFER",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_87.slots.default;
    var __VLS_87;
    const __VLS_88 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        name: "OFFLINE",
    }));
    const __VLS_90 = __VLS_89({
        name: "OFFLINE",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    __VLS_91.slots.default;
    var __VLS_91;
    var __VLS_79;
    var __VLS_71;
}
if (__VLS_ctx.product) {
    const __VLS_92 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_94 = __VLS_93({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    __VLS_95.slots.default;
    const __VLS_96 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        modelValue: (__VLS_ctx.cycleDays),
        modelModifiers: { number: true, },
        type: "digit",
        label: "周期(天)",
        placeholder: "例如 30",
    }));
    const __VLS_98 = __VLS_97({
        modelValue: (__VLS_ctx.cycleDays),
        modelModifiers: { number: true, },
        type: "digit",
        label: "周期(天)",
        placeholder: "例如 30",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    const __VLS_100 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        modelValue: (__VLS_ctx.depositRatioPercent),
        modelModifiers: { number: true, },
        type: "digit",
        label: "押金比例(%)",
        placeholder: "例如 25",
    }));
    const __VLS_102 = __VLS_101({
        modelValue: (__VLS_ctx.depositRatioPercent),
        modelModifiers: { number: true, },
        type: "digit",
        label: "押金比例(%)",
        placeholder: "例如 25",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    var __VLS_95;
}
if (__VLS_ctx.product && __VLS_ctx.repaymentPlan.length) {
    const __VLS_104 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_106 = __VLS_105({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_107.slots.default;
    const __VLS_108 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        title: "还款计划预览",
    }));
    const __VLS_110 = __VLS_109({
        title: "还款计划预览",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
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
    const __VLS_112 = {}.VanCollapse;
    /** @type {[typeof __VLS_components.VanCollapse, typeof __VLS_components.vanCollapse, typeof __VLS_components.VanCollapse, typeof __VLS_components.vanCollapse, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        modelValue: (__VLS_ctx.planExpanded),
    }));
    const __VLS_114 = __VLS_113({
        modelValue: (__VLS_ctx.planExpanded),
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    __VLS_115.slots.default;
    const __VLS_116 = {}.VanCollapseItem;
    /** @type {[typeof __VLS_components.VanCollapseItem, typeof __VLS_components.vanCollapseItem, typeof __VLS_components.VanCollapseItem, typeof __VLS_components.vanCollapseItem, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        title: "查看详细还款计划",
        name: "plan",
    }));
    const __VLS_118 = __VLS_117({
        title: "查看详细还款计划",
        name: "plan",
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    __VLS_119.slots.default;
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
    var __VLS_119;
    var __VLS_115;
    var __VLS_107;
}
if (__VLS_ctx.product) {
    const __VLS_120 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_122 = __VLS_121({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    __VLS_123.slots.default;
    const __VLS_124 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        icon: "info-o",
        title: "订单创建后进入人工审核",
    }));
    const __VLS_126 = __VLS_125({
        icon: "info-o",
        title: "订单创建后进入人工审核",
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    var __VLS_123;
}
const __VLS_128 = {}.VanActionBar;
/** @type {[typeof __VLS_components.VanActionBar, typeof __VLS_components.vanActionBar, typeof __VLS_components.VanActionBar, typeof __VLS_components.vanActionBar, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({}));
const __VLS_130 = __VLS_129({}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
const __VLS_132 = {}.VanActionBarButton;
/** @type {[typeof __VLS_components.VanActionBarButton, typeof __VLS_components.vanActionBarButton, typeof __VLS_components.VanActionBarButton, typeof __VLS_components.vanActionBarButton, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.submitting),
}));
const __VLS_134 = __VLS_133({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
let __VLS_136;
let __VLS_137;
let __VLS_138;
const __VLS_139 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_135.slots.default;
var __VLS_135;
var __VLS_131;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery']} */ ;
/** @type {__VLS_StyleScopedClasses['period-selector']} */ ;
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
