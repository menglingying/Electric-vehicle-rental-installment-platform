import { computed, h, onMounted, reactive, ref } from 'vue';
import { Button, Message, Modal, Tag } from '@arco-design/web-vue';
import { listContracts, upsertManualContract, uploadContractPdf, downloadContractFile, syncContractStatus, deleteContract } from '@/services/api';
import { isSuper } from '@/services/auth';
const rows = ref([]);
const activeType = ref('ALL');
const searchKeyword = ref('');
const filteredRows = computed(() => {
    const kw = searchKeyword.value.trim();
    if (!kw)
        return rows.value;
    return rows.value.filter(r => {
        const name = r.metaObj?.renterName || '';
        const phone = r.metaObj?.renterPhone || '';
        return name.includes(kw) || phone.includes(kw);
    });
});
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
function handleDelete(record) {
    Modal.warning({
        title: '确认删除',
        content: `确定要删除合同 ${record.contractNo || record.orderId} 吗？此操作不可恢复。`,
        okText: '删除',
        cancelText: '取消',
        hideCancel: false,
        onOk: async () => {
            try {
                await deleteContract(record.orderId);
                Message.success('删除成功');
                await load();
            }
            catch (e) {
                Message.error(e?.response?.data?.message ?? '删除失败');
            }
        }
    });
}
const downloading = ref(false);
const syncing = ref(false);
async function handleSyncStatus(record) {
    if (syncing.value)
        return;
    syncing.value = true;
    try {
        const updated = await syncContractStatus(record.orderId);
        if (updated.status === 'SIGNED') {
            Message.success('合同已签署 ✓，状态已更新');
        }
        else if (updated.status === 'SIGNING') {
            Message.info('客户尚未签署');
        }
        else {
            Message.warning(`状态已更新：${updated.status}`);
        }
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '查询爱签状态失败');
    }
    finally {
        syncing.value = false;
    }
}
function contractStatusTag(status) {
    const map = {
        SIGNING: { label: '签署中', color: 'blue' },
        SIGNED: { label: '已签署', color: 'green' },
        VOID: { label: '已作废', color: 'orangered' },
        FAILED: { label: '失败', color: 'red' },
        EXPIRED: { label: '已过期', color: 'gray' }
    };
    const s = status ? (map[status] ?? { label: status, color: 'gray' }) : { label: '未知', color: 'gray' };
    return h(Tag, { color: s.color }, () => s.label);
}
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
        render: ({ record }) => contractStatusTag(record.status)
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
            // 签署中状态可刷新：主动向爱签查询，已签就自动更新
            record.contractType === 'ORDER' && record.status === 'SIGNING'
                ? h(Button, { size: 'small', onClick: () => handleSyncStatus(record) }, () => '刷新状态')
                : null,
            record.notaryCertUrl
                ? h(Button, { size: 'small', onClick: () => openUrl(record.notaryCertUrl || '') }, () => '公证书')
                : null,
            isSuper()
                ? h(Button, { size: 'small', status: 'danger', onClick: () => handleDelete(record) }, () => '删除')
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
const __VLS_0 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索客户姓名 / 手机号",
    allowClear: true,
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索客户姓名 / 手机号",
    allowClear: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.activeType),
    type: "button",
    size: "small",
}));
const __VLS_6 = __VLS_5({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.activeType),
    type: "button",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onChange: (__VLS_ctx.load)
};
__VLS_7.slots.default;
const __VLS_12 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    value: "ALL",
}));
const __VLS_14 = __VLS_13({
    value: "ALL",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
const __VLS_16 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    value: "ORDER",
}));
const __VLS_18 = __VLS_17({
    value: "ORDER",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
const __VLS_20 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    value: "MANUAL",
}));
const __VLS_22 = __VLS_21({
    value: "MANUAL",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
var __VLS_7;
const __VLS_24 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.openCreate)
};
__VLS_27.slots.default;
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_32 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}));
const __VLS_34 = __VLS_33({
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑历史合同' : '新增历史合同'),
}));
const __VLS_38 = __VLS_37({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑历史合同' : '新增历史合同'),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onOk: (__VLS_ctx.save)
};
__VLS_39.slots.default;
const __VLS_44 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    model: (__VLS_ctx.form),
    layout: "vertical",
}));
const __VLS_46 = __VLS_45({
    model: (__VLS_ctx.form),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "合同编号",
}));
const __VLS_50 = __VLS_49({
    label: "合同编号",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.form.contractNo),
    placeholder: "可选",
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.form.contractNo),
    placeholder: "可选",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_51;
const __VLS_56 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "历史订单编号",
}));
const __VLS_58 = __VLS_57({
    label: "历史订单编号",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    modelValue: (__VLS_ctx.form.orderNo),
    placeholder: "历史订单编号（可选）",
}));
const __VLS_62 = __VLS_61({
    modelValue: (__VLS_ctx.form.orderNo),
    placeholder: "历史订单编号（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
var __VLS_59;
const __VLS_64 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    label: "商品名称",
}));
const __VLS_66 = __VLS_65({
    label: "商品名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.form.productName),
}));
const __VLS_70 = __VLS_69({
    modelValue: (__VLS_ctx.form.productName),
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
var __VLS_67;
const __VLS_72 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    label: "承租人姓名",
}));
const __VLS_74 = __VLS_73({
    label: "承租人姓名",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    modelValue: (__VLS_ctx.form.renterName),
}));
const __VLS_78 = __VLS_77({
    modelValue: (__VLS_ctx.form.renterName),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
var __VLS_75;
const __VLS_80 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "承租人证件号",
}));
const __VLS_82 = __VLS_81({
    label: "承租人证件号",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
const __VLS_84 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    modelValue: (__VLS_ctx.form.renterIdNumber),
}));
const __VLS_86 = __VLS_85({
    modelValue: (__VLS_ctx.form.renterIdNumber),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
var __VLS_83;
const __VLS_88 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "承租人手机号",
}));
const __VLS_90 = __VLS_89({
    label: "承租人手机号",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
const __VLS_92 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    modelValue: (__VLS_ctx.form.renterPhone),
}));
const __VLS_94 = __VLS_93({
    modelValue: (__VLS_ctx.form.renterPhone),
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
var __VLS_91;
const __VLS_96 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    label: "租期起始（YYYY-MM-DD）",
}));
const __VLS_98 = __VLS_97({
    label: "租期起始（YYYY-MM-DD）",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
const __VLS_100 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    modelValue: (__VLS_ctx.form.leaseStart),
    placeholder: "例如 2025-01-01",
}));
const __VLS_102 = __VLS_101({
    modelValue: (__VLS_ctx.form.leaseStart),
    placeholder: "例如 2025-01-01",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
var __VLS_99;
const __VLS_104 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    label: "租期结束（YYYY-MM-DD）",
}));
const __VLS_106 = __VLS_105({
    label: "租期结束（YYYY-MM-DD）",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
const __VLS_108 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    modelValue: (__VLS_ctx.form.leaseEnd),
    placeholder: "例如 2025-12-31",
}));
const __VLS_110 = __VLS_109({
    modelValue: (__VLS_ctx.form.leaseEnd),
    placeholder: "例如 2025-12-31",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
var __VLS_107;
const __VLS_112 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    label: "期数",
}));
const __VLS_114 = __VLS_113({
    label: "期数",
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
__VLS_115.slots.default;
const __VLS_116 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    modelValue: (__VLS_ctx.form.periods),
    min: (1),
}));
const __VLS_118 = __VLS_117({
    modelValue: (__VLS_ctx.form.periods),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
var __VLS_115;
const __VLS_120 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    label: "周期（天）",
}));
const __VLS_122 = __VLS_121({
    label: "周期（天）",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
__VLS_123.slots.default;
const __VLS_124 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    modelValue: (__VLS_ctx.form.cycleDays),
    min: (1),
}));
const __VLS_126 = __VLS_125({
    modelValue: (__VLS_ctx.form.cycleDays),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
var __VLS_123;
const __VLS_128 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    label: "租金/期（元）",
}));
const __VLS_130 = __VLS_129({
    label: "租金/期（元）",
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
const __VLS_132 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    modelValue: (__VLS_ctx.form.rentPerPeriod),
    min: (0),
}));
const __VLS_134 = __VLS_133({
    modelValue: (__VLS_ctx.form.rentPerPeriod),
    min: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
var __VLS_131;
const __VLS_136 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    label: "押金比例",
}));
const __VLS_138 = __VLS_137({
    label: "押金比例",
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
__VLS_139.slots.default;
const __VLS_140 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    modelValue: (__VLS_ctx.form.depositRatio),
    min: (0),
    max: (1),
    step: (0.01),
}));
const __VLS_142 = __VLS_141({
    modelValue: (__VLS_ctx.form.depositRatio),
    min: (0),
    max: (1),
    step: (0.01),
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
var __VLS_139;
const __VLS_144 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    label: "签署时间（ISO）",
}));
const __VLS_146 = __VLS_145({
    label: "签署时间（ISO）",
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
__VLS_147.slots.default;
const __VLS_148 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    modelValue: (__VLS_ctx.form.signedAt),
    placeholder: "例如 2025-01-01T08:00:00Z",
}));
const __VLS_150 = __VLS_149({
    modelValue: (__VLS_ctx.form.signedAt),
    placeholder: "例如 2025-01-01T08:00:00Z",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
var __VLS_147;
const __VLS_152 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    label: "签署人",
}));
const __VLS_154 = __VLS_153({
    label: "签署人",
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
__VLS_155.slots.default;
const __VLS_156 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    modelValue: (__VLS_ctx.form.signedBy),
}));
const __VLS_158 = __VLS_157({
    modelValue: (__VLS_ctx.form.signedBy),
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
var __VLS_155;
const __VLS_160 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    label: "备注",
}));
const __VLS_162 = __VLS_161({
    label: "备注",
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
__VLS_163.slots.default;
const __VLS_164 = {}.ATextarea;
/** @type {[typeof __VLS_components.ATextarea, typeof __VLS_components.aTextarea, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    modelValue: (__VLS_ctx.form.remark),
    autoSize: ({ minRows: 2, maxRows: 4 }),
}));
const __VLS_166 = __VLS_165({
    modelValue: (__VLS_ctx.form.remark),
    autoSize: ({ minRows: 2, maxRows: 4 }),
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
var __VLS_163;
const __VLS_168 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    label: "合同PDF",
}));
const __VLS_170 = __VLS_169({
    label: "合同PDF",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
const __VLS_172 = {}.AUpload;
/** @type {[typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "application/pdf",
}));
const __VLS_174 = __VLS_173({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "application/pdf",
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
let __VLS_176;
let __VLS_177;
let __VLS_178;
const __VLS_179 = {
    onChange: (__VLS_ctx.onSelectPdf)
};
__VLS_175.slots.default;
{
    const { 'upload-button': __VLS_thisSlot } = __VLS_175.slots;
    const __VLS_180 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
        loading: (__VLS_ctx.uploading),
    }));
    const __VLS_182 = __VLS_181({
        loading: (__VLS_ctx.uploading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    __VLS_183.slots.default;
    var __VLS_183;
}
var __VLS_175;
if (__VLS_ctx.form.fileUrl) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "file-hint" },
    });
    (__VLS_ctx.form.fileUrl);
    const __VLS_184 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
        ...{ 'onClick': {} },
        size: "mini",
    }));
    const __VLS_186 = __VLS_185({
        ...{ 'onClick': {} },
        size: "mini",
    }, ...__VLS_functionalComponentArgsRest(__VLS_185));
    let __VLS_188;
    let __VLS_189;
    let __VLS_190;
    const __VLS_191 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.form.fileUrl))
                return;
            __VLS_ctx.openUrl(__VLS_ctx.form.fileUrl);
        }
    };
    __VLS_187.slots.default;
    var __VLS_187;
}
var __VLS_171;
var __VLS_47;
var __VLS_39;
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
            activeType: activeType,
            searchKeyword: searchKeyword,
            filteredRows: filteredRows,
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
