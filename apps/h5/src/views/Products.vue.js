import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { listCategoryTree, listProductsByCategory } from '@/services/api';
const router = useRouter();
const products = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const categories = ref([]);
const selectedBrandId = ref('');
const selectedSeriesId = ref('');
const selectedModelId = ref('');
const keyword = ref('');
const brandCategories = computed(() => categories.value);
const seriesCategories = computed(() => {
    const brand = categories.value.find((item) => item.id === selectedBrandId.value);
    return brand?.children || [];
});
const modelCategories = computed(() => {
    const series = seriesCategories.value.find((item) => item.id === selectedSeriesId.value);
    return series?.children || [];
});
const filteredProducts = computed(() => {
    const list = products.value;
    const text = keyword.value.trim();
    if (!text)
        return list;
    return list.filter((p) => p.name.toLowerCase().includes(text.toLowerCase()));
});
function initSelection() {
    if (!brandCategories.value.length)
        return;
    selectedBrandId.value = brandCategories.value[0].id;
    const seriesList = seriesCategories.value;
    if (seriesList.length) {
        selectedSeriesId.value = seriesList[0].id;
        const modelList = modelCategories.value;
        if (modelList.length) {
            selectedModelId.value = modelList[0].id;
        }
    }
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
    if (!selectedModelId.value) {
        products.value = [];
        refreshing.value = false;
        return;
    }
    loading.value = true;
    try {
        products.value = await listProductsByCategory(selectedModelId.value);
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '加载失败');
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function selectBrand(id) {
    selectedBrandId.value = id;
    const seriesList = seriesCategories.value;
    selectedSeriesId.value = seriesList.length ? seriesList[0].id : '';
    const modelList = modelCategories.value;
    selectedModelId.value = modelList.length ? modelList[0].id : '';
}
function selectSeries(id) {
    selectedSeriesId.value = id;
    const modelList = modelCategories.value;
    selectedModelId.value = modelList.length ? modelList[0].id : '';
}
function selectModel(id) {
    selectedModelId.value = id;
}
function go(id) {
    router.push(`/products/${id}`);
}
function displayPrice(product) {
    return product.rentWithoutBattery ?? product.rentPerCycle;
}
function onSearch() {
    // search uses computed
}
watch(selectedModelId, () => {
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
/** @type {__VLS_StyleScopedClasses['option-btn']} */ ;
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
    title: "分类",
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "分类",
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-wrap" },
});
const __VLS_8 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    modelValue: (__VLS_ctx.keyword),
    leftIcon: "search",
    placeholder: "请输入搜索内容",
    clearable: true,
}));
const __VLS_10 = __VLS_9({
    modelValue: (__VLS_ctx.keyword),
    leftIcon: "search",
    placeholder: "请输入搜索内容",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const __VLS_12 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    ...{ class: "search-btn" },
    type: "primary",
    size: "small",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    ...{ class: "search-btn" },
    type: "primary",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.onSearch)
};
__VLS_15.slots.default;
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "category-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "category-left" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.brandCategories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectBrand(item.id);
            } },
        key: (item.id),
        ...{ class: "category-item" },
        ...{ class: ({ active: item.id === __VLS_ctx.selectedBrandId }) },
    });
    (item.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "category-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "category-block" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "block-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "block-options" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.seriesCategories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectSeries(item.id);
            } },
        key: (item.id),
        ...{ class: "option-btn" },
        ...{ class: ({ active: item.id === __VLS_ctx.selectedSeriesId }) },
    });
    (item.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "category-block" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "block-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "block-options" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.modelCategories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectModel(item.id);
            } },
        key: (item.id),
        ...{ class: "option-btn" },
        ...{ class: ({ active: item.id === __VLS_ctx.selectedModelId }) },
    });
    (item.name);
}
const __VLS_20 = {}.VanPullRefresh;
/** @type {[typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onRefresh': {} },
    modelValue: (__VLS_ctx.refreshing),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onRefresh: (__VLS_ctx.loadProducts)
};
__VLS_23.slots.default;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-text" },
    });
    const __VLS_28 = {}.VanLoading;
    /** @type {[typeof __VLS_components.VanLoading, typeof __VLS_components.vanLoading, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        size: "20px",
    }));
    const __VLS_30 = __VLS_29({
        size: "20px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
}
else if (__VLS_ctx.filteredProducts.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-text" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "product-grid" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.filteredProducts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.filteredProducts.length === 0))
                        return;
                    __VLS_ctx.go(p.id);
                } },
            key: (p.id),
            ...{ class: "product-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "product-image" },
        });
        const __VLS_32 = {}.VanImage;
        /** @type {[typeof __VLS_components.VanImage, typeof __VLS_components.vanImage, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            src: (p.coverUrl),
            width: "100%",
            height: "120",
            fit: "cover",
        }));
        const __VLS_34 = __VLS_33({
            src: (p.coverUrl),
            width: "100%",
            height: "120",
            fit: "cover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "product-name" },
        });
        (p.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "product-price" },
        });
        (__VLS_ctx.displayPrice(p));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
}
var __VLS_23;
const __VLS_36 = {}.VanTabbar;
/** @type {[typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, typeof __VLS_components.VanTabbar, typeof __VLS_components.vanTabbar, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    route: true,
}));
const __VLS_38 = __VLS_37({
    route: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    replace: true,
    to: "/products",
    icon: "shop-o",
}));
const __VLS_42 = __VLS_41({
    replace: true,
    to: "/products",
    icon: "shop-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
var __VLS_43;
const __VLS_44 = {}.VanTabbarItem;
/** @type {[typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, typeof __VLS_components.VanTabbarItem, typeof __VLS_components.vanTabbarItem, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    replace: true,
    to: "/orders",
    icon: "orders-o",
}));
const __VLS_46 = __VLS_45({
    replace: true,
    to: "/orders",
    icon: "orders-o",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
var __VLS_47;
var __VLS_39;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['search-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['search-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['category-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['category-left']} */ ;
/** @type {__VLS_StyleScopedClasses['category-item']} */ ;
/** @type {__VLS_StyleScopedClasses['category-right']} */ ;
/** @type {__VLS_StyleScopedClasses['category-block']} */ ;
/** @type {__VLS_StyleScopedClasses['block-title']} */ ;
/** @type {__VLS_StyleScopedClasses['block-options']} */ ;
/** @type {__VLS_StyleScopedClasses['option-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['category-block']} */ ;
/** @type {__VLS_StyleScopedClasses['block-title']} */ ;
/** @type {__VLS_StyleScopedClasses['block-options']} */ ;
/** @type {__VLS_StyleScopedClasses['option-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-text']} */ ;
/** @type {__VLS_StyleScopedClasses['product-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['product-card']} */ ;
/** @type {__VLS_StyleScopedClasses['product-image']} */ ;
/** @type {__VLS_StyleScopedClasses['product-name']} */ ;
/** @type {__VLS_StyleScopedClasses['product-price']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            refreshing: refreshing,
            selectedBrandId: selectedBrandId,
            selectedSeriesId: selectedSeriesId,
            selectedModelId: selectedModelId,
            keyword: keyword,
            brandCategories: brandCategories,
            seriesCategories: seriesCategories,
            modelCategories: modelCategories,
            filteredProducts: filteredProducts,
            loadProducts: loadProducts,
            selectBrand: selectBrand,
            selectSeries: selectSeries,
            selectModel: selectModel,
            go: go,
            displayPrice: displayPrice,
            onSearch: onSearch,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
