<template>
  <div class="page">
    <van-nav-bar title="补充资料" left-arrow @click-left="router.back()" />

    <van-steps :active="step" style="padding: 16px">
      <van-step>身份证</van-step>
      <van-step>人脸自拍</van-step>
      <van-step>个人信息</van-step>
    </van-steps>

    <!-- Step 0: 身份证上传 -->
    <van-cell-group inset v-if="step === 0" style="margin-top: 12px">
      <van-cell title="身份证正面（人像面）" />
      <div class="upload-area">
        <van-uploader v-model="idCardFrontList" :max-count="1" :after-read="(f: any) => uploadImage(f, 'idCardFront')" />
        <div class="upload-hint">点击上传身份证正面照片</div>
      </div>
      
      <van-cell title="身份证反面（国徽面）" style="margin-top: 12px" />
      <div class="upload-area">
        <van-uploader v-model="idCardBackList" :max-count="1" :after-read="(f: any) => uploadImage(f, 'idCardBack')" />
        <div class="upload-hint">点击上传身份证反面照片</div>
      </div>
    </van-cell-group>

    <!-- Step 1: 人脸自拍 -->
    <van-cell-group inset v-if="step === 1" style="margin-top: 12px">
      <van-cell title="人脸自拍照" />
      <div class="upload-area">
        <van-uploader v-model="facePhotoList" :max-count="1" accept="image/*" :after-read="(f: any) => uploadImage(f, 'facePhoto')" />
        <div class="upload-hint">请正对镜头拍摄清晰的人脸照片</div>
      </div>
    </van-cell-group>

    <!-- Step 2: 个人信息 -->
    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-field v-model="form.realName" label="真实姓名" placeholder="请输入身份证上的姓名" />
      <van-field v-model="form.idCardNumber" label="身份证号" placeholder="请输入18位身份证号" />
    </van-cell-group>

    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-cell title="工作信息" />
      <van-field
        v-model="employmentStatusLabel"
        label="就业状态"
        placeholder="请选择"
        readonly
        is-link
        @click="showEmploymentSheet = true"
      />
      <van-field v-model="form.employmentName" label="单位/职业" placeholder="请输入单位或职业名称" />
    </van-cell-group>

    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-cell title="收入信息" />
      <van-field
        v-model="incomeRangeLabel"
        label="月收入区间"
        placeholder="请选择"
        readonly
        is-link
        @click="showIncomeSheet = true"
      />
    </van-cell-group>

    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-cell title="住家地址" />
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
    </van-cell-group>

    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-cell title="紧急联系人" />
      <van-field v-model="form.contactName" label="联系人姓名" placeholder="请输入联系人姓名" />
      <van-field v-model="form.contactPhone" label="联系人电话" placeholder="请输入联系人手机号" type="tel" />
      <van-field
        v-model="contactRelationLabel"
        label="与您的关系"
        placeholder="请选择"
        readonly
        is-link
        @click="showContactRelationSheet = true"
      />
    </van-cell-group>

    <div class="bottom-bar">
      <van-button v-if="step > 0" @click="step--" style="margin-right: 12px">上一步</van-button>
      <van-button v-if="step < 2" type="primary" @click="nextStep" :disabled="!canNext">下一步</van-button>
      <van-button v-if="step === 2" type="primary" :loading="submitting" @click="submit">提交资料</van-button>
    </div>

    <van-action-sheet v-model:show="showEmploymentSheet" :actions="employmentActions" @select="onSelectEmployment" />
    <van-action-sheet v-model:show="showIncomeSheet" :actions="incomeActions" @select="onSelectIncome" />
    <van-action-sheet v-model:show="showContactRelationSheet" :actions="contactRelationActions" @select="onSelectContactRelation" />
    <van-action-sheet v-model:show="showProvinceSheet" :actions="provinceActions" @select="onSelectProvince" />
    <van-action-sheet v-model:show="showCitySheet" :actions="cityActions" @select="onSelectCity" />
    <van-action-sheet v-model:show="showDistrictSheet" :actions="districtActions" @select="onSelectDistrict" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
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

async function uploadImage(file: any, field: 'idCardFront' | 'idCardBack' | 'facePhoto') {
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
  } catch (e: any) {
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
  if (!form.realName) return showFailToast('请输入真实姓名');
  if (!form.idCardNumber) return showFailToast('请输入身份证号');
  if (!form.contactName || !form.contactPhone || !form.contactRelation) return showFailToast('请填写紧急联系人信息');
  if (!form.employmentStatus) return showFailToast('请选择就业状态');
  if (!form.employmentName) return showFailToast('\u8bf7\u586b\u5199\u5355\u4f4d/\u804c\u4e1a');
  if (!form.incomeRangeCode) return showFailToast('请选择月收入区间');
  if (!form.homeProvinceCode || !form.homeCityCode || !form.homeDistrictCode) return showFailToast('请选择完整的住家地址');
  if (!form.homeAddressDetail) return showFailToast('请输入详细地址');

  submitting.value = true;
  try {
    await submitKyc(orderId.value, form);
    showSuccessToast('资料提交成功');
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
    }
  } catch (e: any) {
    showFailToast('订单不存在');
    router.replace('/orders');
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

function onSelectContactRelation(action: { name: string; code: string }) {
  form.contactRelation = action.code;
  contactRelationLabel.value = action.name;
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

</script>

<style scoped>
.page {
  padding-bottom: 100px;
}
.upload-area {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--van-gray-6);
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  display: flex;
  justify-content: center;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
}
.bottom-bar .van-button {
  flex: 1;
  max-width: 160px;
}
</style>
