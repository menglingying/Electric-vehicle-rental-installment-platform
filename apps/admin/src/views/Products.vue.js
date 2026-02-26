import { h, onMounted, reactive, ref, computed } from 'vue';
import { Button, Message, Tag, Modal } from '@arco-design/web-vue';
import { listCategories, listProducts, uploadProductImage, upsertProduct, deleteProduct } from '@/services/api';
const rows = ref([]);
const categories = ref([]);
const visible = ref(false);
const uploading = ref(false);
const searchKeyword = ref('');
const brandOptions = computed(() => {
    return categories.value.map((c) => ({ label: c.name, value: c.id }));
});
const seriesOptions = computed(() => {
    if (!form.brandId)
        return [];
    const brand = categories.value.find((c) => c.id === form.brandId);
    return (brand?.children || []).map((c) => ({ label: c.name, value: c.id }));
});
const modelOptions = computed(() => {
    if (!form.brandId || !form.seriesId)
        return [];
    const brand = categories.value.find((c) => c.id === form.brandId);
    const series = (brand?.children || []).find((c) => c.id === form.seriesId);
    return (series?.children || []).map((c) => ({ label: c.name, value: c.id }));
});
function onBrandChange() {
    form.seriesId = '';
    form.categoryId = '';
}
function onSeriesChange() {
    form.categoryId = '';
}
function resolveCategoryPath(categoryId) {
    for (const brand of categories.value) {
        for (const series of brand.children || []) {
            for (const model of series.children || []) {
                if (model.id === categoryId) {
                    return { brandId: brand.id, seriesId: series.id };
                }
            }
        }
    }
    return { brandId: '', seriesId: '' };
}
const categoryNameMap = computed(() => {
    const map = {};
    for (const brand of categories.value) {
        for (const series of brand.children || []) {
            for (const model of series.children || []) {
                map[model.id] = `${brand.name} / ${series.name} / ${model.name}`;
            }
        }
    }
    return map;
});
const filteredRows = computed(() => {
    let list = rows.value;
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (keyword) {
        list = list.filter((p) => p.name.toLowerCase().includes(keyword) ||
            p.id.toLowerCase().includes(keyword) ||
            (p.frameConfig || '').toLowerCase().includes(keyword) ||
            (p.batteryConfig || '').toLowerCase().includes(keyword));
    }
    return [...list].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const firstCharA = nameA.charAt(0);
        const firstCharB = nameB.charAt(0);
        if (firstCharA !== firstCharB) {
            return firstCharA.localeCompare(firstCharB);
        }
        return nameA.localeCompare(nameB);
    });
});
function onSearch() {
    // computed will update
}
const columns = [
    {
        title: '图片',
        render: ({ record }) => {
            const coverUrl = record.coverUrl || record.images?.[0];
            if (!coverUrl)
                return '-';
            return h('img', {
                src: coverUrl,
                style: 'width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--color-border)'
            });
        }
    },
    { title: 'ID', dataIndex: 'id' },
    { title: '名称', dataIndex: 'name' },
    {
        title: '分类',
        render: ({ record }) => categoryNameMap.value[record.categoryId] || '-'
    },
    {
        title: '电池配置/价格',
        render: ({ record }) => {
            const items = [];
            const withoutBattery = record.rentWithoutBattery ?? record.rentPerCycle;
            items.push(h('div', { style: 'white-space: nowrap' }, `空车: ¥${withoutBattery}/期`));
            if (record.rentWithBattery != null) {
                const batteryName = record.batteryConfig || '含电池';
                items.push(h('div', { style: 'white-space: nowrap' }, `${batteryName}: ¥${record.rentWithBattery}/期`));
            }
            return h('div', { style: 'display: flex; flex-direction: column; gap: 4px' }, items);
        }
    },
    {
        title: '标签',
        render: ({ record }) => h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap' }, (record.tags ?? []).map((t) => h(Tag, { bordered: true }, () => t)))
    },
    {
        title: '操作',
        render: ({ record }) => h('div', { style: 'display: flex; gap: 8px' }, [
            h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑'),
            h(Button, { size: 'small', status: 'danger', onClick: () => confirmDelete(record) }, () => '删除')
        ])
    }
];
const form = reactive({
    id: '',
    name: '',
    brandId: '',
    seriesId: '',
    categoryId: '',
    images: [],
    rentPerCycle: 299,
    tagsText: '',
    frameConfig: '',
    batteryConfig: '',
    rentWithoutBattery: null,
    rentWithBattery: null
});
async function load() {
    try {
        rows.value = await listProducts();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
function confirmDelete(p) {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除商品「${p.name}」吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: { status: 'danger' },
        onOk: async () => {
            try {
                await deleteProduct(p.id);
                Message.success('删除成功');
                await load();
            }
            catch (e) {
                Message.error(e?.response?.data?.message ?? '删除失败');
            }
        }
    });
}
function openCreate() {
    form.id = '';
    form.name = '';
    form.brandId = '';
    form.seriesId = '';
    form.categoryId = '';
    form.images = [];
    form.rentPerCycle = 299;
    form.tagsText = '';
    form.frameConfig = '';
    form.batteryConfig = '';
    form.rentWithoutBattery = null;
    form.rentWithBattery = null;
    visible.value = true;
}
function openEdit(p) {
    form.id = p.id;
    form.name = p.name;
    const path = resolveCategoryPath(p.categoryId ?? '');
    form.brandId = path.brandId;
    form.seriesId = path.seriesId;
    form.categoryId = p.categoryId ?? '';
    form.images = (p.images ?? []).length ? [...(p.images ?? [])] : p.coverUrl ? [p.coverUrl] : [];
    form.rentPerCycle = p.rentPerCycle;
    form.tagsText = (p.tags ?? []).join(',');
    form.frameConfig = p.frameConfig ?? '';
    form.batteryConfig = p.batteryConfig ?? '';
    form.rentWithoutBattery = p.rentWithoutBattery ?? null;
    form.rentWithBattery = p.rentWithBattery ?? null;
    visible.value = true;
}
function setAsCover(idx) {
    if (idx <= 0 || idx >= form.images.length)
        return;
    const [picked] = form.images.splice(idx, 1);
    form.images.unshift(picked);
}
function moveImage(idx, delta) {
    const next = idx + delta;
    if (next < 0 || next >= form.images.length)
        return;
    const tmp = form.images[idx];
    form.images[idx] = form.images[next];
    form.images[next] = tmp;
}
function removeImage(idx) {
    if (idx < 0 || idx >= form.images.length)
        return;
    form.images.splice(idx, 1);
}
async function onSelectFiles(fileList, fileItem) {
    const items = fileItem ? [fileItem] : fileList ?? [];
    if (!items.length)
        return;
    const MAX_IMAGES = 10;
    for (const item of items) {
        if (form.images.length >= MAX_IMAGES) {
            Message.warning(`最多上传 ${MAX_IMAGES} 张图片`);
            break;
        }
        const raw = item?.file ?? item?.originFile ?? item?.raw;
        if (!raw)
            continue;
        uploading.value = true;
        try {
            const res = await uploadProductImage(raw);
            form.images.push(res.url);
            Message.success('上传成功');
        }
        catch (e) {
            Message.error(e?.response?.data?.message ?? '上传失败');
        }
        finally {
            uploading.value = false;
        }
    }
}
async function save() {
    if (!form.name)
        return Message.warning('请输入名称');
    if (!form.categoryId)
        return Message.warning('请选择车型分类');
    const images = (form.images ?? []).map((s) => String(s).trim()).filter(Boolean);
    try {
        await upsertProduct({
            id: form.id || undefined,
            name: form.name,
            categoryId: form.categoryId,
            coverUrl: images[0] || undefined,
            images,
            rentPerCycle: form.rentPerCycle,
            tags: form.tagsText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            frameConfig: form.frameConfig,
            batteryConfig: form.batteryConfig,
            rentWithoutBattery: form.rentWithoutBattery ?? undefined,
            rentWithBattery: form.rentWithBattery ?? undefined
        });
        Message.success('保存成功');
        visible.value = false;
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '保存失败');
    }
}
onMounted(load);
onMounted(async () => {
    try {
        categories.value = await listCategories();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '分类加载失败');
    }
});
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "left" },
});
const __VLS_0 = {}.AInputSearch;
/** @type {[typeof __VLS_components.AInputSearch, typeof __VLS_components.aInputSearch, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSearch': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索车型名称",
    ...{ style: {} },
    allowClear: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSearch': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索车型名称",
    ...{ style: {} },
    allowClear: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSearch: (__VLS_ctx.onSearch)
};
const __VLS_8 = {
    onClear: (__VLS_ctx.onSearch)
};
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-hint" },
});
const __VLS_9 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_11 = __VLS_10({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onClick: (__VLS_ctx.openCreate)
};
__VLS_12.slots.default;
var __VLS_12;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_17 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}));
const __VLS_19 = __VLS_18({
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
const __VLS_21 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑商品' : '新增商品'),
}));
const __VLS_23 = __VLS_22({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑商品' : '新增商品'),
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
let __VLS_25;
let __VLS_26;
let __VLS_27;
const __VLS_28 = {
    onOk: (__VLS_ctx.save)
};
__VLS_24.slots.default;
const __VLS_29 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    model: (__VLS_ctx.form),
    layout: "vertical",
}));
const __VLS_31 = __VLS_30({
    model: (__VLS_ctx.form),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
const __VLS_33 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    label: "商品图片（可多图，第一张为封面）",
    field: "images",
}));
const __VLS_35 = __VLS_34({
    label: "商品图片（可多图，第一张为封面）",
    field: "images",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
const __VLS_37 = {}.AUpload;
/** @type {[typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "image/*",
    multiple: true,
}));
const __VLS_39 = __VLS_38({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "image/*",
    multiple: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
let __VLS_41;
let __VLS_42;
let __VLS_43;
const __VLS_44 = {
    onChange: (__VLS_ctx.onSelectFiles)
};
__VLS_40.slots.default;
{
    const { 'upload-button': __VLS_thisSlot } = __VLS_40.slots;
    const __VLS_45 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        loading: (__VLS_ctx.uploading),
    }));
    const __VLS_47 = __VLS_46({
        loading: (__VLS_ctx.uploading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    __VLS_48.slots.default;
    var __VLS_48;
}
var __VLS_40;
const __VLS_49 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    ...{ style: {} },
    type: "info",
    showIcon: (true),
    title: "建议至少上传 1 张图片；第一张作为封面，H5 详情页轮播展示。",
}));
const __VLS_51 = __VLS_50({
    ...{ style: {} },
    type: "info",
    showIcon: (true),
    title: "建议至少上传 1 张图片；第一张作为封面，H5 详情页轮播展示。",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
if (__VLS_ctx.form.images.length) {
    const __VLS_53 = {}.ASpace;
    /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        wrap: true,
        size: "medium",
        ...{ style: {} },
    }));
    const __VLS_55 = __VLS_54({
        wrap: true,
        size: "medium",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    __VLS_56.slots.default;
    for (const [url, idx] of __VLS_getVForSourceType((__VLS_ctx.form.images))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (url + idx),
            ...{ class: "image-card" },
        });
        const __VLS_57 = {}.AImage;
        /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
        // @ts-ignore
        const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
            src: (url),
            width: "96",
            height: "96",
            fit: "cover",
        }));
        const __VLS_59 = __VLS_58({
            src: (url),
            width: "96",
            height: "96",
            fit: "cover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_58));
        const __VLS_61 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
            size: "mini",
            wrap: true,
            ...{ class: "image-actions" },
        }));
        const __VLS_63 = __VLS_62({
            size: "mini",
            wrap: true,
            ...{ class: "image-actions" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_62));
        __VLS_64.slots.default;
        if (idx === 0) {
            const __VLS_65 = {}.ATag;
            /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
            // @ts-ignore
            const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
                bordered: true,
            }));
            const __VLS_67 = __VLS_66({
                bordered: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_66));
            __VLS_68.slots.default;
            var __VLS_68;
        }
        const __VLS_69 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }));
        const __VLS_71 = __VLS_70({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_70));
        let __VLS_73;
        let __VLS_74;
        let __VLS_75;
        const __VLS_76 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.setAsCover(idx);
            }
        };
        __VLS_72.slots.default;
        var __VLS_72;
        const __VLS_77 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }));
        const __VLS_79 = __VLS_78({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_78));
        let __VLS_81;
        let __VLS_82;
        let __VLS_83;
        const __VLS_84 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.moveImage(idx, -1);
            }
        };
        __VLS_80.slots.default;
        var __VLS_80;
        const __VLS_85 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === __VLS_ctx.form.images.length - 1),
        }));
        const __VLS_87 = __VLS_86({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === __VLS_ctx.form.images.length - 1),
        }, ...__VLS_functionalComponentArgsRest(__VLS_86));
        let __VLS_89;
        let __VLS_90;
        let __VLS_91;
        const __VLS_92 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.moveImage(idx, 1);
            }
        };
        __VLS_88.slots.default;
        var __VLS_88;
        const __VLS_93 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
            ...{ 'onClick': {} },
            size: "mini",
            status: "danger",
        }));
        const __VLS_95 = __VLS_94({
            ...{ 'onClick': {} },
            size: "mini",
            status: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_94));
        let __VLS_97;
        let __VLS_98;
        let __VLS_99;
        const __VLS_100 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.removeImage(idx);
            }
        };
        __VLS_96.slots.default;
        var __VLS_96;
        var __VLS_64;
    }
    var __VLS_56;
}
var __VLS_36;
const __VLS_101 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
    label: "名称",
    field: "name",
}));
const __VLS_103 = __VLS_102({
    label: "名称",
    field: "name",
}, ...__VLS_functionalComponentArgsRest(__VLS_102));
__VLS_104.slots.default;
const __VLS_105 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
    modelValue: (__VLS_ctx.form.name),
}));
const __VLS_107 = __VLS_106({
    modelValue: (__VLS_ctx.form.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_106));
var __VLS_104;
const __VLS_109 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
    label: "车型分类",
}));
const __VLS_111 = __VLS_110({
    label: "车型分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_110));
__VLS_112.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cascader-row" },
});
const __VLS_113 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.form.brandId),
    placeholder: "选择品牌",
    options: (__VLS_ctx.brandOptions),
    allowClear: true,
    ...{ style: {} },
}));
const __VLS_115 = __VLS_114({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.form.brandId),
    placeholder: "选择品牌",
    options: (__VLS_ctx.brandOptions),
    allowClear: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_114));
let __VLS_117;
let __VLS_118;
let __VLS_119;
const __VLS_120 = {
    onChange: (__VLS_ctx.onBrandChange)
};
var __VLS_116;
const __VLS_121 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.form.seriesId),
    placeholder: "选择系列",
    options: (__VLS_ctx.seriesOptions),
    allowClear: true,
    disabled: (!__VLS_ctx.form.brandId),
    ...{ style: {} },
}));
const __VLS_123 = __VLS_122({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.form.seriesId),
    placeholder: "选择系列",
    options: (__VLS_ctx.seriesOptions),
    allowClear: true,
    disabled: (!__VLS_ctx.form.brandId),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_122));
let __VLS_125;
let __VLS_126;
let __VLS_127;
const __VLS_128 = {
    onChange: (__VLS_ctx.onSeriesChange)
};
var __VLS_124;
const __VLS_129 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({
    modelValue: (__VLS_ctx.form.categoryId),
    placeholder: "选择型号",
    options: (__VLS_ctx.modelOptions),
    allowClear: true,
    disabled: (!__VLS_ctx.form.seriesId),
    ...{ style: {} },
}));
const __VLS_131 = __VLS_130({
    modelValue: (__VLS_ctx.form.categoryId),
    placeholder: "选择型号",
    options: (__VLS_ctx.modelOptions),
    allowClear: true,
    disabled: (!__VLS_ctx.form.seriesId),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_130));
if (!__VLS_ctx.brandOptions.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_133 = {}.AAlert;
    /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
    // @ts-ignore
    const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
        type: "warning",
    }));
    const __VLS_135 = __VLS_134({
        type: "warning",
    }, ...__VLS_functionalComponentArgsRest(__VLS_134));
    __VLS_136.slots.default;
    var __VLS_136;
}
var __VLS_112;
const __VLS_137 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_138 = __VLS_asFunctionalComponent(__VLS_137, new __VLS_137({
    label: "租金/期（元）",
    field: "rentPerCycle",
}));
const __VLS_139 = __VLS_138({
    label: "租金/期（元）",
    field: "rentPerCycle",
}, ...__VLS_functionalComponentArgsRest(__VLS_138));
__VLS_140.slots.default;
const __VLS_141 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_142 = __VLS_asFunctionalComponent(__VLS_141, new __VLS_141({
    modelValue: (__VLS_ctx.form.rentPerCycle),
    min: (1),
}));
const __VLS_143 = __VLS_142({
    modelValue: (__VLS_ctx.form.rentPerCycle),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_142));
var __VLS_140;
const __VLS_145 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_146 = __VLS_asFunctionalComponent(__VLS_145, new __VLS_145({
    label: "标签（逗号分隔）",
    field: "tagsText",
}));
const __VLS_147 = __VLS_146({
    label: "标签（逗号分隔）",
    field: "tagsText",
}, ...__VLS_functionalComponentArgsRest(__VLS_146));
__VLS_148.slots.default;
const __VLS_149 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_150 = __VLS_asFunctionalComponent(__VLS_149, new __VLS_149({
    modelValue: (__VLS_ctx.form.tagsText),
    placeholder: "例如：续航,通勤,分期",
}));
const __VLS_151 = __VLS_150({
    modelValue: (__VLS_ctx.form.tagsText),
    placeholder: "例如：续航,通勤,分期",
}, ...__VLS_functionalComponentArgsRest(__VLS_150));
var __VLS_148;
const __VLS_153 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_154 = __VLS_asFunctionalComponent(__VLS_153, new __VLS_153({
    label: "车架配置",
    field: "frameConfig",
}));
const __VLS_155 = __VLS_154({
    label: "车架配置",
    field: "frameConfig",
}, ...__VLS_functionalComponentArgsRest(__VLS_154));
__VLS_156.slots.default;
const __VLS_157 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_158 = __VLS_asFunctionalComponent(__VLS_157, new __VLS_157({
    modelValue: (__VLS_ctx.form.frameConfig),
    placeholder: "例如：铝合金车架、碳钢车架",
}));
const __VLS_159 = __VLS_158({
    modelValue: (__VLS_ctx.form.frameConfig),
    placeholder: "例如：铝合金车架、碳钢车架",
}, ...__VLS_functionalComponentArgsRest(__VLS_158));
var __VLS_156;
const __VLS_161 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_162 = __VLS_asFunctionalComponent(__VLS_161, new __VLS_161({
    label: "电池配置（下单可选）",
}));
const __VLS_163 = __VLS_162({
    label: "电池配置（下单可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_162));
__VLS_164.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "battery-config-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "battery-option" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "option-header" },
});
const __VLS_165 = {}.ATag;
/** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
// @ts-ignore
const __VLS_166 = __VLS_asFunctionalComponent(__VLS_165, new __VLS_165({
    color: "blue",
}));
const __VLS_167 = __VLS_166({
    color: "blue",
}, ...__VLS_functionalComponentArgsRest(__VLS_166));
__VLS_168.slots.default;
var __VLS_168;
const __VLS_169 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_170 = __VLS_asFunctionalComponent(__VLS_169, new __VLS_169({
    label: "空车租金/期（元）",
    ...{ style: {} },
}));
const __VLS_171 = __VLS_170({
    label: "空车租金/期（元）",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_170));
__VLS_172.slots.default;
const __VLS_173 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_174 = __VLS_asFunctionalComponent(__VLS_173, new __VLS_173({
    modelValue: (__VLS_ctx.form.rentWithoutBattery),
    min: (0),
    placeholder: "必填",
    ...{ style: {} },
}));
const __VLS_175 = __VLS_174({
    modelValue: (__VLS_ctx.form.rentWithoutBattery),
    min: (0),
    placeholder: "必填",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_174));
var __VLS_172;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "battery-option" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "option-header" },
});
const __VLS_177 = {}.ATag;
/** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
// @ts-ignore
const __VLS_178 = __VLS_asFunctionalComponent(__VLS_177, new __VLS_177({
    color: "green",
}));
const __VLS_179 = __VLS_178({
    color: "green",
}, ...__VLS_functionalComponentArgsRest(__VLS_178));
__VLS_180.slots.default;
var __VLS_180;
const __VLS_181 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_182 = __VLS_asFunctionalComponent(__VLS_181, new __VLS_181({
    label: "电池型号/规格",
    ...{ style: {} },
}));
const __VLS_183 = __VLS_182({
    label: "电池型号/规格",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_182));
__VLS_184.slots.default;
const __VLS_185 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_186 = __VLS_asFunctionalComponent(__VLS_185, new __VLS_185({
    modelValue: (__VLS_ctx.form.batteryConfig),
    placeholder: "例如：48V20Ah锂电池",
}));
const __VLS_187 = __VLS_186({
    modelValue: (__VLS_ctx.form.batteryConfig),
    placeholder: "例如：48V20Ah锂电池",
}, ...__VLS_functionalComponentArgsRest(__VLS_186));
var __VLS_184;
const __VLS_189 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_190 = __VLS_asFunctionalComponent(__VLS_189, new __VLS_189({
    label: "含电池租金/期（元）",
    ...{ style: {} },
}));
const __VLS_191 = __VLS_190({
    label: "含电池租金/期（元）",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_190));
__VLS_192.slots.default;
const __VLS_193 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_194 = __VLS_asFunctionalComponent(__VLS_193, new __VLS_193({
    modelValue: (__VLS_ctx.form.rentWithBattery),
    min: (0),
    placeholder: "不填则不提供此选项",
    ...{ style: {} },
}));
const __VLS_195 = __VLS_194({
    modelValue: (__VLS_ctx.form.rentWithBattery),
    min: (0),
    placeholder: "不填则不提供此选项",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_194));
var __VLS_192;
var __VLS_164;
var __VLS_32;
var __VLS_24;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['left']} */ ;
/** @type {__VLS_StyleScopedClasses['right']} */ ;
/** @type {__VLS_StyleScopedClasses['info-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['image-card']} */ ;
/** @type {__VLS_StyleScopedClasses['image-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['cascader-row']} */ ;
/** @type {__VLS_StyleScopedClasses['battery-config-section']} */ ;
/** @type {__VLS_StyleScopedClasses['battery-option']} */ ;
/** @type {__VLS_StyleScopedClasses['option-header']} */ ;
/** @type {__VLS_StyleScopedClasses['battery-option']} */ ;
/** @type {__VLS_StyleScopedClasses['option-header']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            visible: visible,
            uploading: uploading,
            searchKeyword: searchKeyword,
            brandOptions: brandOptions,
            seriesOptions: seriesOptions,
            modelOptions: modelOptions,
            onBrandChange: onBrandChange,
            onSeriesChange: onSeriesChange,
            filteredRows: filteredRows,
            onSearch: onSearch,
            columns: columns,
            form: form,
            openCreate: openCreate,
            setAsCover: setAsCover,
            moveImage: moveImage,
            removeImage: removeImage,
            onSelectFiles: onSelectFiles,
            save: save,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
