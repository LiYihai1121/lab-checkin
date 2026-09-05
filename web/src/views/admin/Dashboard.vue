<template>
  <div>
    <el-alert v-if="loadError" class="load-error" type="warning" :closable="false" show-icon
      title="统计数据刷新失败，将在下一轮自动重试" />
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in cards" :key="card.label">
        <el-card class="stat-card">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :lg="14">
        <el-card>
          <template #header><b>近 30 天签到人次</b></template>
          <div ref="trendRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card>
          <template #header><b>累计时长排行 Top 10</b></template>
          <div ref="rankRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 16px">
      <template #header><b>当前在馆人员</b></template>
      <el-table :data="overview.inLabList" stripe>
        <el-table-column prop="name" label="姓名" width="160" />
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column prop="checkin_time" label="签到时间" width="200" />
        <el-table-column label="已持续">
          <template #default="{ row }">{{ elapsed(row.checkin_time) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { EChartsType } from 'echarts/core';
import { ElMessage } from 'element-plus';
import request from '../../api/request';

interface InLabItem {
  id: number;
  checkin_time: string;
  name: string;
  username: string;
}

const overview = ref<{ inLab: number; todayCount: number; totalUsers: number; todayMinutes: number; inLabList: InLabItem[] }>({
  inLab: 0,
  todayCount: 0,
  totalUsers: 0,
  todayMinutes: 0,
  inLabList: []
});
const trendRef = ref<HTMLDivElement | null>(null);
const rankRef = ref<HTMLDivElement | null>(null);
const loadError = ref(false);
let trendChart: EChartsType | null = null;
let rankChart: EChartsType | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let loadInProgress = false;

const cards = computed(() => [
  { label: '当前在馆', value: overview.value.inLab, color: '#67c23a' },
  { label: '今日签到人次', value: overview.value.todayCount, color: '#409eff' },
  { label: '学生总数', value: overview.value.totalUsers, color: '#e6a23c' },
  { label: '今日总时长（分钟）', value: overview.value.todayMinutes, color: '#f56c6c' }
]);

function elapsed(from: unknown) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(String(from).replace(' ', 'T')).getTime()) / 1000));
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}`;
}

async function load() {
  // 上一轮请求未完成时跳过本轮，避免慢网下请求重叠
  if (loadInProgress) return;
  loadInProgress = true;
  try {
    overview.value = await request.get('/stats/overview', { silent: true });
    const daily = await request.get('/stats/daily', { params: { days: 30 }, silent: true });
    trendChart?.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: daily.map((d: any) => d.date) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ type: 'line', smooth: true, areaStyle: {}, data: daily.map((d: any) => d.count), itemStyle: { color: '#409eff' } }]
    });
    const ranking = await request.get('/stats/ranking', { silent: true });
    rankChart?.setOption({
      // 无出勤数据时以居中文字代替空坐标系
      title: {
        show: ranking.length === 0,
        text: '暂无出勤数据',
        left: 'center',
        top: 'middle',
        textStyle: { color: '#b8ab97', fontSize: 13, fontWeight: 500 }
      },
      tooltip: {},
      grid: { left: 80, right: 30, top: 10, bottom: 30 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ranking.map((r: any) => r.name).reverse() },
      series: [{ type: 'bar', data: ranking.map((r: any) => r.minutes || 0).reverse(), itemStyle: { color: '#e6a23c' } }]
    });
    loadError.value = false;
  } catch {
    // 轮询失败静默处理：横幅提示一次，恢复后自动清除，避免反复弹错
    if (!loadError.value) {
      loadError.value = true;
      ElMessage.warning('统计数据刷新失败，稍后自动重试');
    }
  } finally {
    loadInProgress = false;
  }
}

onMounted(async () => {
  // 按需动态加载 echarts core 和只需的图表/组件，进一步减小包体积
  const core = await import('echarts/core');
  const charts = await import('echarts/charts');
  const components = await import('echarts/components');
  const renderers = await import('echarts/renderers');

  const { LineChart, BarChart } = charts;
  const { TooltipComponent, GridComponent } = components;
  const { CanvasRenderer } = renderers;

  // 注册需要的图表与组件到核心（重复注册无害）
  core.use([LineChart, BarChart, TooltipComponent, GridComponent, CanvasRenderer]);

  trendChart = core.init(trendRef.value!);
  rankChart = core.init(rankRef.value!);
  window.addEventListener('resize', onResize);
  await load();
  timer = setInterval(load, 30000);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  window.removeEventListener('resize', onResize);
  trendChart?.dispose();
  rankChart?.dispose();
});
function onResize() {
  trendChart?.resize();
  rankChart?.resize();
}
</script>

<style scoped>
.load-error {
  margin-bottom: 16px;
}
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
}
.stat-label {
  color: #909399;
  margin-top: 6px;
}
.chart {
  height: 320px;
}
</style>
