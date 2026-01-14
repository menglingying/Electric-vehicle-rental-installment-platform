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
        <van-uploader v-model="facePhotoList" :max-count="1" capture="user" :after-read="(f: any) => uploadImage(f, 'facePhoto')" />
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
      <van-field v-model="form.occupation" label="职业" placeholder="请输入您的职业" />
      <van-field v-model="form.company" label="工作单位" placeholder="请输入工作单位名称" />
      <van-field v-model="form.workCity" label="工作城市" placeholder="请输入工作所在城市" />
    </van-cell-group>

    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-cell title="居住信息" />
      <van-field v-model="form.residenceAddress" label="现居地址" placeholder="请输入详细居住地址" type="textarea" rows="2" />
      <van-field v-model="form.residenceDuration" label="居住时长" placeholder="例如：2年" />
    </van-cell-group>

    <van-cell-group inset v-if="step === 2" style="margin-top: 12px">
      <van-cell title="紧急联系人" />
      <van-field v-model="form.contactName" label="联系人姓名" placeholder="请输入联系人姓名" />
      <van-field v-model="form.contactPhone" label="联系人电话" placeholder="请输入联系人手机号" type="tel" />
      <van-field v-model="form.contactRelation" label="与您的关系" placeholder="例如：父母、配偶、朋友" />
    </van-cell-group>

    <div class="bottom-bar">
      <van-button v-if="step > 0" @click="step--" style="margin-right: 12px">上一步</van-button>
      <van-button v-if="step < 2" type="primary" @click="nextStep" :disabled="!canNext">下一步</van-button>
      <van-button v-if="step === 2" type="primary" :loading="submitting" @click="submit">提交资料</van-button>
    </div>

    <van-cell-group inset style="margin-top: 12px">
      <van-cell>
        <template #title>
          <van-button size="small" plain @click="skipKyc">暂时跳过，稍后补充</van-button>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrder, submitKyc, uploadKycImage } from '@/services/api';

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

async function uploadImage(file: any, field: 'idCardFront' | 'idCardBack' | 'facePhoto') {
  try {
    const res = await uploadKycImage(file.file);
    form[field] = res.url;
    showSuccessToast('上传成功');
  } catch (e: any) {
    showFailToast(e?.response?.data?.message ?? '上传失败');
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
  if (!form.contactName || !form.contactPhone) return showFailToast('请填写紧急联系人信息');

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

function skipKyc() {
  router.replace(`/orders/${orderId.value}`);
}

onMounted(async () => {
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
