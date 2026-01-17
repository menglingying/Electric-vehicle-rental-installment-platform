import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, listDictItems, listRegions, submitKyc, uploadKycImage } from '@/services/api';
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
    contactName: '',
    contactPhone: '',
    contactRelation: '',
    employmentStatus: '',
    employmentName: '',
    incomeRangeCode: '',
    homeProvinceCode: '',
    homeCityCode: '',
    homeDistrictCode: '',
    homeAddressDetail: ''
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
        // 获取实际的File对象
        const fileObj = file.file;
        if (!fileObj) {
            showFailToast('获取文件失败，请重试');
            return;
        }
        // 验证文件大小（至少1KB，最大10MB）
        if (fileObj.size < 1024) {
            showFailToast('图片文件太小，请重新拍摄');
            return;
        }
        if (fileObj.size > 10 * 1024 * 1024) {
            showFailToast('图片文件过大，请压缩后重试');
            return;
        }
        // 验证文件类型
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(fileObj.type)) {
            showFailToast('仅支持JPG/PNG格式图片');
            return;
        }
        const res = await uploadKycImage(fileObj);
        form[field] = res.url;
        showSuccessToast('上传成功');
    }
    catch (e) {
        console.error('上传失败:', e);
        showFailToast(e?.response?.data?.message ?? '上传失败，请重试');
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
    if (!form.contactName || !form.contactPhone || !form.contactRelation)
        return showFailToast('请填写紧急联系人信息');
    if (!form.employmentStatus)
        return showFailToast('请选择就业状态');
    if (!form.employmentName)
        return showFailToast('\u8bf7\u586b\u5199\u5355\u4f4d/\u804c\u4e1a');
    if (!form.incomeRangeCode)
        return showFailToast('请选择月收入区间');
    if (!form.homeProvinceCode || !form.homeCityCode || !form.homeDistrictCode)
        return showFailToast('请选择完整的住家地址');
    if (!form.homeAddressDetail)
        return showFailToast('请输入详细地址');
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
onMounted(async () => {
    await loadDicts();
    await loadProvinces();
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
const employmentActions = ref([]);
const incomeActions = ref([]);
const contactRelationActions = ref([]);
const provinceActions = ref([]);
const cityActions = ref([]);
const districtActions = ref([]);
const showEmploymentSheet = ref(false);
const showIncomeSheet = ref(false);
const showContactRelationSheet = ref(false);
const showProvinceSheet = ref(false);
const showCitySheet = ref(false);
const showDistrictSheet = ref(false);
const employmentStatusLabel = ref('');
const incomeRangeLabel = ref('');
const contactRelationLabel = ref('');
const provinceLabel = ref('');
const cityLabel = ref('');
const districtLabel = ref('');
async function loadDicts() {
    try {
        const employment = await listDictItems('employment_status');
        employmentActions.value = employment.map((item) => ({ name: item.label, code: item.code }));
        const income = await listDictItems('income_range');
        incomeActions.value = income.map((item) => ({ name: item.label, code: item.code }));
        const relations = await listDictItems('contact_relation');
        contactRelationActions.value = relations.map((item) => ({ name: item.label, code: item.code }));
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '字典加载失败');
    }
}
async function loadProvinces() {
    try {
        const provinces = await listRegions();
        provinceActions.value = provinces.map((item) => ({ name: item.name, code: item.code }));
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '省份加载失败');
    }
}
async function loadCities(parentCode) {
    try {
        const cities = await listRegions(parentCode);
        cityActions.value = cities.map((item) => ({ name: item.name, code: item.code }));
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '城市加载失败');
    }
}
async function loadDistricts(parentCode) {
    try {
        const districts = await listRegions(parentCode);
        districtActions.value = districts.map((item) => ({ name: item.name, code: item.code }));
    }
    catch (e) {
        showFailToast(e?.response?.data?.message ?? '区县加载失败');
    }
}
function onSelectEmployment(action) {
    form.employmentStatus = action.code;
    employmentStatusLabel.value = action.name;
    showEmploymentSheet.value = false;
}
function onSelectIncome(action) {
    form.incomeRangeCode = action.code;
    incomeRangeLabel.value = action.name;
    showIncomeSheet.value = false;
}
function onSelectContactRelation(action) {
    form.contactRelation = action.code;
    contactRelationLabel.value = action.name;
    showContactRelationSheet.value = false;
}
async function onSelectProvince(action) {
    form.homeProvinceCode = action.code;
    provinceLabel.value = action.name;
    form.homeCityCode = '';
    cityLabel.value = '';
    form.homeDistrictCode = '';
    districtLabel.value = '';
    showProvinceSheet.value = false;
    await loadCities(action.code);
}
async function onSelectCity(action) {
    form.homeCityCode = action.code;
    cityLabel.value = action.name;
    form.homeDistrictCode = '';
    districtLabel.value = '';
    showCitySheet.value = false;
    await loadDistricts(action.code);
}
function onSelectDistrict(action) {
    form.homeDistrictCode = action.code;
    districtLabel.value = action.name;
    showDistrictSheet.value = false;
}
function openCitySheet() {
    if (!form.homeProvinceCode)
        return showFailToast('请先选择省份');
    showCitySheet.value = true;
}
function openDistrictSheet() {
    if (!form.homeCityCode)
        return showFailToast('请先选择城市');
    showDistrictSheet.value = true;
}
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
        accept: "image/*",
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'facePhoto')),
    }));
    const __VLS_54 = __VLS_53({
        modelValue: (__VLS_ctx.facePhotoList),
        maxCount: (1),
        accept: "image/*",
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
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.employmentStatusLabel),
        label: "就业状态",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.employmentStatusLabel),
        label: "就业状态",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showEmploymentSheet = true;
        }
    };
    var __VLS_79;
    const __VLS_84 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        modelValue: (__VLS_ctx.form.employmentName),
        label: "单位/职业",
        placeholder: "请输入单位或职业名称",
    }));
    const __VLS_86 = __VLS_85({
        modelValue: (__VLS_ctx.form.employmentName),
        label: "单位/职业",
        placeholder: "请输入单位或职业名称",
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
        title: "收入信息",
    }));
    const __VLS_94 = __VLS_93({
        title: "收入信息",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const __VLS_96 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.incomeRangeLabel),
        label: "月收入区间",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_98 = __VLS_97({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.incomeRangeLabel),
        label: "月收入区间",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    let __VLS_100;
    let __VLS_101;
    let __VLS_102;
    const __VLS_103 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showIncomeSheet = true;
        }
    };
    var __VLS_99;
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
        title: "住家地址",
    }));
    const __VLS_110 = __VLS_109({
        title: "住家地址",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    const __VLS_112 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.provinceLabel),
        label: "省份",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_114 = __VLS_113({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.provinceLabel),
        label: "省份",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    let __VLS_116;
    let __VLS_117;
    let __VLS_118;
    const __VLS_119 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showProvinceSheet = true;
        }
    };
    var __VLS_115;
    const __VLS_120 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.cityLabel),
        label: "城市",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_122 = __VLS_121({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.cityLabel),
        label: "城市",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    let __VLS_124;
    let __VLS_125;
    let __VLS_126;
    const __VLS_127 = {
        onClick: (__VLS_ctx.openCitySheet)
    };
    var __VLS_123;
    const __VLS_128 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.districtLabel),
        label: "区县",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_130 = __VLS_129({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.districtLabel),
        label: "区县",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    let __VLS_132;
    let __VLS_133;
    let __VLS_134;
    const __VLS_135 = {
        onClick: (__VLS_ctx.openDistrictSheet)
    };
    var __VLS_131;
    const __VLS_136 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
        modelValue: (__VLS_ctx.form.homeAddressDetail),
        label: "详细地址",
        placeholder: "请输入详细地址",
        type: "textarea",
        rows: "2",
    }));
    const __VLS_138 = __VLS_137({
        modelValue: (__VLS_ctx.form.homeAddressDetail),
        label: "详细地址",
        placeholder: "请输入详细地址",
        type: "textarea",
        rows: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    var __VLS_107;
}
if (__VLS_ctx.step === 2) {
    const __VLS_140 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        inset: true,
        ...{ style: {} },
    }));
    const __VLS_142 = __VLS_141({
        inset: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    __VLS_143.slots.default;
    const __VLS_144 = {}.VanCell;
    /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        title: "紧急联系人",
    }));
    const __VLS_146 = __VLS_145({
        title: "紧急联系人",
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
    const __VLS_148 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        modelValue: (__VLS_ctx.form.contactName),
        label: "联系人姓名",
        placeholder: "请输入联系人姓名",
    }));
    const __VLS_150 = __VLS_149({
        modelValue: (__VLS_ctx.form.contactName),
        label: "联系人姓名",
        placeholder: "请输入联系人姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    const __VLS_152 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        modelValue: (__VLS_ctx.form.contactPhone),
        label: "联系人电话",
        placeholder: "请输入联系人手机号",
        type: "tel",
    }));
    const __VLS_154 = __VLS_153({
        modelValue: (__VLS_ctx.form.contactPhone),
        label: "联系人电话",
        placeholder: "请输入联系人手机号",
        type: "tel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    const __VLS_156 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabel),
        label: "与您的关系",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_158 = __VLS_157({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabel),
        label: "与您的关系",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    let __VLS_160;
    let __VLS_161;
    let __VLS_162;
    const __VLS_163 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showContactRelationSheet = true;
        }
    };
    var __VLS_159;
    var __VLS_143;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bottom-bar" },
});
if (__VLS_ctx.step > 0) {
    const __VLS_164 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        ...{ 'onClick': {} },
        ...{ style: {} },
    }));
    const __VLS_166 = __VLS_165({
        ...{ 'onClick': {} },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    let __VLS_168;
    let __VLS_169;
    let __VLS_170;
    const __VLS_171 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step > 0))
                return;
            __VLS_ctx.step--;
        }
    };
    __VLS_167.slots.default;
    var __VLS_167;
}
if (__VLS_ctx.step < 2) {
    const __VLS_172 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
        ...{ 'onClick': {} },
        type: "primary",
        disabled: (!__VLS_ctx.canNext),
    }));
    const __VLS_174 = __VLS_173({
        ...{ 'onClick': {} },
        type: "primary",
        disabled: (!__VLS_ctx.canNext),
    }, ...__VLS_functionalComponentArgsRest(__VLS_173));
    let __VLS_176;
    let __VLS_177;
    let __VLS_178;
    const __VLS_179 = {
        onClick: (__VLS_ctx.nextStep)
    };
    __VLS_175.slots.default;
    var __VLS_175;
}
if (__VLS_ctx.step === 2) {
    const __VLS_180 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_182 = __VLS_181({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    let __VLS_184;
    let __VLS_185;
    let __VLS_186;
    const __VLS_187 = {
        onClick: (__VLS_ctx.submit)
    };
    __VLS_183.slots.default;
    var __VLS_183;
}
const __VLS_188 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showEmploymentSheet),
    actions: (__VLS_ctx.employmentActions),
}));
const __VLS_190 = __VLS_189({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showEmploymentSheet),
    actions: (__VLS_ctx.employmentActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
let __VLS_192;
let __VLS_193;
let __VLS_194;
const __VLS_195 = {
    onSelect: (__VLS_ctx.onSelectEmployment)
};
var __VLS_191;
const __VLS_196 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showIncomeSheet),
    actions: (__VLS_ctx.incomeActions),
}));
const __VLS_198 = __VLS_197({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showIncomeSheet),
    actions: (__VLS_ctx.incomeActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
let __VLS_200;
let __VLS_201;
let __VLS_202;
const __VLS_203 = {
    onSelect: (__VLS_ctx.onSelectIncome)
};
var __VLS_199;
const __VLS_204 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showContactRelationSheet),
    actions: (__VLS_ctx.contactRelationActions),
}));
const __VLS_206 = __VLS_205({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showContactRelationSheet),
    actions: (__VLS_ctx.contactRelationActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
let __VLS_208;
let __VLS_209;
let __VLS_210;
const __VLS_211 = {
    onSelect: (__VLS_ctx.onSelectContactRelation)
};
var __VLS_207;
const __VLS_212 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showProvinceSheet),
    actions: (__VLS_ctx.provinceActions),
}));
const __VLS_214 = __VLS_213({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showProvinceSheet),
    actions: (__VLS_ctx.provinceActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
let __VLS_216;
let __VLS_217;
let __VLS_218;
const __VLS_219 = {
    onSelect: (__VLS_ctx.onSelectProvince)
};
var __VLS_215;
const __VLS_220 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showCitySheet),
    actions: (__VLS_ctx.cityActions),
}));
const __VLS_222 = __VLS_221({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showCitySheet),
    actions: (__VLS_ctx.cityActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_221));
let __VLS_224;
let __VLS_225;
let __VLS_226;
const __VLS_227 = {
    onSelect: (__VLS_ctx.onSelectCity)
};
var __VLS_223;
const __VLS_228 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showDistrictSheet),
    actions: (__VLS_ctx.districtActions),
}));
const __VLS_230 = __VLS_229({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showDistrictSheet),
    actions: (__VLS_ctx.districtActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_229));
let __VLS_232;
let __VLS_233;
let __VLS_234;
const __VLS_235 = {
    onSelect: (__VLS_ctx.onSelectDistrict)
};
var __VLS_231;
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
            employmentActions: employmentActions,
            incomeActions: incomeActions,
            contactRelationActions: contactRelationActions,
            provinceActions: provinceActions,
            cityActions: cityActions,
            districtActions: districtActions,
            showEmploymentSheet: showEmploymentSheet,
            showIncomeSheet: showIncomeSheet,
            showContactRelationSheet: showContactRelationSheet,
            showProvinceSheet: showProvinceSheet,
            showCitySheet: showCitySheet,
            showDistrictSheet: showDistrictSheet,
            employmentStatusLabel: employmentStatusLabel,
            incomeRangeLabel: incomeRangeLabel,
            contactRelationLabel: contactRelationLabel,
            provinceLabel: provinceLabel,
            cityLabel: cityLabel,
            districtLabel: districtLabel,
            onSelectEmployment: onSelectEmployment,
            onSelectIncome: onSelectIncome,
            onSelectContactRelation: onSelectContactRelation,
            onSelectProvince: onSelectProvince,
            onSelectCity: onSelectCity,
            onSelectDistrict: onSelectDistrict,
            openCitySheet: openCitySheet,
            openDistrictSheet: openDistrictSheet,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
