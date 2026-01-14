import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, submitKyc, uploadKycImage } from '@/services/api';
const route = useRoute();
const router = useRouter();
const orderId = computed(() => String(route.params.id));
const step = ref(0);
const submitting = ref(false);
const idCardFrontList = ref([]);
const idCardBackList = ref([]);
const facePhotoList = ref([]);
const form = reactive({
    idCardFront: '',
    idCardBack: '',
    facePhoto: '',
    realName: '',
    idCardNumber: '',
    occupation: '',
    company: '',
    workCity: '',
    residenceAddress: '',
    residenceDuration: '',
    contactName: '',
    contactPhone: '',
    contactRelation: ''
});
const canNext = computed(() => {
    if (step.value === 0) {
        return form.idCardFront && form.idCardBack;
    }
    if (step.value === 1) {
        return form.facePhoto;
    }
    return true;
});
async function uploadImage(file, field) {
    try {
        const res = await uploadKycImage(file.file);
        form[field] = res.url;
        showSuccessToast('上传成功');
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '上传失败');
    }
}
function nextStep() {
    if (canNext.value && step.value < 2) {
        step.value++;
    }
}
async function submit() {
    if (!form.realName)
        return showFailToast('请输入真实姓名');
    if (!form.idCardNumber)
        return showFailToast('请输入身份证号');
    if (!form.contactName || !form.contactPhone)
        return showFailToast('请填写紧急联系人信息');
    submitting.value = true;
    try {
        await submitKyc(orderId.value, form);
        showSuccessToast('资料提交成功');
        await router.replace(`/orders/${orderId.value}`);
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '提交失败');
    }
    finally {
        submitting.value = false;
    }
}
function skipKyc() {
    router.replace(`/orders/${orderId.value}`);
}
onMounted(async () => {
    try {
        const order = await getOrder(orderId.value);
        if (order.kycCompleted) {
            router.replace(`/orders/${orderId.value}`);
        }
    }
    catch (e) {
        showFailToast('订单不存在');
        router.replace('/orders');
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['bottom-bar']} */ ;
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
    title: "补充资料",
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "补充资料",
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
const __VLS_8 = {}.VanSteps;
/** @type {[typeof __VLS_components.VanSteps, typeof __VLS_components.vanSteps, typeof __VLS_components.VanSteps, typeof __VLS_components.vanSteps, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    active: (__VLS_ctx.step),
    ...{ style: {} },
}));
const __VLS_10 = __VLS_9({
    active: (__VLS_ctx.step),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.VanStep;
/** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
const __VLS_16 = {}.VanStep;
/** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
const __VLS_20 = {}.VanStep;
/** @type {[typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, typeof __VLS_components.VanStep, typeof __VLS_components.vanStep, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({}));
const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
var __VLS_11;
if (__VLS_ctx.step === 0) {
    const __VLS_24 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_26 = __VLS_25({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    const __VLS_28 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        title: "身份证正面（人像面）",
    }));
    const __VLS_30 = __VLS_29({
        title: "身份证正面（人像面）",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-area" },
    });
    const __VLS_32 = {}.VanUploader;
    /** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        modelValue: (__VLS_ctx.idCardFrontList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardFront')),
    }));
    const __VLS_34 = __VLS_33({
        modelValue: (__VLS_ctx.idCardFrontList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardFront')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-hint" },
    });
    const __VLS_36 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        title: "身份证反面（国徽面）",
        ...{ style: {} },
    }));
    const __VLS_38 = __VLS_37({
        title: "身份证反面（国徽面）",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-area" },
    });
    const __VLS_40 = {}.VanUploader;
    /** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.idCardBackList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardBack')),
    }));
    const __VLS_42 = __VLS_41({
        modelValue: (__VLS_ctx.idCardBackList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardBack')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-hint" },
    });
    var __VLS_27;
}
if (__VLS_ctx.step === 1) {
    const __VLS_44 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_46 = __VLS_45({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    const __VLS_48 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        title: "人脸自拍照",
    }));
    const __VLS_50 = __VLS_49({
        title: "人脸自拍照",
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-area" },
    });
    const __VLS_52 = {}.VanUploader;
    /** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        modelValue: (__VLS_ctx.facePhotoList),
        maxCount: (1),
        capture: "user",
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'facePhoto')),
    }));
    const __VLS_54 = __VLS_53({
        modelValue: (__VLS_ctx.facePhotoList),
        maxCount: (1),
        capture: "user",
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'facePhoto')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-hint" },
    });
    var __VLS_47;
}
if (__VLS_ctx.step === 2) {
    const __VLS_56 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_58 = __VLS_57({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
    const __VLS_60 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        modelValue: (__VLS_ctx.form.realName),
        label: "真实姓名",
        placeholder: "请输入身份证上的姓名",
    }));
    const __VLS_62 = __VLS_61({
        modelValue: (__VLS_ctx.form.realName),
        label: "真实姓名",
        placeholder: "请输入身份证上的姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    const __VLS_64 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        modelValue: (__VLS_ctx.form.idCardNumber),
        label: "身份证号",
        placeholder: "请输入18位身份证号",
    }));
    const __VLS_66 = __VLS_65({
        modelValue: (__VLS_ctx.form.idCardNumber),
        label: "身份证号",
        placeholder: "请输入18位身份证号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    var __VLS_59;
}
if (__VLS_ctx.step === 2) {
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
        title: "工作信息",
    }));
    const __VLS_74 = __VLS_73({
        title: "工作信息",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    const __VLS_76 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        modelValue: (__VLS_ctx.form.occupation),
        label: "职业",
        placeholder: "请输入您的职业",
    }));
    const __VLS_78 = __VLS_77({
        modelValue: (__VLS_ctx.form.occupation),
        label: "职业",
        placeholder: "请输入您的职业",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    const __VLS_80 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        modelValue: (__VLS_ctx.form.company),
        label: "工作单位",
        placeholder: "请输入工作单位名称",
    }));
    const __VLS_82 = __VLS_81({
        modelValue: (__VLS_ctx.form.company),
        label: "工作单位",
        placeholder: "请输入工作单位名称",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    const __VLS_84 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        modelValue: (__VLS_ctx.form.workCity),
        label: "工作城市",
        placeholder: "请输入工作所在城市",
    }));
    const __VLS_86 = __VLS_85({
        modelValue: (__VLS_ctx.form.workCity),
        label: "工作城市",
        placeholder: "请输入工作所在城市",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    var __VLS_71;
}
if (__VLS_ctx.step === 2) {
    const __VLS_88 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_90 = __VLS_89({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    __VLS_91.slots.default;
    const __VLS_92 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        title: "居住信息",
    }));
    const __VLS_94 = __VLS_93({
        title: "居住信息",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const __VLS_96 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        modelValue: (__VLS_ctx.form.residenceAddress),
        label: "现居地址",
        placeholder: "请输入详细居住地址",
        type: "textarea",
        rows: "2",
    }));
    const __VLS_98 = __VLS_97({
        modelValue: (__VLS_ctx.form.residenceAddress),
        label: "现居地址",
        placeholder: "请输入详细居住地址",
        type: "textarea",
        rows: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    const __VLS_100 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        modelValue: (__VLS_ctx.form.residenceDuration),
        label: "居住时长",
        placeholder: "例如：2年",
    }));
    const __VLS_102 = __VLS_101({
        modelValue: (__VLS_ctx.form.residenceDuration),
        label: "居住时长",
        placeholder: "例如：2年",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    var __VLS_91;
}
if (__VLS_ctx.step === 2) {
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
        title: "紧急联系人",
    }));
    const __VLS_110 = __VLS_109({
        title: "紧急联系人",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    const __VLS_112 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        modelValue: (__VLS_ctx.form.contactName),
        label: "联系人姓名",
        placeholder: "请输入联系人姓名",
    }));
    const __VLS_114 = __VLS_113({
        modelValue: (__VLS_ctx.form.contactName),
        label: "联系人姓名",
        placeholder: "请输入联系人姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    const __VLS_116 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        modelValue: (__VLS_ctx.form.contactPhone),
        label: "联系人电话",
        placeholder: "请输入联系人手机号",
        type: "tel",
    }));
    const __VLS_118 = __VLS_117({
        modelValue: (__VLS_ctx.form.contactPhone),
        label: "联系人电话",
        placeholder: "请输入联系人手机号",
        type: "tel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    const __VLS_120 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        modelValue: (__VLS_ctx.form.contactRelation),
        label: "与您的关系",
        placeholder: "例如：父母、配偶、朋友",
    }));
    const __VLS_122 = __VLS_121({
        modelValue: (__VLS_ctx.form.contactRelation),
        label: "与您的关系",
        placeholder: "例如：父母、配偶、朋友",
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    var __VLS_107;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bottom-bar" },
});
if (__VLS_ctx.step > 0) {
    const __VLS_124 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        ...{ 'onClick': {} },
        ...{ style: {} },
    }));
    const __VLS_126 = __VLS_125({
        ...{ 'onClick': {} },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    let __VLS_128;
    let __VLS_129;
    let __VLS_130;
    const __VLS_131 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step > 0))
                return;
            __VLS_ctx.step--;
        }
    };
    __VLS_127.slots.default;
    var __VLS_127;
}
if (__VLS_ctx.step < 2) {
    const __VLS_132 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        ...{ 'onClick': {} },
        type: "primary",
        disabled: (!__VLS_ctx.canNext),
    }));
    const __VLS_134 = __VLS_133({
        ...{ 'onClick': {} },
        type: "primary",
        disabled: (!__VLS_ctx.canNext),
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    let __VLS_136;
    let __VLS_137;
    let __VLS_138;
    const __VLS_139 = {
        onClick: (__VLS_ctx.nextStep)
    };
    __VLS_135.slots.default;
    var __VLS_135;
}
if (__VLS_ctx.step === 2) {
    const __VLS_140 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_142 = __VLS_141({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    let __VLS_144;
    let __VLS_145;
    let __VLS_146;
    const __VLS_147 = {
        onClick: (__VLS_ctx.submit)
    };
    __VLS_143.slots.default;
    var __VLS_143;
}
const __VLS_148 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    inset: true,
    ...{ style: {} },
}));
const __VLS_150 = __VLS_149({
    inset: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
__VLS_151.slots.default;
const __VLS_152 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({}));
const __VLS_154 = __VLS_153({}, ...__VLS_functionalComponentArgsRest(__VLS_153));
__VLS_155.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_155.slots;
    const __VLS_156 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        ...{ 'onClick': {} },
        size: "small",
        plain: true,
    }));
    const __VLS_158 = __VLS_157({
        ...{ 'onClick': {} },
        size: "small",
        plain: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    let __VLS_160;
    let __VLS_161;
    let __VLS_162;
    const __VLS_163 = {
        onClick: (__VLS_ctx.skipKyc)
    };
    __VLS_159.slots.default;
    var __VLS_159;
}
var __VLS_155;
var __VLS_151;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-bar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            step: step,
            submitting: submitting,
            idCardFrontList: idCardFrontList,
            idCardBackList: idCardBackList,
            facePhotoList: facePhotoList,
            form: form,
            canNext: canNext,
            uploadImage: uploadImage,
            nextStep: nextStep,
            submit: submit,
            skipKyc: skipKyc,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
