import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
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
    contactName2: '',
    contactPhone2: '',
    contactRelation2: '',
    contactName3: '',
    contactPhone3: '',
    contactRelation3: '',
    employmentStatus: '',
    employmentName: '',
    incomeRangeCode: '',
    homeProvinceCode: '',
    homeCityCode: '',
    homeDistrictCode: '',
    homeAddressDetail: ''
});
const maxUploadBytes = 5 * 1024 * 1024;
const maxImageSide = 1600;
const validTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const defaultContactRelations = [
    { name: '父母', code: 'parent' },
    { name: '配偶', code: 'spouse' },
    { name: '子女', code: 'child' },
    { name: '同事', code: 'colleague' },
    { name: '朋友', code: 'friend' },
    { name: '其他', code: 'other' }
];
const draftKey = computed(() => `h5_kyc_draft_${orderId.value}`);
const draftReady = ref(false);
function buildFileName(file, ext) {
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'photo';
    return `${baseName}.${ext}`;
}
function buildUploaderList(url) {
    return url ? [{ url }] : [];
}
function syncUploaderLists() {
    idCardFrontList.value = buildUploaderList(form.idCardFront);
    idCardBackList.value = buildUploaderList(form.idCardBack);
    facePhotoList.value = buildUploaderList(form.facePhoto);
}
function loadDraft() {
    if (!draftKey.value)
        return null;
    try {
        const raw = localStorage.getItem(draftKey.value);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch (err) {
        console.warn('读取草稿失败:', err);
        return null;
    }
}
function saveDraft() {
    if (!draftReady.value || !draftKey.value)
        return;
    const payload = {
        step: step.value,
        form: { ...form },
        labels: {
            employmentStatusLabel: employmentStatusLabel.value,
            incomeRangeLabel: incomeRangeLabel.value,
            contactRelationLabels: contactRelationLabels.value,
            provinceLabel: provinceLabel.value,
            cityLabel: cityLabel.value,
            districtLabel: districtLabel.value
        },
        updatedAt: new Date().toISOString()
    };
    try {
        localStorage.setItem(draftKey.value, JSON.stringify(payload));
    }
    catch (err) {
        console.warn('保存草稿失败:', err);
    }
}
function clearDraft() {
    if (!draftKey.value)
        return;
    try {
        localStorage.removeItem(draftKey.value);
    }
    catch (err) {
        console.warn('清理草稿失败:', err);
    }
}
function applyDraft(draft) {
    if (draft.form) {
        Object.assign(form, draft.form);
    }
    if (draft.labels) {
        employmentStatusLabel.value = draft.labels.employmentStatusLabel ?? employmentStatusLabel.value;
        incomeRangeLabel.value = draft.labels.incomeRangeLabel ?? incomeRangeLabel.value;
        if (Array.isArray(draft.labels.contactRelationLabels)) {
            contactRelationLabels.value = [...draft.labels.contactRelationLabels];
        }
        provinceLabel.value = draft.labels.provinceLabel ?? provinceLabel.value;
        cityLabel.value = draft.labels.cityLabel ?? cityLabel.value;
        districtLabel.value = draft.labels.districtLabel ?? districtLabel.value;
    }
    if (typeof draft.step === 'number') {
        step.value = Math.min(Math.max(draft.step, 0), 2);
    }
}
function getContactNameByIndex(index) {
    if (index === 0)
        return form.contactName;
    if (index === 1)
        return form.contactName2;
    return form.contactName3;
}
function getContactPhoneByIndex(index) {
    if (index === 0)
        return form.contactPhone;
    if (index === 1)
        return form.contactPhone2;
    return form.contactPhone3;
}
function getContactRelationByIndex(index) {
    if (index === 0)
        return form.contactRelation;
    if (index === 1)
        return form.contactRelation2;
    return form.contactRelation3;
}
function setContactRelationByIndex(index, value) {
    if (index === 0)
        form.contactRelation = value;
    else if (index === 1)
        form.contactRelation2 = value;
    else
        form.contactRelation3 = value;
}
function resolveRelationLabel(code) {
    if (!code)
        return '';
    return contactRelationActions.value.find((item) => item.code === code)?.name ?? code;
}
function resolveRelationCode(label) {
    if (!label)
        return '';
    return contactRelationActions.value.find((item) => item.name === label)?.code ?? label;
}
function openContactRelationSheet(index) {
    activeContactIndex.value = index;
    showContactRelationSheet.value = true;
}
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('image_load_failed'));
        };
        img.src = url;
    });
}
function canvasToBlob(canvas, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
}
async function normalizeImage(file) {
    const isImage = file.type ? file.type.startsWith('image/') : true;
    if (isImage && file.size <= maxUploadBytes && validTypes.has(file.type)) {
        return file;
    }
    const img = await loadImage(file);
    const scale = Math.min(1, maxImageSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('canvas_not_supported');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const qualities = file.size > maxUploadBytes ? [0.86, 0.78, 0.7] : [0.9];
    for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, quality);
        if (!blob)
            continue;
        if (blob.size <= maxUploadBytes || qualities.length === 1) {
            return new File([blob], buildFileName(file, 'jpg'), { type: blob.type });
        }
    }
    const fallback = await canvasToBlob(canvas, 0.6);
    if (!fallback)
        return file;
    return new File([fallback], buildFileName(file, 'jpg'), { type: fallback.type });
}
async function uploadImage(file, field) {
    let current = null;
    try {
        current = Array.isArray(file) ? file[0] : file;
        const fileObj = current instanceof File ? current : current?.file;
        if (!fileObj) {
            showFailToast('获取文件失败，请重试');
            return;
        }
        if (current && typeof current === 'object') {
            current.status = 'uploading';
            current.message = '上传中...';
        }
        let normalized = fileObj;
        try {
            normalized = await normalizeImage(fileObj);
        }
        catch (err) {
            console.warn('图片处理失败:', err);
            if (current && typeof current === 'object') {
                current.status = 'failed';
                current.message = '图片处理失败';
            }
            showFailToast('图片处理失败，请更换格式或重新拍摄');
            return;
        }
        if (normalized.size < 1024) {
            if (current && typeof current === 'object') {
                current.status = 'failed';
                current.message = '图片文件太小';
            }
            showFailToast('图片文件太小，请重新拍摄');
            return;
        }
        if (normalized.size > maxUploadBytes) {
            if (current && typeof current === 'object') {
                current.status = 'failed';
                current.message = '图片过大';
            }
            showFailToast('图片文件过大，最大支持5MB');
            return;
        }
        if (normalized.type && !validTypes.has(normalized.type)) {
            if (current && typeof current === 'object') {
                current.status = 'failed';
                current.message = '格式不支持';
            }
            showFailToast('仅支持JPG/PNG/WEBP/HEIC/HEIF格式图片');
            return;
        }
        const res = await uploadKycImage(normalized);
        form[field] = res.url;
        if (current && typeof current === 'object') {
            current.status = 'done';
            current.message = '上传成功';
        }
        showSuccessToast('上传成功');
    }
    catch (e) {
        console.error('上传失败:', e);
        if (current && typeof current === 'object') {
            current.status = 'failed';
            current.message = '上传失败';
        }
        showFailToast(e?.response?.data?.message ?? '上传失败，请重试');
    }
}
function nextStep() {
    if (step.value === 0) {
        if (!form.idCardFront || !form.idCardBack) {
            showFailToast('请先上传身份证正反面');
            return;
        }
    }
    if (step.value === 1) {
        if (!form.facePhoto) {
            showFailToast('请先上传人脸自拍');
            return;
        }
    }
    if (step.value < 2)
        step.value++;
}
async function submit() {
    if (!form.realName)
        return showFailToast('请输入真实姓名');
    if (!form.idCardNumber)
        return showFailToast('请输入身份证号');
    for (let i = 0; i < 3; i += 1) {
        const name = getContactNameByIndex(i)?.trim();
        const phone = getContactPhoneByIndex(i)?.trim();
        const label = contactRelationLabels.value[i];
        if (!name)
            return showFailToast(`请输入联系人${i + 1}姓名`);
        if (!phone)
            return showFailToast(`请输入联系人${i + 1}手机号`);
        if (!getContactRelationByIndex(i) && label) {
            setContactRelationByIndex(i, resolveRelationCode(label));
        }
        if (!getContactRelationByIndex(i))
            return showFailToast(`请选择联系人${i + 1}关系`);
    }
    if (!form.employmentStatus)
        return showFailToast('请选择就业状态');
    if (!form.employmentName)
        return showFailToast('请填写单位/职业');
    if (!form.incomeRangeCode)
        return showFailToast('请选择月收入区间');
    if (!form.homeProvinceCode || !form.homeCityCode || !form.homeDistrictCode)
        return showFailToast('请选择完整的住址');
    if (!form.homeAddressDetail)
        return showFailToast('请输入详细地址');
    submitting.value = true;
    try {
        await submitKyc(orderId.value, form);
        showSuccessToast('资料提交成功');
        clearDraft();
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
            return;
        }
        if (order) {
            const serverForm = {
                idCardFront: order.idCardFront,
                idCardBack: order.idCardBack,
                facePhoto: order.facePhoto,
                realName: order.realName,
                idCardNumber: order.idCardNumber,
                contactName: order.contactName,
                contactPhone: order.contactPhone,
                contactRelation: order.contactRelation,
                contactName2: order.contactName2,
                contactPhone2: order.contactPhone2,
                contactRelation2: order.contactRelation2,
                contactName3: order.contactName3,
                contactPhone3: order.contactPhone3,
                contactRelation3: order.contactRelation3,
                employmentStatus: order.employmentStatus,
                employmentName: order.employmentName,
                incomeRangeCode: order.incomeRangeCode,
                homeProvinceCode: order.homeProvinceCode,
                homeCityCode: order.homeCityCode,
                homeDistrictCode: order.homeDistrictCode,
                homeAddressDetail: order.homeAddressDetail
            };
            for (const [key, value] of Object.entries(serverForm)) {
                if (value !== undefined && value !== null && value !== '') {
                    form[key] = value;
                }
            }
            provinceLabel.value = order.homeProvinceName || provinceLabel.value;
            cityLabel.value = order.homeCityName || cityLabel.value;
            districtLabel.value = order.homeDistrictName || districtLabel.value;
        }
        const draft = loadDraft();
        if (draft) {
            applyDraft(draft);
        }
        if (form.homeProvinceCode) {
            await loadCities(form.homeProvinceCode);
        }
        if (form.homeCityCode) {
            await loadDistricts(form.homeCityCode);
        }
        if (!employmentStatusLabel.value && form.employmentStatus) {
            employmentStatusLabel.value =
                employmentActions.value.find((item) => item.code === form.employmentStatus)?.name ?? '';
        }
        if (!incomeRangeLabel.value && form.incomeRangeCode) {
            incomeRangeLabel.value =
                incomeActions.value.find((item) => item.code === form.incomeRangeCode)?.name ?? '';
        }
        const contactRelations = [form.contactRelation, form.contactRelation2, form.contactRelation3];
        contactRelations.forEach((relation, index) => {
            if (!contactRelationLabels.value[index] && relation) {
                contactRelationLabels.value[index] = resolveRelationLabel(relation);
            }
            if (!relation && contactRelationLabels.value[index]) {
                setContactRelationByIndex(index, resolveRelationCode(contactRelationLabels.value[index]));
            }
        });
        if (!provinceLabel.value && form.homeProvinceCode) {
            provinceLabel.value =
                provinceActions.value.find((item) => item.code === form.homeProvinceCode)?.name ?? '';
        }
        if (!cityLabel.value && form.homeCityCode) {
            cityLabel.value = cityActions.value.find((item) => item.code === form.homeCityCode)?.name ?? '';
        }
        if (!districtLabel.value && form.homeDistrictCode) {
            districtLabel.value =
                districtActions.value.find((item) => item.code === form.homeDistrictCode)?.name ?? '';
        }
        syncUploaderLists();
    }
    catch (e) {
        showFailToast('订单不存在');
        router.replace('/orders');
    }
    finally {
        draftReady.value = true;
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
const contactRelationLabels = ref(['', '', '']);
const activeContactIndex = ref(0);
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
        const relationItems = relations.length ? relations : defaultContactRelations;
        contactRelationActions.value = relationItems.map((item) => ({
            name: item.label ?? item.name ?? String(item.code ?? ''),
            code: item.code ?? item.value ?? item.name ?? ''
        }));
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
    const code = action.code ?? action.value ?? action.name;
    const index = activeContactIndex.value;
    setContactRelationByIndex(index, code);
    contactRelationLabels.value[index] = action.name ?? code;
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
watch(() => ({
    step: step.value,
    form: { ...form },
    labels: {
        employmentStatusLabel: employmentStatusLabel.value,
        incomeRangeLabel: incomeRangeLabel.value,
        contactRelationLabels: contactRelationLabels.value,
        provinceLabel: provinceLabel.value,
        cityLabel: cityLabel.value,
        districtLabel: districtLabel.value
    }
}), () => saveDraft());
onBeforeUnmount(() => {
    saveDraft();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['bottom-bar']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page kyc-page" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h5-card" },
});
const __VLS_8 = {}.VanSteps;
/** @type {[typeof __VLS_components.VanSteps, typeof __VLS_components.vanSteps, typeof __VLS_components.VanSteps, typeof __VLS_components.vanSteps, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    active: (__VLS_ctx.step),
}));
const __VLS_10 = __VLS_9({
    active: (__VLS_ctx.step),
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-area" },
    });
    const __VLS_24 = {}.VanUploader;
    /** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        modelValue: (__VLS_ctx.idCardFrontList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardFront')),
    }));
    const __VLS_26 = __VLS_25({
        modelValue: (__VLS_ctx.idCardFrontList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardFront')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-hint" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-area" },
    });
    const __VLS_28 = {}.VanUploader;
    /** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        modelValue: (__VLS_ctx.idCardBackList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardBack')),
    }));
    const __VLS_30 = __VLS_29({
        modelValue: (__VLS_ctx.idCardBackList),
        maxCount: (1),
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'idCardBack')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-hint" },
    });
}
if (__VLS_ctx.step === 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-area" },
    });
    const __VLS_32 = {}.VanUploader;
    /** @type {[typeof __VLS_components.VanUploader, typeof __VLS_components.vanUploader, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        modelValue: (__VLS_ctx.facePhotoList),
        maxCount: (1),
        accept: "image/*",
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'facePhoto')),
    }));
    const __VLS_34 = __VLS_33({
        modelValue: (__VLS_ctx.facePhotoList),
        maxCount: (1),
        accept: "image/*",
        afterRead: ((f) => __VLS_ctx.uploadImage(f, 'facePhoto')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-hint" },
    });
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_36 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        modelValue: (__VLS_ctx.form.realName),
        label: "真实姓名",
        placeholder: "请输入身份证上的姓名",
    }));
    const __VLS_38 = __VLS_37({
        modelValue: (__VLS_ctx.form.realName),
        label: "真实姓名",
        placeholder: "请输入身份证上的姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const __VLS_40 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.form.idCardNumber),
        label: "身份证号",
        placeholder: "请输入18位身份证号",
    }));
    const __VLS_42 = __VLS_41({
        modelValue: (__VLS_ctx.form.idCardNumber),
        label: "身份证号",
        placeholder: "请输入18位身份证号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_44 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.employmentStatusLabel),
        label: "就业状态",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.employmentStatusLabel),
        label: "就业状态",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showEmploymentSheet = true;
        }
    };
    var __VLS_47;
    const __VLS_52 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        modelValue: (__VLS_ctx.form.employmentName),
        label: "单位/职业",
        placeholder: "请输入单位或职业名称",
    }));
    const __VLS_54 = __VLS_53({
        modelValue: (__VLS_ctx.form.employmentName),
        label: "单位/职业",
        placeholder: "请输入单位或职业名称",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_56 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.incomeRangeLabel),
        label: "月收入区间",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_58 = __VLS_57({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.incomeRangeLabel),
        label: "月收入区间",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    let __VLS_60;
    let __VLS_61;
    let __VLS_62;
    const __VLS_63 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showIncomeSheet = true;
        }
    };
    var __VLS_59;
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_64 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.provinceLabel),
        label: "省份",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_66 = __VLS_65({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.provinceLabel),
        label: "省份",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    let __VLS_68;
    let __VLS_69;
    let __VLS_70;
    const __VLS_71 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.showProvinceSheet = true;
        }
    };
    var __VLS_67;
    const __VLS_72 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.cityLabel),
        label: "城市",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_74 = __VLS_73({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.cityLabel),
        label: "城市",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    let __VLS_76;
    let __VLS_77;
    let __VLS_78;
    const __VLS_79 = {
        onClick: (__VLS_ctx.openCitySheet)
    };
    var __VLS_75;
    const __VLS_80 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.districtLabel),
        label: "区县",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }));
    const __VLS_82 = __VLS_81({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.districtLabel),
        label: "区县",
        placeholder: "请选择",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    let __VLS_84;
    let __VLS_85;
    let __VLS_86;
    const __VLS_87 = {
        onClick: (__VLS_ctx.openDistrictSheet)
    };
    var __VLS_83;
    const __VLS_88 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        modelValue: (__VLS_ctx.form.homeAddressDetail),
        label: "详细地址",
        placeholder: "请输入详细地址",
        type: "textarea",
        rows: "2",
    }));
    const __VLS_90 = __VLS_89({
        modelValue: (__VLS_ctx.form.homeAddressDetail),
        label: "详细地址",
        placeholder: "请输入详细地址",
        type: "textarea",
        rows: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_92 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        modelValue: (__VLS_ctx.form.contactName),
        label: "联系人1姓名",
        placeholder: "请输入联系人1姓名",
    }));
    const __VLS_94 = __VLS_93({
        modelValue: (__VLS_ctx.form.contactName),
        label: "联系人1姓名",
        placeholder: "请输入联系人1姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const __VLS_96 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        modelValue: (__VLS_ctx.form.contactPhone),
        label: "联系人1电话",
        placeholder: "请输入联系人1手机号",
        type: "tel",
    }));
    const __VLS_98 = __VLS_97({
        modelValue: (__VLS_ctx.form.contactPhone),
        label: "联系人1电话",
        placeholder: "请输入联系人1手机号",
        type: "tel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    const __VLS_100 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabels[0]),
        label: "联系人1关系",
        placeholder: "请选择关系",
        readonly: true,
        isLink: true,
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabels[0]),
        label: "联系人1关系",
        placeholder: "请选择关系",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_104;
    let __VLS_105;
    let __VLS_106;
    const __VLS_107 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.openContactRelationSheet(0);
        }
    };
    var __VLS_103;
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_108 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        modelValue: (__VLS_ctx.form.contactName2),
        label: "联系人2姓名",
        placeholder: "请输入联系人2姓名",
    }));
    const __VLS_110 = __VLS_109({
        modelValue: (__VLS_ctx.form.contactName2),
        label: "联系人2姓名",
        placeholder: "请输入联系人2姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    const __VLS_112 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        modelValue: (__VLS_ctx.form.contactPhone2),
        label: "联系人2电话",
        placeholder: "请输入联系人2手机号",
        type: "tel",
    }));
    const __VLS_114 = __VLS_113({
        modelValue: (__VLS_ctx.form.contactPhone2),
        label: "联系人2电话",
        placeholder: "请输入联系人2手机号",
        type: "tel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    const __VLS_116 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabels[1]),
        label: "联系人2关系",
        placeholder: "请选择关系",
        readonly: true,
        isLink: true,
    }));
    const __VLS_118 = __VLS_117({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabels[1]),
        label: "联系人2关系",
        placeholder: "请选择关系",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    let __VLS_120;
    let __VLS_121;
    let __VLS_122;
    const __VLS_123 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.openContactRelationSheet(1);
        }
    };
    var __VLS_119;
}
if (__VLS_ctx.step === 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h5-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    const __VLS_124 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        modelValue: (__VLS_ctx.form.contactName3),
        label: "联系人3姓名",
        placeholder: "请输入联系人3姓名",
    }));
    const __VLS_126 = __VLS_125({
        modelValue: (__VLS_ctx.form.contactName3),
        label: "联系人3姓名",
        placeholder: "请输入联系人3姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    const __VLS_128 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        modelValue: (__VLS_ctx.form.contactPhone3),
        label: "联系人3电话",
        placeholder: "请输入联系人3手机号",
        type: "tel",
    }));
    const __VLS_130 = __VLS_129({
        modelValue: (__VLS_ctx.form.contactPhone3),
        label: "联系人3电话",
        placeholder: "请输入联系人3手机号",
        type: "tel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    const __VLS_132 = {}.VanField;
    /** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabels[2]),
        label: "联系人3关系",
        placeholder: "请选择关系",
        readonly: true,
        isLink: true,
    }));
    const __VLS_134 = __VLS_133({
        ...{ 'onClick': {} },
        modelValue: (__VLS_ctx.contactRelationLabels[2]),
        label: "联系人3关系",
        placeholder: "请选择关系",
        readonly: true,
        isLink: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    let __VLS_136;
    let __VLS_137;
    let __VLS_138;
    const __VLS_139 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step === 2))
                return;
            __VLS_ctx.openContactRelationSheet(2);
        }
    };
    var __VLS_135;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bottom-bar" },
});
if (__VLS_ctx.step > 0) {
    const __VLS_140 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        ...{ 'onClick': {} },
        ...{ style: {} },
    }));
    const __VLS_142 = __VLS_141({
        ...{ 'onClick': {} },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    let __VLS_144;
    let __VLS_145;
    let __VLS_146;
    const __VLS_147 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.step > 0))
                return;
            __VLS_ctx.step--;
        }
    };
    __VLS_143.slots.default;
    var __VLS_143;
}
if (__VLS_ctx.step < 2) {
    const __VLS_148 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_150 = __VLS_149({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    let __VLS_152;
    let __VLS_153;
    let __VLS_154;
    const __VLS_155 = {
        onClick: (__VLS_ctx.nextStep)
    };
    __VLS_151.slots.default;
    var __VLS_151;
}
if (__VLS_ctx.step === 2) {
    const __VLS_156 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_158 = __VLS_157({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    let __VLS_160;
    let __VLS_161;
    let __VLS_162;
    const __VLS_163 = {
        onClick: (__VLS_ctx.submit)
    };
    __VLS_159.slots.default;
    var __VLS_159;
}
const __VLS_164 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showEmploymentSheet),
    actions: (__VLS_ctx.employmentActions),
}));
const __VLS_166 = __VLS_165({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showEmploymentSheet),
    actions: (__VLS_ctx.employmentActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
let __VLS_168;
let __VLS_169;
let __VLS_170;
const __VLS_171 = {
    onSelect: (__VLS_ctx.onSelectEmployment)
};
var __VLS_167;
const __VLS_172 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showIncomeSheet),
    actions: (__VLS_ctx.incomeActions),
}));
const __VLS_174 = __VLS_173({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showIncomeSheet),
    actions: (__VLS_ctx.incomeActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
let __VLS_176;
let __VLS_177;
let __VLS_178;
const __VLS_179 = {
    onSelect: (__VLS_ctx.onSelectIncome)
};
var __VLS_175;
const __VLS_180 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showContactRelationSheet),
    title: "选择关系",
    actions: (__VLS_ctx.contactRelationActions),
}));
const __VLS_182 = __VLS_181({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showContactRelationSheet),
    title: "选择关系",
    actions: (__VLS_ctx.contactRelationActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
let __VLS_184;
let __VLS_185;
let __VLS_186;
const __VLS_187 = {
    onSelect: (__VLS_ctx.onSelectContactRelation)
};
var __VLS_183;
const __VLS_188 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showProvinceSheet),
    actions: (__VLS_ctx.provinceActions),
}));
const __VLS_190 = __VLS_189({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showProvinceSheet),
    actions: (__VLS_ctx.provinceActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
let __VLS_192;
let __VLS_193;
let __VLS_194;
const __VLS_195 = {
    onSelect: (__VLS_ctx.onSelectProvince)
};
var __VLS_191;
const __VLS_196 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showCitySheet),
    actions: (__VLS_ctx.cityActions),
}));
const __VLS_198 = __VLS_197({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showCitySheet),
    actions: (__VLS_ctx.cityActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
let __VLS_200;
let __VLS_201;
let __VLS_202;
const __VLS_203 = {
    onSelect: (__VLS_ctx.onSelectCity)
};
var __VLS_199;
const __VLS_204 = {}.VanActionSheet;
/** @type {[typeof __VLS_components.VanActionSheet, typeof __VLS_components.vanActionSheet, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showDistrictSheet),
    actions: (__VLS_ctx.districtActions),
}));
const __VLS_206 = __VLS_205({
    ...{ 'onSelect': {} },
    show: (__VLS_ctx.showDistrictSheet),
    actions: (__VLS_ctx.districtActions),
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
let __VLS_208;
let __VLS_209;
let __VLS_210;
const __VLS_211 = {
    onSelect: (__VLS_ctx.onSelectDistrict)
};
var __VLS_207;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['kyc-page']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['h5-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
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
            openContactRelationSheet: openContactRelationSheet,
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
            contactRelationLabels: contactRelationLabels,
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
