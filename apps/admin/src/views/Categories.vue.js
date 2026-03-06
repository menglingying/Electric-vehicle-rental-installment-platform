import { h, onMounted, reactive, ref, computed } from 'vue';
import { Button, Message, Modal } from '@arco-design/web-vue';
import { deleteCategory, listCategories, upsertCategory } from '@/services/api';
import { isSuper } from '@/services/auth';
const treeData = ref([]);
const visible = ref(false);
const form = reactive({
    id: '',
    parentId: '',
    name: '',
    sort: 0,
    status: 1
});
const parentOptions = computed(() => {
    const options = [];
    const walk = (nodes, path) => {
        for (const node of nodes) {
            const nextPath = [...path, node.name];
            options.push({ label: nextPath.join(' / '), value: node.id });
            if (node.children?.length)
                walk(node.children, nextPath);
        }
    };
    walk(treeData.value, []);
    return options;
});
const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '层级', dataIndex: 'level' },
    { title: '排序', dataIndex: 'sort' },
    {
        title: '状态',
        render: ({ record }) => (record.status === 1 ? '启用' : '停用')
    },
    {
        title: '操作',
        render: ({ record }) => h('div', { style: 'display:flex; gap:8px' }, [
            h(Button, { size: 'small', onClick: () => openCreate(record.id) }, () => '新增子类'),
            h(Button, { size: 'small', onClick: () => openEdit(record) }, () => '编辑'),
            isSuper()
                ? h(Button, { size: 'small', status: 'danger', onClick: () => confirmDelete(record) }, () => '删除')
                : null
        ])
    }
];
async function load() {
    try {
        treeData.value = await listCategories();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '加载失败');
    }
}
function openCreate(parentId) {
    form.id = '';
    form.parentId = parentId || '';
    form.name = '';
    form.sort = 0;
    form.status = 1;
    visible.value = true;
}
function openEdit(node) {
    form.id = node.id;
    form.parentId = node.parentId || '';
    form.name = node.name;
    form.sort = node.sort;
    form.status = node.status;
    visible.value = true;
}
async function save() {
    if (!form.name.trim())
        return Message.warning('请输入分类名称');
    if (form.parentId && form.parentId === form.id)
        return Message.warning('上级分类不能选择自身');
    try {
        await upsertCategory({
            id: form.id || undefined,
            parentId: form.parentId || undefined,
            name: form.name,
            sort: form.sort,
            status: form.status
        });
        Message.success('保存成功');
        visible.value = false;
        await load();
    }
    catch (e) {
        Message.error(e?.response?.data?.message ?? '保存失败');
    }
}
function confirmDelete(node) {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除分类「${node.name}」吗？`,
        okText: '删除',
        okButtonProps: { status: 'danger' },
        onOk: async () => {
            try {
                await deleteCategory(node.id);
                Message.success('删除成功');
                await load();
            }
            catch (e) {
                Message.error(e?.response?.data?.message ?? '删除失败');
            }
        }
    });
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
const __VLS_0 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.openCreate('');
    }
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
const __VLS_8 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    data: (__VLS_ctx.treeData),
    columns: (__VLS_ctx.columns),
    pagination: (false),
    rowKey: "id",
}));
const __VLS_10 = __VLS_9({
    data: (__VLS_ctx.treeData),
    columns: (__VLS_ctx.columns),
    pagination: (false),
    rowKey: "id",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const __VLS_12 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑分类' : '新增分类'),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onOk': {} },
    visible: (__VLS_ctx.visible),
    title: (__VLS_ctx.form.id ? '编辑分类' : '新增分类'),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onOk: (__VLS_ctx.save)
};
__VLS_15.slots.default;
const __VLS_20 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    model: (__VLS_ctx.form),
    layout: "vertical",
}));
const __VLS_22 = __VLS_21({
    model: (__VLS_ctx.form),
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    label: "上级分类",
}));
const __VLS_26 = __VLS_25({
    label: "上级分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.form.parentId),
    options: (__VLS_ctx.parentOptions),
    allowClear: true,
    placeholder: "大分类无需选择",
}));
const __VLS_30 = __VLS_29({
    modelValue: (__VLS_ctx.form.parentId),
    options: (__VLS_ctx.parentOptions),
    allowClear: true,
    placeholder: "大分类无需选择",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
var __VLS_27;
const __VLS_32 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "分类名称",
    field: "name",
}));
const __VLS_34 = __VLS_33({
    label: "分类名称",
    field: "name",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    modelValue: (__VLS_ctx.form.name),
}));
const __VLS_38 = __VLS_37({
    modelValue: (__VLS_ctx.form.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
var __VLS_35;
const __VLS_40 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "排序",
    field: "sort",
}));
const __VLS_42 = __VLS_41({
    label: "排序",
    field: "sort",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    modelValue: (__VLS_ctx.form.sort),
    min: (0),
}));
const __VLS_46 = __VLS_45({
    modelValue: (__VLS_ctx.form.sort),
    min: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
var __VLS_43;
const __VLS_48 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "状态",
    field: "status",
}));
const __VLS_50 = __VLS_49({
    label: "状态",
    field: "status",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.form.status),
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.form.status),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    value: (1),
}));
const __VLS_58 = __VLS_57({
    value: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
var __VLS_59;
const __VLS_60 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    value: (0),
}));
const __VLS_62 = __VLS_61({
    value: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
var __VLS_63;
var __VLS_55;
var __VLS_51;
var __VLS_23;
var __VLS_15;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['link']} */ ;
/** @type {__VLS_StyleScopedClasses['section-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            treeData: treeData,
            visible: visible,
            form: form,
            parentOptions: parentOptions,
            columns: columns,
            openCreate: openCreate,
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
