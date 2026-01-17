import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { listCategoryTree, listProductsByCategory } from '@/services/api';
const router = useRouter();
const products = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const categories = ref([]);
const categoryIndex = ref(0);
const seriesIndex = ref(0);
const selectedModelId = ref('');
const seriesList = computed(() => categories.value[categoryIndex.value]?.children ?? []);
const modelList = computed(() => seriesList.value[seriesIndex.value]?.children ?? []);
function initSelection() {
    if (!categories.value.length)
        return;
    categoryIndex.value = 0;
    seriesIndex.value = 0;
    const firstModel = modelList.value[0];
    selectedModelId.value = firstModel?.id ?? '';
}
async function loadCategories() {
    try {
        categories.value = await listCategoryTree();
        initSelection();
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '分类加载失败');
    }
}
async function loadProducts() {
    loading.value = true;
    try {
        if (!selectedModelId.value) {
            products.value = [];
        }
        else {
            products.value = await listProductsByCategory(selectedModelId.value);
        }
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
    router.push(`/products/${id}`);
}
function selectModel(id) {
    selectedModelId.value = id;
    loadProducts();
}
watch([categoryIndex], () => {
    seriesIndex.value = 0;
    const firstModel = modelList.value[0];
    selectedModelId.value = firstModel?.id ?? '';
    loadProducts();
});
watch([seriesIndex], () => {
    const firstModel = modelList.value[0];
    selectedModelId.value = firstModel?.id ?? '';
    loadProducts();
});
onMounted(async () => {
    await loadCategories();
    await loadProducts();
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
    title: "商品列表",
}));
const __VLS_2 = __VLS_1({
    title: "商品列表",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "category-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
const __VLS_4 = {}.VanTabs;
/** @type {[typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    active: (__VLS_ctx.categoryIndex),
    shrink: true,
    swipeable: true,
}));
const __VLS_6 = __VLS_5({
    active: (__VLS_ctx.categoryIndex),
    shrink: true,
    swipeable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    const __VLS_8 = {}.VanTab;
    /** @type {[typeof __VLS_components.VanTab, typeof __VLS_components.vanTab, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        key: (c.id),
        title: (c.name),
    }));
    const __VLS_10 = __VLS_9({
        key: (c.id),
        title: (c.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
var __VLS_7;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
const __VLS_12 = {}.VanTabs;
/** @type {[typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    active: (__VLS_ctx.seriesIndex),
    shrink: true,
    swipeable: true,
}));
const __VLS_14 = __VLS_13({
    active: (__VLS_ctx.seriesIndex),
    shrink: true,
    swipeable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.seriesList))) {
    const __VLS_16 = {}.VanTab;
    /** @type {[typeof __VLS_components.VanTab, typeof __VLS_components.vanTab, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        key: (s.id),
        title: (s.name),
    }));
    const __VLS_18 = __VLS_17({
        key: (s.id),
        title: (s.name),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
}
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "model-list" },
});
for (const [m] of __VLS_getVForSourceType((__VLS_ctx.modelList))) {
    const __VLS_20 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        key: (m.id),
        size: "small",
        type: (m.id === __VLS_ctx.selectedModelId ? 'primary' : 'default'),
        plain: true,
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        key: (m.id),
        size: "small",
        type: (m.id === __VLS_ctx.selectedModelId ? 'primary' : 'default'),
        plain: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (...[$event]) => {
            __VLS_ctx.selectModel(m.id);
        }
    };
    __VLS_23.slots.default;
    (m.name);
    var __VLS_23;
}
const __VLS_28 = {}.VanPullRefresh;
/** @type {[typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onRefresh: (__VLS_ctx.loadProducts)
};
__VLS_31.slots.default;
const __VLS_36 = {}.VanList;
/** @type {[typeof __VLS_components.VanList, typeof __VLS_components.vanList, typeof __VLS_components.VanList, typeof __VLS_components.vanList, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    loading: (__VLS_ctx.loading),
    finished: (true),
    finishedText: "没有更多了",
}));
const __VLS_38 = __VLS_37({
    loading: (__VLS_ctx.loading),
    finished: (true),
    finishedText: "没有更多了",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
for (const [p] of __VLS_getVForSourceType((__VLS_ctx.products))) {
    const __VLS_40 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ 'onClick': {} },
        key: (p.id),
        title: (p.name),
        label: (`租金/期：￥${p.rentPerCycle}`),
        isLink: true,
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
        key: (p.id),
        title: (p.name),
        label: (`租金/期：￥${p.rentPerCycle}`),
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_44;
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = {
        onClick: (...[$event]) => {
            __VLS_ctx.go(p.id);
        }
    };
    __VLS_43.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_43.slots;
        if (p.coverUrl) {
            const __VLS_48 = {}.VanImage;
            /** @type {[typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, ]} */ ;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
                src: (p.coverUrl),
                width: "44",
                height: "44",
                fit: "cover",
                radius: "8",
                ...{ style: {} },
            }));
            const __VLS_50 = __VLS_49({
                src: (p.coverUrl),
                width: "44",
                height: "44",
                fit: "cover",
                radius: "8",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        }
    }
    var __VLS_43;
}
var __VLS_39;
var __VLS_31;
const __VLS_52 = {}.VanTabbar;
/** @type {[typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    route: true,
}));
const __VLS_54 = __VLS_53({
    route: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    replace: true,
    to: "/products",
    icon: "shop-o",
}));
const __VLS_58 = __VLS_57({
    replace: true,
    to: "/products",
    icon: "shop-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
var __VLS_59;
const __VLS_60 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    replace: true,
    to: "/orders",
    icon: "orders-o",
}));
const __VLS_62 = __VLS_61({
    replace: true,
    to: "/orders",
    icon: "orders-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
var __VLS_63;
var __VLS_55;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['category-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['model-list']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            products: products,
            loading: loading,
            refreshing: refreshing,
            categories: categories,
            categoryIndex: categoryIndex,
            seriesIndex: seriesIndex,
            selectedModelId: selectedModelId,
            seriesList: seriesList,
            modelList: modelList,
            loadProducts: loadProducts,
            go: go,
            selectModel: selectModel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
