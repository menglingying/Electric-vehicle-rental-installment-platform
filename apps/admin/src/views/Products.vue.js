import { h, onMounted, reactive, ref, computed } from 'vue';
import { Button, Message, Tag, Modal } from '@arco-design/web-vue';
import { listProducts, uploadProductImage, upsertProduct, deleteProduct } from '@/services/api';
const rows = ref([]);
const visible = ref(false);
const uploading = ref(false);
const searchKeyword = ref('');
// 搜索过滤后的商品列表（按名称首字母分组排序）
const filteredRows = computed(() => {
    let list = rows.value;
    // 搜索过滤
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (keyword) {
        list = list.filter(p => p.name.toLowerCase().includes(keyword) ||
            p.id.toLowerCase().includes(keyword) ||
            (p.frameConfig || '').toLowerCase().includes(keyword) ||
            (p.batteryConfig || '').toLowerCase().includes(keyword));
    }
    // 按名称首字母分组排序（m开头的在一起，n开头的在一起...）
    return [...list].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        // 先按首字母排序
        const firstCharA = nameA.charAt(0);
        const firstCharB = nameB.charAt(0);
        if (firstCharA !== firstCharB) {
            return firstCharA.localeCompare(firstCharB);
        }
        // 首字母相同则按完整名称排序
        return nameA.localeCompare(nameB);
    });
});
function onSearch() {
    // 搜索时自动触发computed重新计算
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
        title: '电池配置/价格',
        render: ({ record }) => {
            const items = [];
            const withoutBattery = record.rentWithoutBattery ?? record.rentPerCycle;
            items.push(h('div', { style: 'white-space: nowrap' }, `空车: ￥${withoutBattery}/期`));
            if (record.rentWithBattery != null) {
                const batteryName = record.batteryConfig || '含电池';
                items.push(h('div', { style: 'white-space: nowrap' }, `${batteryName}: ￥${record.rentWithBattery}/期`));
            }
            return h('div', { style: 'display: flex; flex-direction: column; gap: 4px' }, items);
        }
    },
    {
        title: '标签',
        render: ({ record }) => {
            return h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap' }, (record.tags ?? []).map((t) => h(Tag, { bordered: true }, () => t)));
        }
    },
    {
        title: '操作',
        render: ({ record }) => {
            return h('div', { style: 'display: flex; gap: 8px' }, [
                h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑'),
                h(Button, { size: 'small', status: 'danger', onClick: () => confirmDelete(record) }, () => '删除')
            ]);
        }
    }
];
const form = reactive({
    id: '',
    name: '',
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
    const items = fileItem ? [fileItem] : (fileList ?? []);
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
    const images = (form.images ?? []).map((s) => String(s).trim()).filter(Boolean);
    try {
        await upsertProduct({
            id: form.id || undefined,
            name: form.name,
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: "商品管理",
}));
const __VLS_2 = __VLS_1({
    title: "商品管理",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "left" },
});
const __VLS_4 = {}.AInputSearch;
/** @type {[typeof __VLS_components.AInputSearch, typeof __VLS_components.aInputSearch, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onSearch': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索车型名称",
    ...{ style: {} },
    allowClear: true,
}));
const __VLS_6 = __VLS_5({
    ...{ 'onSearch': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    placeholder: "搜索车型名称",
    ...{ style: {} },
    allowClear: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onSearch: (__VLS_ctx.onSearch)
};
const __VLS_12 = {
    onClear: (__VLS_ctx.onSearch)
};
var __VLS_7;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hint" },
});
const __VLS_13 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_15 = __VLS_14({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
let __VLS_17;
let __VLS_18;
let __VLS_19;
const __VLS_20 = {
    onClick: (__VLS_ctx.openCreate)
};
__VLS_16.slots.default;
var __VLS_16;
const __VLS_21 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}));
const __VLS_23 = __VLS_22({
    data: (__VLS_ctx.filteredRows),
    columns: (__VLS_ctx.columns),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
var __VLS_3;
const __VLS_25 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑商品' : '新增商品'),
}));
const __VLS_27 = __VLS_26({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑商品' : '新增商品'),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
let __VLS_29;
let __VLS_30;
let __VLS_31;
const __VLS_32 = {
    onOk: (__VLS_ctx.save)
};
__VLS_28.slots.default;
const __VLS_33 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    model: (__VLS_ctx.form),
    layout: "vertical",
}));
const __VLS_35 = __VLS_34({
    model: (__VLS_ctx.form),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
const __VLS_37 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    label: "商品图片（可多图，第一张为封面）",
    field: "images",
}));
const __VLS_39 = __VLS_38({
    label: "商品图片（可多图，第一张为封面）",
    field: "images",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_40.slots.default;
const __VLS_41 = {}.AUpload;
/** @type {[typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, typeof __VLS_components.AUpload, typeof __VLS_components.aUpload, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "image/*",
    multiple: true,
}));
const __VLS_43 = __VLS_42({
    ...{ 'onChange': {} },
    showFileList: (false),
    autoUpload: (false),
    accept: "image/*",
    multiple: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
let __VLS_45;
let __VLS_46;
let __VLS_47;
const __VLS_48 = {
    onChange: (__VLS_ctx.onSelectFiles)
};
__VLS_44.slots.default;
{
    const { 'upload-button': __VLS_thisSlot } = __VLS_44.slots;
    const __VLS_49 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        loading: (__VLS_ctx.uploading),
    }));
    const __VLS_51 = __VLS_50({
        loading: (__VLS_ctx.uploading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    var __VLS_52;
}
var __VLS_44;
const __VLS_53 = {}.AAlert;
/** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    ...{ style: {} },
    type: "info",
    showIcon: (true),
    title: "建议至少上传 1 张图片；第一张会作为封面展示，H5 详情页会轮播展示所有图片。",
}));
const __VLS_55 = __VLS_54({
    ...{ style: {} },
    type: "info",
    showIcon: (true),
    title: "建议至少上传 1 张图片；第一张会作为封面展示，H5 详情页会轮播展示所有图片。",
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
if (__VLS_ctx.form.images.length) {
    const __VLS_57 = {}.ASpace;
    /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        wrap: true,
        size: "medium",
        ...{ style: {} },
    }));
    const __VLS_59 = __VLS_58({
        wrap: true,
        size: "medium",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    __VLS_60.slots.default;
    for (const [url, idx] of __VLS_getVForSourceType((__VLS_ctx.form.images))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (url + idx),
            ...{ class: "image-card" },
        });
        const __VLS_61 = {}.AImage;
        /** @type {[typeof __VLS_components.AImage, typeof __VLS_components.aImage, ]} */ ;
        // @ts-ignore
        const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
            src: (url),
            width: "96",
            height: "96",
            fit: "cover",
        }));
        const __VLS_63 = __VLS_62({
            src: (url),
            width: "96",
            height: "96",
            fit: "cover",
        }, ...__VLS_functionalComponentArgsRest(__VLS_62));
        const __VLS_65 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
            size: "mini",
            wrap: true,
            ...{ class: "image-actions" },
        }));
        const __VLS_67 = __VLS_66({
            size: "mini",
            wrap: true,
            ...{ class: "image-actions" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_66));
        __VLS_68.slots.default;
        if (idx === 0) {
            const __VLS_69 = {}.ATag;
            /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
            // @ts-ignore
            const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
                bordered: true,
            }));
            const __VLS_71 = __VLS_70({
                bordered: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_70));
            __VLS_72.slots.default;
            var __VLS_72;
        }
        const __VLS_73 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }));
        const __VLS_75 = __VLS_74({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_74));
        let __VLS_77;
        let __VLS_78;
        let __VLS_79;
        const __VLS_80 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.setAsCover(idx);
            }
        };
        __VLS_76.slots.default;
        var __VLS_76;
        const __VLS_81 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }));
        const __VLS_83 = __VLS_82({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === 0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_82));
        let __VLS_85;
        let __VLS_86;
        let __VLS_87;
        const __VLS_88 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.moveImage(idx, -1);
            }
        };
        __VLS_84.slots.default;
        var __VLS_84;
        const __VLS_89 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === __VLS_ctx.form.images.length - 1),
        }));
        const __VLS_91 = __VLS_90({
            ...{ 'onClick': {} },
            size: "mini",
            disabled: (idx === __VLS_ctx.form.images.length - 1),
        }, ...__VLS_functionalComponentArgsRest(__VLS_90));
        let __VLS_93;
        let __VLS_94;
        let __VLS_95;
        const __VLS_96 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.moveImage(idx, 1);
            }
        };
        __VLS_92.slots.default;
        var __VLS_92;
        const __VLS_97 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
            ...{ 'onClick': {} },
            size: "mini",
            status: "danger",
        }));
        const __VLS_99 = __VLS_98({
            ...{ 'onClick': {} },
            size: "mini",
            status: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_98));
        let __VLS_101;
        let __VLS_102;
        let __VLS_103;
        const __VLS_104 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.images.length))
                    return;
                __VLS_ctx.removeImage(idx);
            }
        };
        __VLS_100.slots.default;
        var __VLS_100;
        var __VLS_68;
    }
    var __VLS_60;
}
var __VLS_40;
const __VLS_105 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
    label: "名称",
    field: "name",
}));
const __VLS_107 = __VLS_106({
    label: "名称",
    field: "name",
}, ...__VLS_functionalComponentArgsRest(__VLS_106));
__VLS_108.slots.default;
const __VLS_109 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
    modelValue: (__VLS_ctx.form.name),
}));
const __VLS_111 = __VLS_110({
    modelValue: (__VLS_ctx.form.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_110));
var __VLS_108;
const __VLS_113 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
    label: "租金/期（元）",
    field: "rentPerCycle",
}));
const __VLS_115 = __VLS_114({
    label: "租金/期（元）",
    field: "rentPerCycle",
}, ...__VLS_functionalComponentArgsRest(__VLS_114));
__VLS_116.slots.default;
const __VLS_117 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
    modelValue: (__VLS_ctx.form.rentPerCycle),
    min: (1),
}));
const __VLS_119 = __VLS_118({
    modelValue: (__VLS_ctx.form.rentPerCycle),
    min: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_118));
var __VLS_116;
const __VLS_121 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({
    label: "标签（逗号分隔）",
    field: "tagsText",
}));
const __VLS_123 = __VLS_122({
    label: "标签（逗号分隔）",
    field: "tagsText",
}, ...__VLS_functionalComponentArgsRest(__VLS_122));
__VLS_124.slots.default;
const __VLS_125 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_126 = __VLS_asFunctionalComponent(__VLS_125, new __VLS_125({
    modelValue: (__VLS_ctx.form.tagsText),
    placeholder: "例如：续航,通勤,分期",
}));
const __VLS_127 = __VLS_126({
    modelValue: (__VLS_ctx.form.tagsText),
    placeholder: "例如：续航,通勤,分期",
}, ...__VLS_functionalComponentArgsRest(__VLS_126));
var __VLS_124;
const __VLS_129 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({
    label: "车架配置",
    field: "frameConfig",
}));
const __VLS_131 = __VLS_130({
    label: "车架配置",
    field: "frameConfig",
}, ...__VLS_functionalComponentArgsRest(__VLS_130));
__VLS_132.slots.default;
const __VLS_133 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
    modelValue: (__VLS_ctx.form.frameConfig),
    placeholder: "例如：铝合金车架、碳钢车架",
}));
const __VLS_135 = __VLS_134({
    modelValue: (__VLS_ctx.form.frameConfig),
    placeholder: "例如：铝合金车架、碳钢车架",
}, ...__VLS_functionalComponentArgsRest(__VLS_134));
var __VLS_132;
const __VLS_137 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_138 = __VLS_asFunctionalComponent(__VLS_137, new __VLS_137({
    label: "电池配置（客户下单时可选）",
}));
const __VLS_139 = __VLS_138({
    label: "电池配置（客户下单时可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_138));
__VLS_140.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "battery-config-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "battery-option" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "option-header" },
});
const __VLS_141 = {}.ATag;
/** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
// @ts-ignore
const __VLS_142 = __VLS_asFunctionalComponent(__VLS_141, new __VLS_141({
    color: "blue",
}));
const __VLS_143 = __VLS_142({
    color: "blue",
}, ...__VLS_functionalComponentArgsRest(__VLS_142));
__VLS_144.slots.default;
var __VLS_144;
const __VLS_145 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_146 = __VLS_asFunctionalComponent(__VLS_145, new __VLS_145({
    label: "空车租金/期（元）",
    ...{ style: {} },
}));
const __VLS_147 = __VLS_146({
    label: "空车租金/期（元）",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_146));
__VLS_148.slots.default;
const __VLS_149 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_150 = __VLS_asFunctionalComponent(__VLS_149, new __VLS_149({
    modelValue: (__VLS_ctx.form.rentWithoutBattery),
    min: (0),
    placeholder: "必填",
    ...{ style: {} },
}));
const __VLS_151 = __VLS_150({
    modelValue: (__VLS_ctx.form.rentWithoutBattery),
    min: (0),
    placeholder: "必填",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_150));
var __VLS_148;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "battery-option" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "option-header" },
});
const __VLS_153 = {}.ATag;
/** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
// @ts-ignore
const __VLS_154 = __VLS_asFunctionalComponent(__VLS_153, new __VLS_153({
    color: "green",
}));
const __VLS_155 = __VLS_154({
    color: "green",
}, ...__VLS_functionalComponentArgsRest(__VLS_154));
__VLS_156.slots.default;
var __VLS_156;
const __VLS_157 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_158 = __VLS_asFunctionalComponent(__VLS_157, new __VLS_157({
    label: "电池型号/规格",
    ...{ style: {} },
}));
const __VLS_159 = __VLS_158({
    label: "电池型号/规格",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_158));
__VLS_160.slots.default;
const __VLS_161 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_162 = __VLS_asFunctionalComponent(__VLS_161, new __VLS_161({
    modelValue: (__VLS_ctx.form.batteryConfig),
    placeholder: "例如：48V20Ah锂电池",
}));
const __VLS_163 = __VLS_162({
    modelValue: (__VLS_ctx.form.batteryConfig),
    placeholder: "例如：48V20Ah锂电池",
}, ...__VLS_functionalComponentArgsRest(__VLS_162));
var __VLS_160;
const __VLS_165 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_166 = __VLS_asFunctionalComponent(__VLS_165, new __VLS_165({
    label: "含电池租金/期（元）",
    ...{ style: {} },
}));
const __VLS_167 = __VLS_166({
    label: "含电池租金/期（元）",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_166));
__VLS_168.slots.default;
const __VLS_169 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_170 = __VLS_asFunctionalComponent(__VLS_169, new __VLS_169({
    modelValue: (__VLS_ctx.form.rentWithBattery),
    min: (0),
    placeholder: "不填则不提供此选项",
    ...{ style: {} },
}));
const __VLS_171 = __VLS_170({
    modelValue: (__VLS_ctx.form.rentWithBattery),
    min: (0),
    placeholder: "不填则不提供此选项",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_170));
var __VLS_168;
var __VLS_140;
var __VLS_36;
var __VLS_28;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['left']} */ ;
/** @type {__VLS_StyleScopedClasses['right']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['image-card']} */ ;
/** @type {__VLS_StyleScopedClasses['image-actions']} */ ;
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
