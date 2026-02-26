import { h, onMounted, reactive, ref } from 'vue';
import { Button, Message } from '@arco-design/web-vue';
import { listContracts, upsertManualContract, uploadContractPdf, downloadContractFile } from '@/services/api';
const rows = ref([]);
const activeType = ref('ALL');
const visible = ref(false);
const uploading = ref(false);
const form = reactive({
    id: '',
    contractNo: '',
    orderNo: '',
    productName: '',
    renterName: '',
    renterIdNumber: '',
    renterPhone: '',
    leaseStart: '',
    leaseEnd: '',
    periods: 0,
    cycleDays: 0,
    rentPerPeriod: 0,
    depositRatio: 0,
    signedAt: '',
    signedBy: '',
    remark: '',
    fileUrl: ''
});
function parseMeta(meta) {
    if (!meta)
        return {};
    try {
        return JSON.parse(meta);
    }
    catch {
        return {};
    }
}
async function load() {
    try {
        const data = activeType.value === 'ALL' ? await listContracts() : await listContracts(activeType.value);
        rows.value = data.map((item) => ({ ...item, metaObj: parseMeta(item.meta) }));
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
function openCreate() {
    Object.assign(form, {
        id: '',
        contractNo: '',
        orderNo: '',
        productName: '',
        renterName: '',
        renterIdNumber: '',
        renterPhone: '',
        leaseStart: '',
        leaseEnd: '',
        periods: 0,
        cycleDays: 0,
        rentPerPeriod: 0,
        depositRatio: 0,
        signedAt: '',
        signedBy: '',
        remark: '',
        fileUrl: ''
    });
    visible.value = true;
}
function openEdit(row) {
    if (row.contractType && row.contractType !== 'MANUAL') {
        return;
    }
    const meta = row.metaObj || {};
    Object.assign(form, {
        id: row.orderId,
        contractNo: row.contractNo || '',
        orderNo: meta.orderNo || '',
        productName: meta.productName || '',
        renterName: meta.renterName || '',
        renterIdNumber: meta.renterIdNumber || '',
        renterPhone: meta.renterPhone || '',
        leaseStart: meta.leaseStart || '',
        leaseEnd: meta.leaseEnd || '',
        periods: Number(meta.periods || 0),
        cycleDays: Number(meta.cycleDays || 0),
        rentPerPeriod: Number(meta.rentPerPeriod || 0),
        depositRatio: Number(meta.depositRatio || 0),
        signedAt: meta.signedAt || row.signedAt || '',
        signedBy: row.signedBy || '',
        remark: meta.remark || '',
        fileUrl: row.fileUrl || ''
    });
    visible.value = true;
}
async function save() {
    if (!form.productName)
        return Message.warning('请输入商品名称');
    if (!form.renterName)
        return Message.warning('请输入承租人姓名');
    if (!form.renterPhone)
        return Message.warning('请输入承租人手机号');
    if (!form.fileUrl)
        return Message.warning('请上传合同PDF');
    try {
        await upsertManualContract({
            id: form.id || undefined,
            contractNo: form.contractNo || undefined,
            orderNo: form.orderNo || undefined,
            productName: form.productName || undefined,
            renterName: form.renterName || undefined,
            renterIdNumber: form.renterIdNumber || undefined,
            renterPhone: form.renterPhone || undefined,
            leaseStart: form.leaseStart || undefined,
            leaseEnd: form.leaseEnd || undefined,
            periods: form.periods || undefined,
            cycleDays: form.cycleDays || undefined,
            rentPerPeriod: form.rentPerPeriod || undefined,
            depositRatio: form.depositRatio || undefined,
            signedAt: form.signedAt || undefined,
            signedBy: form.signedBy || undefined,
            fileUrl: form.fileUrl || undefined,
            remark: form.remark || undefined
        });
        Message.success('保存成功');
        visible.value = false;
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '保存失败');
    }
}
async function onSelectPdf(fileList, fileItem) {
    const item = fileItem ?? (fileList?.length ? fileList[fileList.length - 1] : null);
    const raw = item?.file ?? item?.originFile ?? item?.raw;
    if (!raw)
        return;
    uploading.value = true;
    try {
        const res = await uploadContractPdf(raw);
        form.fileUrl = res.url;
        Message.success('上传成功');
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '上传失败');
    }
    finally {
        uploading.value = false;
    }
}
function openUrl(url) {
    if (!url)
        return;
    window.open(url, '_blank');
}
function copyText(text) {
    if (!text)
        return;
    if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => Message.success('已复制')).catch(() => Message.error('复制失败'));
    }
    else {
        Message.info('浏览器不支持复制，请手动复制');
    }
}
const downloading = ref(false);
async function handleDownloadContract(record) {
    if (record.fileUrl) {
        openUrl(record.fileUrl);
        return;
    }
    // 没有fileUrl，从爱签下载
    downloading.value = true;
    try {
        const updated = await downloadContractFile(record.orderId);
        if (updated.fileUrl) {
            openUrl(updated.fileUrl);
            await load();
        }
        else {
            Message.error('下载失败：未获取到文件');
        }
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '下载合同失败');
    }
    finally {
        downloading.value = false;
    }
}
function contractTypeText(type) {
    if (type === 'MANUAL')
        return '历史合同';
    if (type === 'ORDER')
        return '电子签';
    return type || '-';
}
const columns = [
    { title: '类型', render: ({ record }) => contractTypeText(record.contractType) },
    { title: '订单ID', dataIndex: 'orderId' },
    { title: '合同编号', dataIndex: 'contractNo' },
    {
        title: '商品',
        render: ({ record }) => record.metaObj?.productName || '-'
    },
    {
        title: '承租人',
        render: ({ record }) => record.metaObj?.renterName || '-'
    },
    {
        title: '手机号',
        render: ({ record }) => record.metaObj?.renterPhone || '-'
    },
    {
        title: '租期',
        render: ({ record }) => {
            const meta = record.metaObj || {};
            const start = meta.leaseStart || '-';
            const end = meta.leaseEnd || '-';
            return `${start} ~ ${end}`;
        }
    },
    {
        title: '租金/期',
        render: ({ record }) => record.metaObj?.rentPerPeriod ?? '-'
    },
    {
        title: '状态',
        render: ({ record }) => record.status || '-'
    },
    {
        title: '操作',
        render: ({ record }) => h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' }, [
            record.contractType === 'MANUAL'
                ? h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑')
                : null,
            record.signUrl
                ? h(Button, { size: 'small', onClick: () => copyText(record.signUrl) }, () => '复制签署链接')
                : null,
            record.signUrl
                ? h(Button, { size: 'small', onClick: () => openUrl(record.signUrl) }, () => '打开签署链接')
                : null,
            // 下载合同：有fileUrl直接打开，SIGNED状态无fileUrl则从爱签下载
            (record.fileUrl || (record.contractType === 'ORDER' && record.status === 'SIGNED'))
                ? h(Button, { type: 'primary', size: 'small', loading: downloading.value, onClick: () => handleDownloadContract(record) }, () => '下载合同')
                : null,
            record.notaryCertUrl
                ? h(Button, { size: 'small', onClick: () => openUrl(record.notaryCertUrl || '') }, () => '公证书')
                : null
        ])
    }
];
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "link" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-toolbar" },
});
const __VLS_0 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.activeType),
    type: "button",
    size: "small",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.activeType),
    type: "button",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (__VLS_ctx.load)
};
__VLS_3.slots.default;
const __VLS_8 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    value: "ALL",
}));
const __VLS_10 = __VLS_9({
    value: "ALL",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
var __VLS_11;
const __VLS_12 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    value: "ORDER",
}));
const __VLS_14 = __VLS_13({
    value: "ORDER",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
const __VLS_16 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    value: "MANUAL",
}));
const __VLS_18 = __VLS_17({
    value: "MANUAL",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
var __VLS_3;
const __VLS_20 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (__VLS_ctx.openCreate)
};
__VLS_23.slots.default;
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_28 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    data: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}));
const __VLS_30 = __VLS_29({
    data: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑历史合同' : '新增历史合同'),
}));
const __VLS_34 = __VLS_33({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑历史合同' : '新增历史合同'),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_36;
let __VLS_37;
let __VLS_38;
const __VLS_39 = {
    onOk: (__VLS_ctx.save)
};
__VLS_35.slots.default;
const __VLS_40 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    model: (__VLS_ctx.form),
    layout: "vertical",
}));
const __VLS_42 = __VLS_41({
    model: (__VLS_ctx.form),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    label: "合同编号",
}));
const __VLS_46 = __VLS_45({
    label: "合同编号",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    modelValue: (__VLS_ctx.form.contractNo),
    placeholder: "可选",
}));
const __VLS_50 = __VLS_49({
    modelValue: (__VLS_ctx.form.contractNo),
    placeholder: "可选",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
var __VLS_47;
const __VLS_52 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    label: "历史订单编号",
}));
const __VLS_54 = __VLS_53({
    label: "历史订单编号",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    modelValue: (__VLS_ctx.form.orderNo),
    placeholder: "历史订单编号（可选）",
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.form.orderNo),
    placeholder: "历史订单编号（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
var __VLS_55;
const __VLS_60 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    label: "商品名称",
}));
const __VLS_62 = __VLS_61({
    label: "商品名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    modelValue: (__VLS_ctx.form.productName),
}));
const __VLS_66 = __VLS_65({
    modelValue: (__VLS_ctx.form.productName),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
var __VLS_63;
const __VLS_68 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    label: "承租人姓名",
}));
const __VLS_70 = __VLS_69({
    label: "承租人姓名",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.form.renterName),
}));
const __VLS_74 = __VLS_73({
    modelValue: (__VLS_ctx.form.renterName),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
var __VLS_71;
const __VLS_76 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: "承租人证件号",
}));
const __VLS_78 = __VLS_77({
    label: "承租人证件号",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    modelValue: (__VLS_ctx.form.renterIdNumber),
}));
const __VLS_82 = __VLS_81({
    modelValue: (__VLS_ctx.form.renterIdNumber),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
var __VLS_79;
const __VLS_84 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    label: "承租人手机号",
}));
const __VLS_86 = __VLS_85({
    label: "承租人手机号",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
const __VLS_88 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    modelValue: (__VLS_ctx.form.renterPhone),
}));
const __VLS_90 = __VLS_89({
    modelValue: (__VLS_ctx.form.renterPhone),
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
var __VLS_87;
const __VLS_92 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    label: "租期起始（YYYY-MM-DD）",
}));
const __VLS_94 = __VLS_93({
    label: "租期起始（YYYY-MM-DD）",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_95.slots.default;
const __VLS_96 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    modelValue: (__VLS_ctx.form.leaseStart),
    placeholder: "例如 2025-01-01",
}));
const __VLS_98 = __VLS_97({
    modelValue: (__VLS_ctx.form.leaseStart),
    placeholder: "例如 2025-01-01",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
var __VLS_95;
const __VLS_100 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    label: "租期结束（YYYY-MM-DD）",
}));
const __VLS_102 = __VLS_101({
    label: "租期结束（YYYY-MM-DD）",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
const __VLS_104 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    modelValue: (__VLS_ctx.form.leaseEnd),
    placeholder: "例如 2025-12-31",
}));
const __VLS_106 = __VLS_105({
    modelValue: (__VLS_ctx.form.leaseEnd),
    placeholder: "例如 2025-12-31",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
var __VLS_103;
const __VLS_108 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    label: "期数",
}));
const __VLS_110 = __VLS_109({
    label: "期数",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
const __VLS_112 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    modelValue: (__VLS_ctx.form.periods),
    min: (1),
}));
const __VLS_114 = __VLS_113({
    modelValue: (__VLS_ctx.form.periods),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
var __VLS_111;
const __VLS_116 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    label: "周期（天）",
}));
const __VLS_118 = __VLS_117({
    label: "周期（天）",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
__VLS_119.slots.default;
const __VLS_120 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    modelValue: (__VLS_ctx.form.cycleDays),
    min: (1),
}));
const __VLS_122 = __VLS_121({
    modelValue: (__VLS_ctx.form.cycleDays),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
var __VLS_119;
const __VLS_124 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    label: "租金/期（元）",
}));
const __VLS_126 = __VLS_125({
    label: "租金/期（元）",
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
__VLS_127.slots.default;
const __VLS_128 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    modelValue: (__VLS_ctx.form.rentPerPeriod),
    min: (0),
}));
const __VLS_130 = __VLS_129({
    modelValue: (__VLS_ctx.form.rentPerPeriod),
    min: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
var __VLS_127;
const __VLS_132 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    label: "押金比例",
}));
const __VLS_134 = __VLS_133({
    label: "押金比例",
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
__VLS_135.slots.default;
const __VLS_136 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    modelValue: (__VLS_ctx.form.depositRatio),
    min: (0),
    max: (1),
    step: (0.01),
}));
const __VLS_138 = __VLS_137({
    modelValue: (__VLS_ctx.form.depositRatio),
    min: (0),
    max: (1),
    step: (0.01),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
var __VLS_135;
const __VLS_140 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    label: "签署时间（ISO）",
}));
const __VLS_142 = __VLS_141({
    label: "签署时间（ISO）",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
__VLS_143.slots.default;
const __VLS_144 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    modelValue: (__VLS_ctx.form.signedAt),
    placeholder: "例如 2025-01-01T08:00:00Z",
}));
const __VLS_146 = __VLS_145({
    modelValue: (__VLS_ctx.form.signedAt),
    placeholder: "例如 2025-01-01T08:00:00Z",
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
var __VLS_143;
const __VLS_148 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    label: "签署人",
}));
const __VLS_150 = __VLS_149({
    label: "签署人",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
__VLS_151.slots.default;
const __VLS_152 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    modelValue: (__VLS_ctx.form.signedBy),
}));
const __VLS_154 = __VLS_153({
    modelValue: (__VLS_ctx.form.signedBy),
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
var __VLS_151;
const __VLS_156 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    label: "备注",
}));
const __VLS_158 = __VLS_157({
    label: "备注",
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
__VLS_159.slots.default;
const __VLS_160 = {}.ATextarea;
/** @type {[typeof __VLS_components.ATextarea, typeof __VLS_components.aTextarea, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    modelValue: (__VLS_ctx.form.remark),
    autoSize: ({ minRows: 2, maxRows: 4 }),
}));
const __VLS_162 = __VLS_161({
    modelValue: (__VLS_ctx.form.remark),
    autoSize: ({ minRows: 2, maxRows: 4 }),
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
var __VLS_159;
const __VLS_164 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    label: "合同PDF",
}));
const __VLS_166 = __VLS_165({
    label: "合同PDF",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
const __VLS_168 = {}.AUpload;
/** @type {[typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "application/pdf",
}));
const __VLS_170 = __VLS_169({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "application/pdf",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
let __VLS_172;
let __VLS_173;
let __VLS_174;
const __VLS_175 = {
    onChange: (__VLS_ctx.onSelectPdf)
};
__VLS_171.slots.default;
{
    const { 'upload-button': __VLS_thisSlot } = __VLS_171.slots;
    const __VLS_176 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
        loading: (__VLS_ctx.uploading),
    }));
    const __VLS_178 = __VLS_177({
        loading: (__VLS_ctx.uploading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_177));
    __VLS_179.slots.default;
    var __VLS_179;
}
var __VLS_171;
if (__VLS_ctx.form.fileUrl) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "file-hint" },
    });
    (__VLS_ctx.form.fileUrl);
    const __VLS_180 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
        ...{ 'onClick': {} },
        size: "mini",
    }));
    const __VLS_182 = __VLS_181({
        ...{ 'onClick': {} },
        size: "mini",
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    let __VLS_184;
    let __VLS_185;
    let __VLS_186;
    const __VLS_187 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.form.fileUrl))
                return;
            __VLS_ctx.openUrl(__VLS_ctx.form.fileUrl);
        }
    };
    __VLS_183.slots.default;
    var __VLS_183;
}
var __VLS_167;
var __VLS_43;
var __VLS_35;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['file-hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            rows: rows,
            activeType: activeType,
            visible: visible,
            uploading: uploading,
            form: form,
            load: load,
            openCreate: openCreate,
            save: save,
            onSelectPdf: onSelectPdf,
            openUrl: openUrl,
            columns: columns,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
