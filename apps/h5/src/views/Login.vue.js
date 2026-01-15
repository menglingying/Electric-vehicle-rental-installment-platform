import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { login, requestLoginCode } from '@/services/api';
import { setH5Token } from '@/services/auth';
const router = useRouter();
const phone = ref('');
const code = ref('');
const countdown = ref(0);
const devFixedCode = ref('');
let timer = null;
function startCountdown(seconds) {
    countdown.value = seconds;
    if (timer)
        clearInterval(timer);
    timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            if (timer)
                clearInterval(timer);
            timer = null;
        }
    }, 1000);
}
onUnmounted(() => {
    if (timer)
        clearInterval(timer);
});
async function onRequestCode() {
    if (!phone.value) {
        showFailToast('请输入手机号');
        return;
    }
    try {
        const res = await requestLoginCode(phone.value);
        // 开发环境返回固定验证码
        if (res.devFixedCode) {
            devFixedCode.value = res.devFixedCode;
            showSuccessToast(`已发送（dev 固定码：${res.devFixedCode}）`);
        }
        else {
            devFixedCode.value = '';
            showSuccessToast('验证码已发送');
        }
        // 开始60秒倒计时
        startCountdown(60);
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '获取验证码失败');
    }
}
async function onSubmit() {
    try {
        const res = await login(phone.value, code.value);
        setH5Token(res.token);
        showSuccessToast('登录成功');
        await router.replace('/products');
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '登录失败');
    }
}
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
    title: "手机号登录",
}));
const __VLS_2 = __VLS_1({
    title: "手机号登录",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card" },
});
const __VLS_4 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onSubmit': {} },
}));
const __VLS_6 = __VLS_5({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onSubmit: (__VLS_ctx.onSubmit)
};
__VLS_7.slots.default;
const __VLS_12 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    modelValue: (__VLS_ctx.phone),
    name: "phone",
    label: "手机号",
    placeholder: "请输入手机号",
}));
const __VLS_14 = __VLS_13({
    modelValue: (__VLS_ctx.phone),
    name: "phone",
    label: "手机号",
    placeholder: "请输入手机号",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.code),
    name: "code",
    label: "验证码",
    placeholder: "请输入验证码",
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.code),
    name: "code",
    label: "验证码",
    placeholder: "请输入验证码",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_20 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
    block: true,
    type: "default",
    disabled: (__VLS_ctx.countdown > 0 || !__VLS_ctx.phone),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
    block: true,
    type: "default",
    disabled: (__VLS_ctx.countdown > 0 || !__VLS_ctx.phone),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (__VLS_ctx.onRequestCode)
};
__VLS_23.slots.default;
(__VLS_ctx.countdown > 0 ? `${__VLS_ctx.countdown}秒后重新获取` : '获取验证码');
var __VLS_23;
const __VLS_28 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    block: true,
    type: "primary",
    nativeType: "submit",
    disabled: (!__VLS_ctx.phone || !__VLS_ctx.code),
}));
const __VLS_30 = __VLS_29({
    block: true,
    type: "primary",
    nativeType: "submit",
    disabled: (!__VLS_ctx.phone || !__VLS_ctx.code),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
var __VLS_31;
if (__VLS_ctx.devFixedCode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint" },
    });
    (__VLS_ctx.devFixedCode);
}
var __VLS_7;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            phone: phone,
            code: code,
            countdown: countdown,
            devFixedCode: devFixedCode,
            onRequestCode: onRequestCode,
            onSubmit: onSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
