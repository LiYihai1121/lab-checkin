<template>
  <div class="qr-page">
    <el-card class="qr-card">
      <template #header><b>动态签到二维码</b></template>

      <div v-if="qr.url" class="qr-box">
        <img :src="qr.dataUrl" alt="签到二维码" />
        <div class="code-line">
          签到码：<span class="code-text">{{ qr.code }}</span>
        </div>
        <el-progress type="circle" :percentage="remainPercent" :width="70" :color="remainColor">
          <span class="remain">{{ remain }}s</span>
        </el-progress>
        <div class="actions">
          <el-switch v-model="autoRefresh" active-text="到期自动刷新" />
          <el-button type="primary" :icon="Refresh" :loading="loading" @click="generate">手动刷新</el-button>
        </div>
      </div>

      <el-empty v-else :description="errorMessage || '尚未生成签到码'">
        <el-button type="primary" size="large" :loading="loading" @click="generate">
          {{ errorMessage ? '重试生成' : '生成签到码' }}
        </el-button>
      </el-empty>

      <el-alert class="tip" type="warning" :closable="false"
        title="学生可用手机扫描屏幕上的二维码自动填入，也可手动输入 6 位签到码。二维码 60 秒过期并轮换，防止截图外传。" />
    </el-card>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import QRCode from 'qrcode';
import { Refresh } from '@element-plus/icons-vue';
import request from '../../api/request';

const qr = reactive({ url: '', code: '', dataUrl: '', expiresAt: 0 });
const remain = ref(0);
const autoRefresh = ref(true);
const loading = ref(false);
const errorMessage = ref('');
let timer;

const remainPercent = ref(100);
const remainColor = ref('#67c23a');

async function generate() {
  if (loading.value) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await request.post('/qrcode/generate');
    const url = `${window.location.origin}/checkin?code=${data.code}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
    Object.assign(qr, { ...data, url, dataUrl });
  } catch {
    errorMessage.value = '签到码生成失败，请检查网络后重试';
  } finally {
    loading.value = false;
  }
}

function tick() {
  if (!qr.expiresAt) return;
  remain.value = Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 1000));
  remainPercent.value = Math.round((remain.value / 60) * 100);
  remainColor.value = remain.value > 15 ? '#67c23a' : '#f56c6c';
  if (remain.value === 0 && autoRefresh.value) generate();
}

onMounted(async () => {
  await generate();
  timer = setInterval(tick, 500);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.qr-page {
  display: flex;
  justify-content: center;
}
.qr-card {
  width: 460px;
}
.qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.qr-box img {
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.code-text {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #409eff;
}
.remain {
  font-size: 16px;
  font-weight: 600;
}
.actions {
  display: flex;
  align-items: center;
  gap: 20px;
}
.tip {
  margin-top: 18px;
}
</style>
