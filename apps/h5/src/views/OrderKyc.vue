<template>
  <div class="page kyc-page">
    <van-nav-bar title="补充资料" left-arrow @click-left="router.back()" />

    <div class="h5-card">
      <van-steps :active="step">
        <van-step>身份证</van-step>
        <van-step>人脸自拍</van-step>
        <van-step>个人信息</van-step>
      </van-steps>
    </div>

    <div class="h5-card" v-if="step === 0">
      <div class="section-title">身份证上传</div>
      <div class="upload-area">
        <van-uploader v-model="idCardFrontList" :max-count="1" :after-read="(f: any) => uploadImage(f, 'idCardFront')" />
        <div class="upload-hint">上传身份证正面照片</div>
      </div>

      <div class="upload-area">
        <van-uploader v-model="idCardBackList" :max-count="1" :after-read="(f: any) => uploadImage(f, 'idCardBack')" />
        <div class="upload-hint">上传身份证反面照片</div>
      </div>
    </div>

    <div class="h5-card" v-if="step === 1">
      <div class="section-title">人脸自拍</div>
      <div class="upload-area">
        <van-uploader v-model="facePhotoList" :max-count="1" accept="image/*" :after-read="(f: any) => uploadImage(f, 'facePhoto')" />
        <div class="upload-hint">请正对镜头拍摄清晰的人脸照片</div>
      </div>
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">个人信息</div>
      <van-field v-model="form.realName" label="真实姓名" placeholder="请输入身份证上的姓名" />
      <van-field v-model="form.idCardNumber" label="身份证号" placeholder="请输入18位身份证号" />
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">工作信息</div>
      <van-field
        v-model="employmentStatusLabel"
        label="就业状态"
        placeholder="请选择"
        readonly
        is-link
        @click="showEmploymentSheet = true"
      />
      <van-field v-model="form.employmentName" label="单位/职业" placeholder="请输入单位或职业名称" />
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">收入信息</div>
      <van-field
        v-model="incomeRangeLabel"
        label="月收入区间"
        placeholder="请选择"
        readonly
        is-link
        @click="showIncomeSheet = true"
      />
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">住址信息</div>
      <van-field
        v-model="provinceLabel"
        label="省份"
        placeholder="请选择"
        readonly
        is-link
        @click="showProvinceSheet = true"
      />
      <van-field
        v-model="cityLabel"
        label="城市"
        placeholder="请选择"
        readonly
        is-link
        @click="openCitySheet"
      />
      <van-field
        v-model="districtLabel"
        label="区县"
        placeholder="请选择"
        readonly
        is-link
        @click="openDistrictSheet"
      />
      <van-field v-model="form.homeAddressDetail" label="详细地址" placeholder="请输入详细地址" type="textarea" rows="2" />
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">紧急联系人1</div>
      <van-field v-model="form.contactName" label="联系人1姓名" placeholder="请输入联系人1姓名" />
      <van-field v-model="form.contactPhone" label="联系人1电话" placeholder="请输入联系人1手机号" type="tel" />
      <van-field
        v-model="contactRelationLabels[0]"
        label="联系人1关系"
        placeholder="请选择关系"
        readonly
        is-link
        @click="openContactRelationSheet(0)"
      />
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">紧急联系人2</div>
      <van-field v-model="form.contactName2" label="联系人2姓名" placeholder="请输入联系人2姓名" />
      <van-field v-model="form.contactPhone2" label="联系人2电话" placeholder="请输入联系人2手机号" type="tel" />
      <van-field
        v-model="contactRelationLabels[1]"
        label="联系人2关系"
        placeholder="请选择关系"
        readonly
        is-link
        @click="openContactRelationSheet(1)"
      />
    </div>

    <div class="h5-card" v-if="step === 2">
      <div class="section-title">紧急联系人3</div>
      <van-field v-model="form.contactName3" label="联系人3姓名" placeholder="请输入联系人3姓名" />
      <van-field v-model="form.contactPhone3" label="联系人3电话" placeholder="请输入联系人3手机号" type="tel" />
      <van-field
        v-model="contactRelationLabels[2]"
        label="联系人3关系"
        placeholder="请选择关系"
        readonly
        is-link
        @click="openContactRelationSheet(2)"
      />
    </div>

    <div class="bottom-bar">
      <van-button v-if="step > 0" @click="step--" style="margin-right: 12px">上一步</van-button>
      <van-button v-if="step < 2" type="primary" @click="nextStep">下一步</van-button>
      <van-button v-if="step === 2" type="primary" :loading="submitting" @click="submit">提交资料</van-button>
    </div>

    <van-action-sheet v-model:show="showEmploymentSheet" :actions="employmentActions" @select="onSelectEmployment" />
    <van-action-sheet v-model:show="showIncomeSheet" :actions="incomeActions" @select="onSelectIncome" />
    <van-action-sheet
      v-model:show="showContactRelationSheet"
      title="选择关系"
      :actions="contactRelationActions"
      @select="onSelectContactRelation"
    />
    <van-action-sheet v-model:show="showProvinceSheet" :actions="provinceActions" @select="onSelectProvince" />
    <van-action-sheet v-model:show="showCitySheet" :actions="cityActions" @select="onSelectCity" />
    <van-action-sheet v-model:show="showDistrictSheet" :actions="districtActions" @select="onSelectDistrict" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, listDictItems, listRegions, submitKyc, uploadKycImage } from '@/services/api';

const route = useRoute();
const router = useRouter();
const orderId = computed(() => String(route.params.id));

const step = ref(0);
const submitting = ref(false);

const idCardFrontList = ref<any[]>([]);
const idCardBackList = ref<any[]>([]);
const facePhotoList = ref<any[]>([]);

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
type RelationItem = { code?: string; label?: string; name?: string; value?: string };
const defaultContactRelations: RelationItem[] = [
  { name: '父母', code: 'parent' },
  { name: '配偶', code: 'spouse' },
  { name: '子女', code: 'child' },
  { name: '同事', code: 'colleague' },
  { name: '朋友', code: 'friend' },
  { name: '其他', code: 'other' }
];
type KycDraft = {
  step?: number;
  form?: Partial<typeof form>;
  labels?: {
    employmentStatusLabel?: string;
    incomeRangeLabel?: string;
    contactRelationLabels?: string[];
    provinceLabel?: string;
    cityLabel?: string;
    districtLabel?: string;
  };
  updatedAt?: string;
};
const draftKey = computed(() => `h5_kyc_draft_${orderId.value}`);
const draftReady = ref(false);

function buildFileName(file: File, ext: string) {
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'photo';
  return `${baseName}.${ext}`;
}

function buildUploaderList(url: string) {
  return url ? [{ url }] : [];
}

function syncUploaderLists() {
  idCardFrontList.value = buildUploaderList(form.idCardFront);
  idCardBackList.value = buildUploaderList(form.idCardBack);
  facePhotoList.value = buildUploaderList(form.facePhoto);
}

function loadDraft(): KycDraft | null {
  if (!draftKey.value) return null;
  try {
    const raw = localStorage.getItem(draftKey.value);
    if (!raw) return null;
    return JSON.parse(raw) as KycDraft;
  } catch (err) {
    console.warn('读取草稿失败:', err);
    return null;
  }
}

function saveDraft() {
  if (!draftReady.value || !draftKey.value) return;
  const payload: KycDraft = {
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
  } catch (err) {
    console.warn('保存草稿失败:', err);
  }
}

function clearDraft() {
  if (!draftKey.value) return;
  try {
    localStorage.removeItem(draftKey.value);
  } catch (err) {
    console.warn('清理草稿失败:', err);
  }
}

function applyDraft(draft: KycDraft) {
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

function getContactNameByIndex(index: number) {
  if (index === 0) return form.contactName;
  if (index === 1) return form.contactName2;
  return form.contactName3;
}

function getContactPhoneByIndex(index: number) {
  if (index === 0) return form.contactPhone;
  if (index === 1) return form.contactPhone2;
  return form.contactPhone3;
}

function getContactRelationByIndex(index: number) {
  if (index === 0) return form.contactRelation;
  if (index === 1) return form.contactRelation2;
  return form.contactRelation3;
}

function setContactRelationByIndex(index: number, value: string) {
  if (index === 0) form.contactRelation = value;
  else if (index === 1) form.contactRelation2 = value;
  else form.contactRelation3 = value;
}

function resolveRelationLabel(code: string) {
  if (!code) return '';
  return contactRelationActions.value.find((item) => item.code === code)?.name ?? code;
}

function resolveRelationCode(label: string) {
  if (!label) return '';
  return contactRelationActions.value.find((item) => item.name === label)?.code ?? label;
}

function openContactRelationSheet(index: number) {
  activeContactIndex.value = index;
  showContactRelationSheet.value = true;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
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

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

async function normalizeImage(file: File) {
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
  if (!ctx) throw new Error('canvas_not_supported');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const qualities = file.size > maxUploadBytes ? [0.86, 0.78, 0.7] : [0.9];
  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, quality);
    if (!blob) continue;
    if (blob.size <= maxUploadBytes || qualities.length === 1) {
      return new File([blob], buildFileName(file, 'jpg'), { type: blob.type });
    }
  }

  const fallback = await canvasToBlob(canvas, 0.6);
  if (!fallback) return file;
  return new File([fallback], buildFileName(file, 'jpg'), { type: fallback.type });
}

async function uploadImage(file: any, field: 'idCardFront' | 'idCardBack' | 'facePhoto') {
  let current: any = null;
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

    let normalized = fileObj as File;
    try {
      normalized = await normalizeImage(fileObj);
    } catch (err) {
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
  } catch (e: any) {
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
  if (step.value < 2) step.value++;
}

async function submit() {
  if (!form.realName) return showFailToast('请输入真实姓名');
  if (!form.idCardNumber) return showFailToast('请输入身份证号');
  for (let i = 0; i < 3; i += 1) {
    const name = getContactNameByIndex(i)?.trim();
    const phone = getContactPhoneByIndex(i)?.trim();
    const label = contactRelationLabels.value[i];
    if (!name) return showFailToast(`请输入联系人${i + 1}姓名`);
    if (!phone) return showFailToast(`请输入联系人${i + 1}手机号`);
    if (!getContactRelationByIndex(i) && label) {
      setContactRelationByIndex(i, resolveRelationCode(label));
    }
    if (!getContactRelationByIndex(i)) return showFailToast(`请选择联系人${i + 1}关系`);
  }
  if (!form.employmentStatus) return showFailToast('请选择就业状态');
  if (!form.employmentName) return showFailToast('请填写单位/职业');
  if (!form.incomeRangeCode) return showFailToast('请选择月收入区间');
  if (!form.homeProvinceCode || !form.homeCityCode || !form.homeDistrictCode) return showFailToast('请选择完整的住址');
  if (!form.homeAddressDetail) return showFailToast('请输入详细地址');

  submitting.value = true;
  try {
    await submitKyc(orderId.value, form);
    showSuccessToast('资料提交成功');
    clearDraft();
    await router.replace(`/orders/${orderId.value}`);
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '提交失败');
  } finally {
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
          (form as any)[key] = value;
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
  } catch (e: any) {
    showFailToast('订单不存在');
    router.replace('/orders');
  } finally {
    draftReady.value = true;
  }
});

const employmentActions = ref<{ name: string; code: string }[]>([]);
const incomeActions = ref<{ name: string; code: string }[]>([]);
const contactRelationActions = ref<{ name: string; code: string }[]>([]);
const provinceActions = ref<{ name: string; code: string }[]>([]);
const cityActions = ref<{ name: string; code: string }[]>([]);
const districtActions = ref<{ name: string; code: string }[]>([]);

const showEmploymentSheet = ref(false);
const showIncomeSheet = ref(false);
const showContactRelationSheet = ref(false);
const showProvinceSheet = ref(false);
const showCitySheet = ref(false);
const showDistrictSheet = ref(false);

const employmentStatusLabel = ref('');
const incomeRangeLabel = ref('');
const contactRelationLabels = ref<string[]>(['', '', '']);
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
    const relationItems: RelationItem[] = relations.length ? relations : defaultContactRelations;
    contactRelationActions.value = relationItems.map((item) => ({
      name: item.label ?? item.name ?? String(item.code ?? ''),
      code: item.code ?? item.value ?? item.name ?? ''
    }));
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '字典加载失败');
  }
}

async function loadProvinces() {
  try {
    const provinces = await listRegions();
    provinceActions.value = provinces.map((item) => ({ name: item.name, code: item.code }));
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '省份加载失败');
  }
}

async function loadCities(parentCode: string) {
  try {
    const cities = await listRegions(parentCode);
    cityActions.value = cities.map((item) => ({ name: item.name, code: item.code }));
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '城市加载失败');
  }
}

async function loadDistricts(parentCode: string) {
  try {
    const districts = await listRegions(parentCode);
    districtActions.value = districts.map((item) => ({ name: item.name, code: item.code }));
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '区县加载失败');
  }
}

function onSelectEmployment(action: { name: string; code: string }) {
  form.employmentStatus = action.code;
  employmentStatusLabel.value = action.name;
  showEmploymentSheet.value = false;
}

function onSelectIncome(action: { name: string; code: string }) {
  form.incomeRangeCode = action.code;
  incomeRangeLabel.value = action.name;
  showIncomeSheet.value = false;
}

function onSelectContactRelation(action: { name: string; code?: string; value?: string }) {
  const code = action.code ?? action.value ?? action.name;
  const index = activeContactIndex.value;
  setContactRelationByIndex(index, code);
  contactRelationLabels.value[index] = action.name ?? code;
  showContactRelationSheet.value = false;
}

async function onSelectProvince(action: { name: string; code: string }) {
  form.homeProvinceCode = action.code;
  provinceLabel.value = action.name;
  form.homeCityCode = '';
  cityLabel.value = '';
  form.homeDistrictCode = '';
  districtLabel.value = '';
  showProvinceSheet.value = false;
  await loadCities(action.code);
}

async function onSelectCity(action: { name: string; code: string }) {
  form.homeCityCode = action.code;
  cityLabel.value = action.name;
  form.homeDistrictCode = '';
  districtLabel.value = '';
  showCitySheet.value = false;
  await loadDistricts(action.code);
}

function onSelectDistrict(action: { name: string; code: string }) {
  form.homeDistrictCode = action.code;
  districtLabel.value = action.name;
  showDistrictSheet.value = false;
}

function openCitySheet() {
  if (!form.homeProvinceCode) return showFailToast('请先选择省份');
  showCitySheet.value = true;
}

function openDistrictSheet() {
  if (!form.homeCityCode) return showFailToast('请先选择城市');
  showDistrictSheet.value = true;
}

watch(
  () => ({
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
  }),
  () => saveDraft()
);

onBeforeUnmount(() => {
  saveDraft();
});
</script>

<style scoped>
.upload-area {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--h5-muted);
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: #ffffff;
  display: flex;
  justify-content: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}
.bottom-bar .van-button {
  flex: 1;
  max-width: 160px;
}
.kyc-page {
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
</style>
