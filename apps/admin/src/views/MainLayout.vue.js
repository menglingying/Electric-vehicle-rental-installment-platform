import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconHome, IconApps, IconArchive, IconList, IconCheckCircle, IconNotification, IconExclamationCircle, IconStop } from '@arco-design/web-vue/es/icon';
import { clearAdminToken } from '@/services/auth';
const route = useRoute();
const router = useRouter();
const activeKey = computed(() => route.path);
const menuItems = [
    { key: '/dashboard', label: '首页概览', icon: IconHome },
    { key: '/categories', label: '分类管理', icon: IconApps },
    { key: '/products', label: '商品管理', icon: IconArchive },
    { key: '/orders', label: '订单管理', icon: IconList },
    { key: '/contracts', label: '合同管理', icon: IconArchive },
    { key: '/repayments', label: '还款管理', icon: IconCheckCircle },
    { key: '/reminders', label: '提醒与短信', icon: IconNotification },
    { key: '/overdue', label: '逾期分层', icon: IconExclamationCircle },
    { key: '/blacklist', label: '黑名单', icon: IconStop }
];
const currentTitle = computed(() => {
    const item = menuItems.find((entry) => entry.key === route.path);
    return item?.label ?? '平台管理';
});
function onMenuClick(key) {
    router.push(key);
}
function logout() {
    clearAdminToken();
    router.replace('/login');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ALayout;
/** @type {[typeof __VLS_components.ALayout, typeof __VLS_components.aLayout, typeof __VLS_components.ALayout, typeof __VLS_components.aLayout, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "admin-layout" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "admin-layout" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.ALayoutSider;
/** @type {[typeof __VLS_components.ALayoutSider, typeof __VLS_components.aLayoutSider, typeof __VLS_components.ALayoutSider, typeof __VLS_components.aLayoutSider, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ class: "admin-sider" },
    width: (180),
}));
const __VLS_7 = __VLS_6({
    ...{ class: "admin-sider" },
    width: (180),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-badge" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-subtitle" },
});
const __VLS_9 = {}.AMenu;
/** @type {[typeof __VLS_components.AMenu, typeof __VLS_components.aMenu, typeof __VLS_components.AMenu, typeof __VLS_components.aMenu, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onMenuItemClick': {} },
    ...{ class: "admin-menu" },
    selectedKeys: ([__VLS_ctx.activeKey]),
}));
const __VLS_11 = __VLS_10({
    ...{ 'onMenuItemClick': {} },
    ...{ class: "admin-menu" },
    selectedKeys: ([__VLS_ctx.activeKey]),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onMenuItemClick: (__VLS_ctx.onMenuClick)
};
__VLS_12.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.menuItems))) {
    const __VLS_17 = {}.AMenuItem;
    /** @type {[typeof __VLS_components.AMenuItem, typeof __VLS_components.aMenuItem, typeof __VLS_components.AMenuItem, typeof __VLS_components.aMenuItem, ]} */ ;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
        key: (item.key),
    }));
    const __VLS_19 = __VLS_18({
        key: (item.key),
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    __VLS_20.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_20.slots;
        const __VLS_21 = ((item.icon));
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
        const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
    }
    (item.label);
    var __VLS_20;
}
var __VLS_12;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sider-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "status-dot" },
});
var __VLS_8;
const __VLS_25 = {}.ALayout;
/** @type {[typeof __VLS_components.ALayout, typeof __VLS_components.aLayout, typeof __VLS_components.ALayout, typeof __VLS_components.aLayout, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({}));
const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
const __VLS_29 = {}.ALayoutHeader;
/** @type {[typeof __VLS_components.ALayoutHeader, typeof __VLS_components.aLayoutHeader, typeof __VLS_components.ALayoutHeader, typeof __VLS_components.aLayoutHeader, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    ...{ class: "admin-header" },
}));
const __VLS_31 = __VLS_30({
    ...{ class: "admin-header" },
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-title" },
});
(__VLS_ctx.currentTitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-right" },
});
const __VLS_33 = {}.AAvatar;
/** @type {[typeof __VLS_components.AAvatar, typeof __VLS_components.aAvatar, typeof __VLS_components.AAvatar, typeof __VLS_components.aAvatar, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    size: "24",
    ...{ style: {} },
}));
const __VLS_35 = __VLS_34({
    size: "24",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
var __VLS_36;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
const __VLS_37 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    ...{ 'onClick': {} },
    type: "text",
}));
const __VLS_39 = __VLS_38({
    ...{ 'onClick': {} },
    type: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
let __VLS_41;
let __VLS_42;
let __VLS_43;
const __VLS_44 = {
    onClick: (__VLS_ctx.logout)
};
__VLS_40.slots.default;
var __VLS_40;
var __VLS_32;
const __VLS_45 = {}.ALayoutContent;
/** @type {[typeof __VLS_components.ALayoutContent, typeof __VLS_components.aLayoutContent, typeof __VLS_components.ALayoutContent, typeof __VLS_components.aLayoutContent, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    ...{ class: "admin-content" },
}));
const __VLS_47 = __VLS_46({
    ...{ class: "admin-content" },
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content-inner" },
});
const __VLS_49 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({}));
const __VLS_51 = __VLS_50({}, ...__VLS_functionalComponentArgsRest(__VLS_50));
var __VLS_48;
var __VLS_28;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['admin-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-sider']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-title']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['sider-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['header-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-content']} */ ;
/** @type {__VLS_StyleScopedClasses['content-inner']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            activeKey: activeKey,
            menuItems: menuItems,
            currentTitle: currentTitle,
            onMenuClick: onMenuClick,
            logout: logout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
