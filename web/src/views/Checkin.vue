<template>
  <div>
    <el-row :gutter="16">
      <!-- 状态卡片 -->
      <el-col :span="14">
        <el-card class="status-card">
          <template #header><b>签到状态</b></template>

          <template v-if="status.active">
            <div class="active-box">
              <div class="active-dot"></div>
              <div>
                <div class="active-text">已签到</div>
                <div class="active-time">开始时间：{{ status.active.checkin_time }}</div>
                <div class="active-timer">本次已持续 {{ elapsedText }}</div>
                <div v-if="status.todaySessions > 1" class="today-hint">今日第 {{ status.todaySessions }} 次签到</div>
              </div>
            </div>
            <el-button type="danger" size="large" class="big-btn" :loading="loading" @click="onCheckout">
              签 退
            </el-button>
          </template>

          <template v-else>
            <el-empty description="当前未签到" :image-size="80" />
            <el-input v-model="code" size="large" maxlength="6" placeholder="输入 6 位动态签到码（或扫描现场二维码）"
              class="code-input" @keyup.enter="onCheckin">
              <template #prepend><el-icon><Key /></el-icon></template>
            </el-input>
            <el-button type="primary" size="large" class="big-btn" :loading="loading" @click="onCheckin">
              签 到
            </el-button>
            <div class="hint">请向管理员获取屏幕上的动态二维码，扫码后自动填入；签到码 60 秒内有效。</div>
          </template>
        </el-card>
      </el-col>

      <!-- 今日汇总 -->
      <el-col :span="10">
        <el-card>
          <template #header><b>今日汇总</b></template>
          <el-statistic title="今日累计时长" :value="status.todayMinutes || 0" suffix="分钟" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../api/request';

const route = useRoute();
const status = reactive({ active: null, todayMinutes: 0, todaySessions: 0 });
const code = ref('');
const loading = ref(false);
const nowTick = ref(Date.now());
let timer;

const elapsedText = computed(() => {
  if (!status.active) return '00:00:00';
  const sec = Math.max(0, Math.floor((nowTick.value - new Date(status.active.checkin_time.replace(' ', 'T')).getTime()) / 1000));
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
});

async function loadStatus() {
  const data = await request.get('/checkin/status');
  Object.assign(status, data);
}

async function onCheckin() {
  if (!code.value.trim()) return ElMessage.warning('请输入签到码');
  loading.value = true;
  try {
    const data = await request.post('/checkin/in', { code: code.value });
    ElMessage.success(data.message);
    code.value = '';
    await loadStatus();
  } finally {
    loading.value = false;
  }
}

async function onCheckout() {
  await ElMessageBox.confirm('确认签退？', '提示', { type: 'warning' }).catch(() => Promise.reject());
  loading.value = true;
  try {
    const data = await request.post('/checkin/out');
    ElMessage.success(data.message);
    await loadStatus();
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // 扫码进入时自动填入 ?code=xxx
  if (route.query.code && !status.active) code.value = String(route.query.code);
  await loadStatus();
  timer = setInterval(() => (nowTick.value = Date.now()), 1000);
});
onUnmounted(() => clearInterval(timer));
</script>

<style scoped>
.status-card {
  min-height: 320px;
}
.active-box {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 8px;
}
.active-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #67c23a;
  box-shadow: 0 0 12px #67c23a;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  50% { opacity: 0.4; }
}
.active-text {
  font-size: 26px;
  font-weight: 700;
  color: #67c23a;
}
.active-time,
.today-hint {
  color: #909399;
  margin-top: 4px;
}
.active-timer {
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  color: #303133;
  margin-top: 8px;
}
.code-input {
  margin-bottom: 12px;
}
.big-btn {
  width: 100%;
}
.hint {
  color: #909399;
  font-size: 13px;
  margin-top: 12px;
  line-height: 1.6;
}
</style>
