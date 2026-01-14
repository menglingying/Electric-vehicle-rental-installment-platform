import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { listOrders } from '@/services/api';
const router = useRouter();
const orders = ref([]);
const loading = ref(false);
const refreshing = ref(false);
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
async function load() {
    loading.value = true;
    try {
        orders.value = await listOrders();
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '加载失败');
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function go(id) {
    router.push(`/orders/${id}`);
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
    title: "我的订单",
}));
const __VLS_2 = __VLS_1({
    title: "我的订单",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.VanPullRefresh;
/** @type {[typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}));
const __VLS_6 = __VLS_5({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onRefresh: (__VLS_ctx.load)
};
__VLS_7.slots.default;
const __VLS_12 = {}.VanList;
/** @type {[typeof __VLS_components.VanList, typeof __VLS_components.vanList, typeof __VLS_components.VanList, typeof __VLS_components.vanList, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    loading: (__VLS_ctx.loading),
    finished: (true),
    finishedText: "没有更多了",
}));
const __VLS_14 = __VLS_13({
    loading: (__VLS_ctx.loading),
    finished: (true),
    finishedText: "没有更多了",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
for (const [o] of __VLS_getVForSourceType((__VLS_ctx.orders))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.go(o.id);
            } },
        key: (o.id),
        ...{ class: "order-item" },
    });
    const __VLS_16 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        title: (o.productName),
        isLink: true,
    }));
    const __VLS_18 = __VLS_17({
        title: (o.productName),
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    {
        const { label: __VLS_thisSlot } = __VLS_19.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "order-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.statusText(o.status));
        (o.periods);
        (o.cycleDays);
        if (!o.kycCompleted) {
            const __VLS_20 = {}.VanTag;
            /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                type: "warning",
                ...{ style: {} },
            }));
            const __VLS_22 = __VLS_21({
                type: "warning",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            __VLS_23.slots.default;
            var __VLS_23;
        }
    }
    var __VLS_19;
}
var __VLS_15;
var __VLS_7;
const __VLS_24 = {}.VanTabbar;
/** @type {[typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    route: true,
}));
const __VLS_26 = __VLS_25({
    route: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    replace: true,
    to: "/products",
    icon: "shop-o",
}));
const __VLS_30 = __VLS_29({
    replace: true,
    to: "/products",
    icon: "shop-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
var __VLS_31;
const __VLS_32 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    replace: true,
    to: "/orders",
    icon: "orders-o",
}));
const __VLS_34 = __VLS_33({
    replace: true,
    to: "/orders",
    icon: "orders-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
var __VLS_35;
var __VLS_27;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['order-item']} */ ;
/** @type {__VLS_StyleScopedClasses['order-info']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            orders: orders,
            loading: loading,
            refreshing: refreshing,
            statusText: statusText,
            load: load,
            go: go,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
